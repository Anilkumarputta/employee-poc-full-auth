import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
export const authRouter = Router();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

function signAccessToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: "15m" });
}

function signRefreshToken(userId: number) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
}

// Register local user
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role === "admin" ? "admin" : "employee",
        provider: "local",
      },
    });

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error("register error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Login local user
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error("login error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Simple Google-style login (no real OAuth, but same behavior for POC)
authRouter.post("/google", async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: "",
          role: "employee",
          provider: "google",
          providerId: email,
        },
      });
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error("google login error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Refresh token
authRouter.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revoked) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
      jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const accessToken = signAccessToken(stored.user.id, stored.user.role);
    return res.json({ accessToken });
  } catch (err: any) {
    console.error("refresh error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Forgot password (POC: just accept + respond; no email service wired)
authRouter.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  // In real app, generate token, store, send email
  console.log("Forgot password requested for", email);
  return res.json({ ok: true, message: "If this email exists, reset link sent." });
});

// Reset password (POC: accept email + new password)
authRouter.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password required" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json({ ok: true });
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  return res.json({ ok: true, message: "Password updated." });
});

// Logout (revoke refresh token)
authRouter.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
  return res.json({ ok: true });
});
