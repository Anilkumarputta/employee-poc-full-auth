/**
 * AUTHENTICATION ROUTES - Login, Register, Password Reset
 *
 * This file handles all user authentication using REST API (not GraphQL).
 * Think of this as the "security checkpoint" of our app.
 *
 * Key concepts:
 * - JWT (JSON Web Token): A secure token that proves who you are
 * - Access Token: Short-lived (15 min) - used for API requests
 * - Refresh Token: Long-lived (7 days) - used to get new access tokens
 * - Password Hashing: We never store plain passwords! Use bcrypt to encrypt
 *
 * Flow: Login → Get tokens → Use access token → When expired, use refresh token → Get new access token
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // For password hashing (security!)
import jwt from 'jsonwebtoken'; // For creating JWT tokens

// Connect to database
const prisma = new PrismaClient();

// Create Express router - holds all our /auth routes
export const authRouter = Router();

// Secrets for signing JWT tokens (like a signature that proves tokens are real)
// In production, these come from environment variables (.env file)
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const RESET_SECRET = process.env.JWT_RESET_SECRET || 'dev-reset-secret';

/**
 * CREATE ACCESS TOKEN
 * Access token = short-lived (15 minutes) token for API requests
 * Contains: userId and role (director/manager/employee)
 * Frontend sends this with every GraphQL request in Authorization header
 */
function signAccessToken(userId: number, role: string) {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: '15m' });
}

/**
 * CREATE REFRESH TOKEN
 * Refresh token = long-lived (7 days) token to get new access tokens
 * Only contains userId (less info = more secure)
 * Frontend stores this safely and uses it when access token expires
 */
function signRefreshToken(userId: number) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
}

/**
 * REGISTER NEW USER
 * POST /auth/register
 *
 * Creates a new user account with email and password.
 * Steps:
 * 1. Check if email already exists (can't have duplicates!)
 * 2. Hash the password with bcrypt (never store plain passwords!)
 * 3. Create user in database
 * 4. Generate access and refresh tokens
 * 5. Store refresh token in database
 * 6. Return user info and both tokens
 *
 * Frontend receives tokens and stores them for future requests.
 */
authRouter.post('/register', async (req, res) => {
  try {
    // Extract data from request body
    const { email, password, role } = req.body;

    // Validation: email and password are required
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password with bcrypt (10 = salt rounds, higher = more secure but slower)
    // This creates a one-way encrypted string - can't be reversed to get original password!
    const passwordHash = await bcrypt.hash(password, 10);

    // Allow only valid roles
    const validRoles = ['admin', 'director', 'manager', 'employee'];
    const userRole = validRoles.includes(role) ? role : 'employee';

    // Create new user in database
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash, // Store encrypted password, not the real one
        role: userRole,
        provider: 'local', // "local" means email/password (vs "google")
      },
    });

    // Generate JWT tokens
    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    // Store refresh token in database (so we can check if it's revoked later)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // Return success with user data and tokens
    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      accessToken, // Frontend uses this for API requests
      refreshToken, // Frontend stores this to get new access tokens
    });
  } catch (err: any) {
    console.error('register error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * LOGIN EXISTING USER
 * POST /auth/login
 *
 * Authenticates a user with email and password.
 * Steps:
 * 1. Find user by email
 * 2. Compare submitted password with hashed password in database
 * 3. If match, generate new tokens
 * 4. Return user info and tokens
 *
 * Security: We never say "email not found" or "wrong password" specifically
 * Just "Invalid credentials" to prevent attackers from discovering valid emails
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // Check if user exists and has a password (Google users don't have passwords!)
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 🚨 SECURITY FEATURE: Check if account is temporarily locked due to failed login attempts
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      return res.status(423).json({
        error: `Account temporarily locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`,
      });
    }

    // Compare submitted password with stored hash
    // bcrypt.compare() hashes the submitted password and compares with stored hash
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      // Password doesn't match - increment failed attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: failedAttempts };

      // Lock account after 5 failed attempts (15 minutes)
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user's access has been denied by Director (Access Control Feature)
    if (user.isActive === false) {
      // Check if it's a temporary block that has expired
      if (user.accessBlockedUntil && new Date() > user.accessBlockedUntil) {
        // Temporary block expired - restore access automatically
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isActive: true,
            accessBlockedUntil: null,
            accessBlockReason: null,
          },
        });
      } else {
        const reason = user.accessBlockReason || 'Please contact your administrator.';
        return res.status(403).json({ error: `Account access has been denied. ${reason}` });
      }
    }

    // 🎉 Password is correct! Reset failed attempts and generate new tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Return success - user is now logged in!
    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GOOGLE LOGIN (Simplified POC version)
 * POST /auth/google
 *
 * Simulates Google OAuth login. In a real app, this would:
 * 1. Redirect user to Google login page
 * 2. Google verifies identity and sends back token
 * 3. We verify Google token and create/login user
 *
 * For this POC, we just accept email and create/login user.
 * No password needed because Google verified them!
 *
 * This demonstrates "Social Login" - login with Google, Facebook, etc.
 */
