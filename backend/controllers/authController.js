import zod from "zod";
import { User } from "../db/index.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import bcrypt from "bcrypt";

// Zod Schemas
const signupBody = zod.object({
  username: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string(),
});

const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

// Signup
export const signup = async (req, res) => {
  const result = signupBody.safeParse(req.body);
  if (!result.success)
    return res.status(400).json({ message: "Incorrect inputs", errors: result.error.format() });

  const { username, password, firstName, lastName } = result.data;

  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(409).json({ message: "Email already taken" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hashedPassword,
    firstName,
    lastName,
  });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

  res.status(201).json({ message: "User created successfully", token });
};

// Signin
export const signin = async (req, res) => {
  const result = signinBody.safeParse(req.body);
  if (!result.success)
    return res.status(400).json({ message: "Incorrect inputs", errors: result.error.format() });

  const { username, password } = result.data;

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

  res.status(200).json({ token });
};

// Update User Info
export const updateInfo = async (req, res) => {
  const result = updateBody.safeParse(req.body);
  if (!result.success) return res.status(400).json({ message: "Invalid update data" });

  const updateData = { ...result.data };
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  await User.updateOne({ _id: req.userId }, updateData);

  res.json({ message: "Updated successfully" });
};

// Get Users with optional filter
export const getUser = async (req, res) => {
  const filter = req.query.filter || "";
  const users = await User.find({
    $or: [
      { firstName: { $regex: filter, $options: "i" } },
      { lastName: { $regex: filter, $options: "i" } },
    ],
  });

  res.json({
    user: users.map((u) => ({
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      _id: u._id,
    })),
  });
};
