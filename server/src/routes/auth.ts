import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, company } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password and name are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        company,
        settings: {
          create: {
            theme: 'dark',
            unitSystem: 'metric',
            standard: 'IEC',
            engineerName: name,
            companyName: company,
          },
        },
      },
      select: { id: true, email: true, name: true, company: true, role: true, createdAt: true },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, token, message: 'Account created successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { settings: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    const { password: _pw, ...safeUser } = user;
    res.json({ user: safeUser, token, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, name: true, company: true,
        role: true, createdAt: true, updatedAt: true,
        settings: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, company } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, company },
      select: {
        id: true, email: true, name: true, company: true,
        role: true, createdAt: true, updatedAt: true,
      },
    });

    res.json({ user, message: 'Profile updated' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashed } });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
