import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getCollection } from "../db/mongo";
import { User } from "../types";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "continuum_hackathon_secret_2026";

// POST /auth/register
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const col = getCollection<User>("users");
    const existing = await col.findOne({ email: email.toLowerCase().trim() } as any);
    if (existing) {
      return res.status(409).json({ error: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user: User = {
      _id: uuidv4(),
      email: email.toLowerCase().trim(),
      password_hash,
      name: name || email.split("@")[0],
      created_at: new Date(),
    };

    await col.insertOne(user as any);

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const col = getCollection<User>("users");
    const user = await col.findOne({ email: email.toLowerCase().trim() } as any);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/me
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const col = getCollection<User>("users");
    const user = await col.findOne({ _id: req.user!.userId } as any);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
