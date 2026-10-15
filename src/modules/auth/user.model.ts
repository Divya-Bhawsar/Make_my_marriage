import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 254,
    },
    emailNormalized: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');
