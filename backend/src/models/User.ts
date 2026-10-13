
import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Store only the bcrypt hash, never the plain password.
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);