authRouter.post('/google', async (req, res) => {
  try {
    const { email, name } = req.body;

    // Email is required (Google always provides this)
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // First time login with Google - create new user
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: '', // No password for Google users!
          role: 'employee', // Default role
          provider: 'google', // Mark as Google login
          providerId: email, // Google user identifier
        },
      });
    }

    // Generate tokens (same as regular login)
    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Return user and tokens - they're logged in!
    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('google login error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * REFRESH ACCESS TOKEN
 * POST /auth/refresh
 *
 * Gets a new access token using refresh token.
 * Why do we need this? Access tokens expire after 15 minutes for security.
 * Instead of making user login again, we use the refresh token (valid for 7 days)
 * to get a new access token.
 *
 * Flow:
 * 1. Frontend makes API request
 * 2. Gets 401 error (access token expired)
 * 3. Calls /refresh with refresh token
 * 4. Gets new access token
 * 5. Retries original request with new token
 *
 * This keeps users logged in without exposing long-lived access tokens!
 */
authRouter.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Refresh token is required
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Look up refresh token in database
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }, // Include user data
    });

    // Check if token exists and hasn't been revoked (logout)
    if (!stored || stored.revoked) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Verify token signature and expiration
    try {
      jwt.verify(refreshToken, REFRESH_SECRET);
    } catch (err) {
      // Token is expired or tampered with
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Everything checks out! Create new access token
    const accessToken = signAccessToken(stored.user.id, stored.user.role);

    // Return new access token (refresh token stays the same)
    return res.json({ accessToken });
  } catch (err: any) {
    console.error('refresh error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * FORGOT PASSWORD (Simplified POC)
 * POST /auth/forgot-password
 *
 * In a real app, this would:
 * 1. Generate a unique reset token
 * 2. Store token with expiration (30 minutes)
 * 3. Send email with reset link: yourapp.com/reset?token=abc123
 * 4. User clicks link and submits new password
 *
 * For POC, we just log the request. No email service configured.
 * Always return success (don't reveal if email exists - security!)
 */
authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'password-reset' },
        RESET_SECRET,
        { expiresIn: '30m' },
      );
      // Replace with email provider integration in production.
      console.log('Password reset token generated for', email, resetToken);
    }
  }
  // Always return success message (don't reveal if email exists)
  return res.json({ ok: true, message: 'If this email exists, reset link sent.' });
});

/**
 * RESET PASSWORD (Simplified POC)
 * POST /auth/reset-password
 *
 * Allows user to set new password. In real app, would verify reset token first.
 * For POC, we just accept email + new password directly.
 *
 * Steps:
 * 1. Find user by email
 * 2. Hash new password
 * 3. Update user's passwordHash in database
 * 4. User can now login with new password
 */
authRouter.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  // Validate inputs
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password required' });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, RESET_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired reset token' });
  }

  if (decoded?.purpose !== 'password-reset' || !decoded?.userId) {
    return res.status(401).json({ error: 'Invalid or expired reset token' });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password in database
  await prisma.user.update({
    where: { id: decoded.userId },
    data: { passwordHash },
  });

  // Revoke all existing refresh tokens so existing sessions cannot continue.
  await prisma.refreshToken.updateMany({
    where: { userId: decoded.userId, revoked: false },
    data: { revoked: true },
  });

  return res.json({ ok: true, message: 'Password updated.' });
});

/**
 * LOGOUT
 * POST /auth/logout
 *
 * Logs user out by revoking their refresh token.
 * Steps:
 * 1. Mark refresh token as revoked in database
 * 2. Frontend deletes tokens from storage
 * 3. User is logged out
 *
 * Note: Access tokens can't be revoked (they're stateless).
 * They'll expire in 15 minutes anyway, so this is secure enough.
 * For ultra-secure apps, you'd maintain a blacklist of access tokens.
 */
authRouter.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Mark token as revoked - can't be used to get new access tokens
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }

  // Return success - user is logged out
  return res.json({ ok: true });
});
