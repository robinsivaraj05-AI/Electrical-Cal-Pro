import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/projects
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = { userId: req.user!.id };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { client: { contains: search } },
        { projectNo: { contains: search } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: { _count: { select: { calculations: true } } },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      projects,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// POST /api/projects
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, client, engineer, projectNo, revision, date, companyName, description } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        client,
        engineer: engineer || req.user!.name,
        projectNo,
        revision: revision || 'A',
        date,
        companyName,
        description,
        userId: req.user!.id,
      },
      include: { _count: { select: { calculations: true } } },
    });

    res.status(201).json({ project, message: 'Project created' });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: (req.params.id as string), userId: req.user!.id },
      include: {
        calculations: { orderBy: { createdAt: 'desc' }, take: 100 },
        _count: { select: { calculations: true } },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// PUT /api/projects/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: (req.params.id as string), userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { name, client, engineer, projectNo, revision, date, companyName, description, status } = req.body;

    const project = await prisma.project.update({
      where: { id: (req.params.id as string) },
      data: {
        ...(name && { name }),
        ...(client !== undefined && { client }),
        ...(engineer && { engineer }),
        ...(projectNo !== undefined && { projectNo }),
        ...(revision && { revision }),
        ...(date !== undefined && { date }),
        ...(companyName !== undefined && { companyName }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
      include: { _count: { select: { calculations: true } } },
    });

    res.json({ project, message: 'Project updated' });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.project.findFirst({
      where: { id: (req.params.id as string), userId: req.user!.id },
    });

    if (!existing) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    await prisma.project.delete({ where: { id: (req.params.id as string) } });

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// GET /api/projects/:id/stats
router.get('/:id/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: (req.params.id as string), userId: req.user!.id },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const [totalCalcs, calcByType, recentCalcs] = await Promise.all([
      prisma.calculation.count({ where: { projectId: (req.params.id as string) } }),
      prisma.calculation.groupBy({
        by: ['type'],
        where: { projectId: (req.params.id as string) },
        _count: { id: true },
      }),
      prisma.calculation.findMany({
        where: { projectId: (req.params.id as string) },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, type: true, createdAt: true },
      }),
    ]);

    res.json({
      totalCalcs,
      calcByType: calcByType.map((c) => ({
        type: c.type,
        count: (c._count as { id?: number }).id ?? 0,
      })),
      recentCalcs,
    });
  } catch (err) {
    console.error('Project stats error:', err);
    res.status(500).json({ error: 'Failed to fetch project stats' });
  }
});

export default router;
