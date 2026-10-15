import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { UserModel, IUser } from './user.model';
import { SessionModel, ISession } from './session.model';
import { SignupInput, LoginInput } from './auth.schema';
import { ConflictError, UnauthenticatedError } from '@/shared/errors/app-error';
import { ERROR_CODES } from '@/shared/constants';
import { connectToDatabase } from '@/server/db/connection';
import { WeddingMembershipModel } from '../wedding/membership.model';

export const SESSION_DURATION_DAYS = 30;
export const BCRYPT_SALT_ROUNDS = 12;

export interface UserDTO {
  id: string;
  name: string;
  email: string;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function toUserDTO(user: IUser): UserDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

export class AuthService {
  static async signup(input: SignupInput): Promise<{
    user: UserDTO;
    rawToken: string;
    hasWedding: boolean;
  }> {
    await connectToDatabase();

    const emailNormalized = input.email.trim().toLowerCase();

    // Check if account already exists
    const existing = await UserModel.findOne({ emailNormalized });
    if (existing) {
      throw new ConflictError(
        'An account with this email address already exists',
        ERROR_CODES.EMAIL_ALREADY_EXISTS
      );
    }

    const passwordHash = await hashPassword(input.password);

    const user = await UserModel.create({
      name: input.name.trim(),
      email: input.email.trim(),
      emailNormalized,
      passwordHash,
    });

    const rawToken = generateSessionToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    await SessionModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      user: toUserDTO(user),
      rawToken,
      hasWedding: false,
    };
  }

  static async login(input: LoginInput): Promise<{
    user: UserDTO;
    rawToken: string;
    hasWedding: boolean;
  }> {
    await connectToDatabase();

    const emailNormalized = input.email.trim().toLowerCase();

    const user = await UserModel.findOne({ emailNormalized });
    if (!user) {
      // Generic message to prevent email enumeration
      throw new UnauthenticatedError('Invalid email or password');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthenticatedError('Invalid email or password');
    }

    // Check if user belongs to a wedding
    const membership = await WeddingMembershipModel.findOne({ userId: user._id });

    const rawToken = generateSessionToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    await SessionModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      lastUsedAt: new Date(),
    });

    return {
      user: toUserDTO(user),
      rawToken,
      hasWedding: !!membership,
    };
  }

  static async logout(rawToken: string): Promise<void> {
    await connectToDatabase();

    const tokenHash = hashToken(rawToken);
    await SessionModel.deleteOne({ tokenHash });
  }

  static async validateSession(
    rawToken: string
  ): Promise<{ user: UserDTO; session: ISession } | null> {
    if (!rawToken || typeof rawToken !== 'string') return null;

    await connectToDatabase();

    const tokenHash = hashToken(rawToken);
    const session = await SessionModel.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return null;
    }

    const user = await UserModel.findById(session.userId);
    if (!user) {
      // Orphaned session
      await SessionModel.deleteOne({ _id: session._id });
      return null;
    }

    // Touch lastUsedAt asynchronously without blocking
    SessionModel.updateOne({ _id: session._id }, { lastUsedAt: new Date() }).exec();

    return {
      user: toUserDTO(user),
      session,
    };
  }
}
