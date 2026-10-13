import mongoose from 'mongoose';

// Connect the backend to the local MongoDB database.
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected successfully");
}