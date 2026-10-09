import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /\.vercel\.app$/.test(origin) || origin.startsWith('http://localhost')) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// ── Auth middleware ──────────────────────────────────────────
function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Health ──────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// ── Auth routes ─────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    if (!email || !password || !name)
      return res.status(400).json({ error: 'Email, password and name are required' });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email, password: hashed, name, company,
        settings: { create: { theme: 'dark', unitSystem: 'metric', standard: 'IEC', engineerName: name, companyName: company } },
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, company: user.company, role: user.role } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, company: user.company, role: user.role } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, email: true, name: true, company: true, role: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Projects routes ─────────────────────────────────────────
app.get('/api/projects', authMiddleware, async (req: any, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId },
      include: { _count: { select: { calculations: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ projects });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects', authMiddleware, async (req: any, res) => {
  try {
    const { name, client, engineer, projectNo, revision, date, companyName, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });
    const project = await prisma.project.create({
      data: { name, client, engineer: engineer || '', projectNo, revision: revision || 'A', date, companyName, description, userId: req.userId },
    });
    res.status(201).json({ project });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/projects/:id', authMiddleware, async (req: any, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { calculations: { orderBy: { createdAt: 'desc' } } },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/projects/:id', authMiddleware, async (req: any, res) => {
  try {
    const project = await prisma.project.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: req.body,
    });
    res.json({ success: project.count > 0 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/projects/:id', authMiddleware, async (req: any, res) => {
  try {
    await prisma.project.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Calculations routes ─────────────────────────────────────
app.get('/api/calculations', authMiddleware, async (req: any, res) => {
  try {
    const calculations = await prisma.calculation.findMany({
      where: { project: { userId: req.userId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ calculations });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/calculations', authMiddleware, async (req: any, res) => {
  try {
    const { projectId, type, title, inputs, results, notes, standard, tags } = req.body;
    if (!projectId || !type || !title) return res.status(400).json({ error: 'projectId, type and title required' });
    const calc = await prisma.calculation.create({
      data: {
        projectId, type, title,
        inputs: typeof inputs === 'string' ? inputs : JSON.stringify(inputs),
        results: typeof results === 'string' ? results : JSON.stringify(results),
        notes, standard, tags,
      },
    });
    res.status(201).json({ calculation: calc });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/calculations/:id', authMiddleware, async (req: any, res) => {
  try {
    await prisma.calculation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Settings routes ─────────────────────────────────────────
app.get('/api/settings', authMiddleware, async (req: any, res) => {
  try {
    const settings = await prisma.userSettings.findUnique({ where: { userId: req.userId } });
    res.json({ settings });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/settings', authMiddleware, async (req: any, res) => {
  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.userId },
      update: req.body,
      create: { userId: req.userId, ...req.body },
    });
    res.json({ settings });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Dashboard stats ─────────────────────────────────────────
app.get('/api/dashboard/stats', authMiddleware, async (req: any, res) => {
  try {
    const [projects, calculations] = await Promise.all([
      prisma.project.count({ where: { userId: req.userId } }),
      prisma.calculation.count({ where: { project: { userId: req.userId } } }),
    ]);
    const recent = await prisma.calculation.findMany({
      where: { project: { userId: req.userId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    res.json({ stats: { totalProjects: projects, totalCalculations: calculations, recentCalculations: recent } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── 404 fallback ────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

export default app;
