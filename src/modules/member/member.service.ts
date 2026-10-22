import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/server/db/connection';
import { WeddingMembershipModel } from '@/modules/wedding/membership.model';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { UserModel } from '@/modules/auth/user.model';
import {
  MemberInvitationModel,
  MemberInvitationDTO,
  toMemberInvitationDTO,
} from './member-invitation.model';
import { CreateMemberInvitationInput } from './member.schema';
import { hashToken } from '@/modules/auth/auth.service';
import { USER_ROLES, UserRole, ERROR_CODES } from '@/shared/constants';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  ConflictError,
} from '@/shared/errors/app-error';

export interface WeddingMemberDTO {
  membershipId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: UserRole;
  joinedAt: string;
}

export interface PublicMemberInvitationDTO {
  email: string;
  role: UserRole;
  wedding: {
    id: string;
    brideName: string;
    groomName: string;
    weddingDate: string;
    title: string | null;
  };
  expiresAt: string;
}

export class MemberService {
  /**
   * Lists all active wedding members with their populated user profiles.
   */
  static async listMembers(weddingId: string): Promise<WeddingMemberDTO[]> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const memberships = await WeddingMembershipModel.find({ weddingId: weddingObjectId }).sort({
      joinedAt: 1,
    });

    if (memberships.length === 0) {
      return [];
    }

    const userIds = memberships.map((m) => m.userId);
    const users = await UserModel.find({ _id: { $in: userIds } });
    const userMap = new Map<string, { id: string; name: string; email: string }>();

    for (const u of users) {
      userMap.set(u._id.toString(), {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
      });
    }

