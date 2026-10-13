
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../utils/generateToken";

export async function register(
  req: Request,
  res: Response
): Promise<void> {
  const name =
    typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (!name || !email || !password) {
    res.status(400).json({ message: "Name, email and password are required" });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: "Enter a valid email address" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(409).json({ message: "Email is already registered" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    message: "Registration successful",
    token: generateToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
}

export async function login(
  req: Request,
  res: Response
): Promise<void> {
  const email =
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  // Password is excluded by default in the User schema, so explicitly select it.
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  res.status(200).json({
    message: "Login successful",
    token: generateToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
}