    return memberships.map((m) => ({
      membershipId: m._id.toString(),
      user: userMap.get(m.userId.toString()) || {
        id: m.userId.toString(),
        name: 'Wedding Collaborator',
        email: '',
      },
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    }));
  }

  /**
   * Creates a member invitation for an email address with assigned role.
   * Admin only.
   */
  static async createInvitation(
    weddingId: string,
    invitedByUserId: string,
    input: CreateMemberInvitationInput,
    baseUrl?: string
  ): Promise<MemberInvitationDTO> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const normalizedEmail = input.email.trim().toLowerCase();

    // 1. Ensure wedding exists
    const wedding = await WeddingModel.findOne({
      _id: weddingObjectId,
      deletedAt: null,
    });
    if (!wedding) {
      throw new NotFoundError('Wedding not found');
    }

    // 2. Ensure user is not already a member of this wedding
    const existingUser = await UserModel.findOne({ emailNormalized: normalizedEmail });
    if (existingUser) {
      const existingMembership = await WeddingMembershipModel.findOne({
        userId: existingUser._id,
        weddingId: weddingObjectId,
      });
      if (existingMembership) {
        throw new ConflictError(
          'This user is already an active member of your wedding team.',
          ERROR_CODES.CONFLICT
        );
      }
    }

    // 3. Ensure no pending active invitation for this email in this wedding
    const existingPending = await MemberInvitationModel.findOne({
      weddingId: weddingObjectId,
      emailNormalized: normalizedEmail,
      status: 'PENDING',
      expiresAt: { $gt: new Date() },
    });
    if (existingPending) {
      throw new ConflictError(
        'A pending invitation for this email address already exists.',
        ERROR_CODES.CONFLICT
      );
    }

    // 4. Generate high-entropy unguessable token
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await MemberInvitationModel.create({
      weddingId: weddingObjectId,
      email: input.email.trim(),
      emailNormalized: normalizedEmail,
      role: input.role,
      token,
      tokenHash,
      status: 'PENDING',
      invitedByUserId: new mongoose.Types.ObjectId(invitedByUserId),
      expiresAt,
    });

    return toMemberInvitationDTO(invitation, baseUrl);
  }

  /**
   * Lists pending invitations for a wedding.
   */
  static async listInvitations(weddingId: string, baseUrl?: string): Promise<MemberInvitationDTO[]> {
    await connectToDatabase();

    const invitations = await MemberInvitationModel.find({
      weddingId: new mongoose.Types.ObjectId(weddingId),
      status: 'PENDING',
    }).sort({ createdAt: -1 });

    return invitations.map((inv) => toMemberInvitationDTO(inv, baseUrl));
  }

  /**
   * Revokes a pending invitation.
   * Admin only.
   */
  static async revokeInvitation(
    weddingId: string,
    invitationId: string
  ): Promise<{ success: boolean; id: string }> {
    await connectToDatabase();

    const invitation = await MemberInvitationModel.findOne({
      _id: new mongoose.Types.ObjectId(invitationId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
      status: 'PENDING',
    });

    if (!invitation) {
      throw new NotFoundError('Pending invitation not found');
    }

    invitation.status = 'REVOKED';
    await invitation.save();

    return { success: true, id: invitationId };
  }

  /**
   * Updates an existing member's role (ADMIN vs MANAGER).
   * Admin only. Enforces that wedding must always retain at least one ADMIN.
   */
  static async updateMemberRole(
    weddingId: string,
    membershipId: string,
    role: UserRole
  ): Promise<WeddingMemberDTO> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const membership = await WeddingMembershipModel.findOne({
      _id: new mongoose.Types.ObjectId(membershipId),
      weddingId: weddingObjectId,
    });

    if (!membership) {
      throw new NotFoundError('Wedding member not found');
    }

    // Protection rule: Wedding must always have at least one ADMIN
    if (membership.role === USER_ROLES.ADMIN && role === USER_ROLES.MANAGER) {
      const adminCount = await WeddingMembershipModel.countDocuments({
        weddingId: weddingObjectId,
        role: USER_ROLES.ADMIN,
      });

      if (adminCount <= 1) {
        throw new ForbiddenError(
          'Cannot demote the last wedding Admin. Please promote another member to Admin first.',
          ERROR_CODES.LAST_ADMIN
        );
      }
    }

    membership.role = role;
    await membership.save();

    const user = await UserModel.findById(membership.userId);

    return {
      membershipId: membership._id.toString(),
      user: {
        id: membership.userId.toString(),
        name: user?.name || 'Wedding Collaborator',
        email: user?.email || '',
      },
      role: membership.role,
      joinedAt: membership.joinedAt.toISOString(),
    };
  }

  /**
   * Removes a member from the wedding workspace.
   * Admin only. Enforces that wedding must always retain at least one ADMIN.
   */
  static async removeMember(
    weddingId: string,
    membershipId: string
  ): Promise<{ success: boolean; id: string }> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const membership = await WeddingMembershipModel.findOne({
      _id: new mongoose.Types.ObjectId(membershipId),
      weddingId: weddingObjectId,
    });

    if (!membership) {
      throw new NotFoundError('Wedding member not found');
    }

    // Protection rule: Cannot delete last ADMIN
    if (membership.role === USER_ROLES.ADMIN) {
      const adminCount = await WeddingMembershipModel.countDocuments({
        weddingId: weddingObjectId,
        role: USER_ROLES.ADMIN,
      });

      if (adminCount <= 1) {
        throw new ForbiddenError(
          'Cannot remove the last wedding Admin from the celebration.',
          ERROR_CODES.LAST_ADMIN
        );
      }
    }

    await WeddingMembershipModel.deleteOne({ _id: membership._id });

    return { success: true, id: membershipId };
  }

  /**
   * Resolves invitation details for the public acceptance screen.
   */
  static async getPublicInvitationByToken(token: string): Promise<PublicMemberInvitationDTO> {
    await connectToDatabase();

    const cleanToken = token.trim();
    const tokenHash = hashToken(cleanToken);

    const invitation = await MemberInvitationModel.findOne({
      $or: [{ token: cleanToken }, { tokenHash }],
      status: 'PENDING',
    });

    if (!invitation) {
      throw new NotFoundError('Member invitation link is invalid or has already been accepted.');
    }

    if (new Date() > invitation.expiresAt) {
      throw new ValidationError(
        'This wedding committee invitation has expired. Please ask the couple to re-send an invite.'
      );
    }

    const wedding = await WeddingModel.findOne({
      _id: invitation.weddingId,
      deletedAt: null,
    });

    if (!wedding) {
      throw new NotFoundError('Wedding workspace not found.');
    }

    return {
      email: invitation.email,
      role: invitation.role,
      wedding: {
        id: wedding._id.toString(),
        brideName: wedding.brideName,
        groomName: wedding.groomName,
        weddingDate: wedding.weddingDate,
        title: wedding.title ?? null,
      },
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  /**
   * Accepts an invitation and binds the authenticated user to the wedding workspace.
   */
  static async acceptInvitation(
    token: string,
    userId: string
  ): Promise<{ weddingId: string; role: UserRole }> {
    await connectToDatabase();

    const cleanToken = token.trim();
    const tokenHash = hashToken(cleanToken);

    const invitation = await MemberInvitationModel.findOne({
      $or: [{ token: cleanToken }, { tokenHash }],
      status: 'PENDING',
    });

    if (!invitation) {
      throw new NotFoundError('Member invitation link is invalid or has already been accepted.');
    }

    if (new Date() > invitation.expiresAt) {
      throw new ValidationError('This wedding committee invitation has expired.');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found');
    }

    // Rule: User email must match invitation email
    if (user.emailNormalized !== invitation.emailNormalized) {
      throw new ForbiddenError(
        `This invitation was sent to ${invitation.email}. Your current logged-in account (${user.email}) does not match. Please sign in with ${invitation.email} to accept.`,
        ERROR_CODES.INVITATION_EMAIL_MISMATCH
      );
    }

    // Rule: User cannot belong to two weddings in V1
    const existingMembership = await WeddingMembershipModel.findOne({ userId: user._id });
    if (existingMembership) {
      throw new ConflictError(
        'You already belong to a wedding workspace. In V1, each account can belong to only one wedding.',
        ERROR_CODES.ALREADY_HAS_WEDDING
      );
    }

    // Create membership
    await WeddingMembershipModel.create({
      userId: user._id,
      weddingId: invitation.weddingId,
      role: invitation.role,
      joinedAt: new Date(),
    });

    // Mark invitation accepted
    invitation.status = 'ACCEPTED';
    invitation.acceptedByUserId = user._id;
    invitation.acceptedAt = new Date();
    await invitation.save();

    return {
      weddingId: invitation.weddingId.toString(),
      role: invitation.role,
    };
  }
}
