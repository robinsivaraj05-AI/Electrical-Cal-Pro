import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

async function getUserProjectIds(userId: string): Promise<string[]> {
  const projects = await prisma.project.findMany({
    where: { userId },
    select: { id: true },
  });
  return projects.map((p) => p.id);
}

// GET /api/calculations — user's full history
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const type = req.query.type as string | undefined;
    const search = req.query.search as string | undefined;
    const projectId = req.query.projectId as string | undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '100', 10);
    const skip = (page - 1) * limit;

    const projectIds = await getUserProjectIds(req.user!.id);

    const where: Prisma.CalculationWhereInput = {
      projectId: projectId ? projectId : { in: projectIds },
    };
    if (type) where.type = type;
    if (search) where.title = { contains: search };

    const [calculations, total] = await Promise.all([
      prisma.calculation.findMany({
        where,
        include: { project: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.calculation.count({ where }),
    ]);

    res.json({
      calculations: calculations.map((c) => ({
        ...c,
        inputs: JSON.parse(c.inputs),
        results: JSON.parse(c.results),
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('Get calculations error:', err);
    res.status(500).json({ error: 'Failed to fetch calculations' });
  }
});

// POST /api/calculations — save a calculation to a project
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, type, title, inputs, results, notes, standard, tags } = req.body;

    if (!projectId || !type || !title || !inputs || !results) {
      res.status(400).json({ error: 'projectId, type, title, inputs and results are required' });
      return;
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user!.id },
    });

    if (!project) {
      res.status(403).json({ error: 'Project not found or access denied' });
      return;
    }

    const calculation = await prisma.calculation.create({
      data: {
        projectId,
        type,
        title,
        inputs: JSON.stringify(inputs),
        results: JSON.stringify(results),
        notes,
        standard,
        tags,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    res.status(201).json({
      calculation: {
        ...calculation,
        inputs: JSON.parse(calculation.inputs),
        results: JSON.parse(calculation.results),
      },
      message: 'Calculation saved',
    });
  } catch (err) {
    console.error('Create calculation error:', err);
    res.status(500).json({ error: 'Failed to save calculation' });
  }
});

// GET /api/calculations/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectIds = await getUserProjectIds(req.user!.id);

    const calc = await prisma.calculation.findFirst({
      where: { id: (req.params.id as string), projectId: { in: projectIds } },
      include: { project: { select: { id: true, name: true, client: true } } },
    });

    if (!calc) {
      res.status(404).json({ error: 'Calculation not found' });
      return;
    }

    res.json({
      calculation: {
        ...calc,
        inputs: JSON.parse(calc.inputs),
        results: JSON.parse(calc.results),
      },
    });
  } catch (err) {
    console.error('Get calculation error:', err);
    res.status(500).json({ error: 'Failed to fetch calculation' });
  }
});

// PUT /api/calculations/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectIds = await getUserProjectIds(req.user!.id);

    const existing = await prisma.calculation.findFirst({
      where: { id: (req.params.id as string), projectId: { in: projectIds } },
    });

    if (!existing) {
      res.status(404).json({ error: 'Calculation not found' });
      return;
    }

    const { title, inputs, results, notes, tags, revision } = req.body;

    const calc = await prisma.calculation.update({
      where: { id: (req.params.id as string) },
      data: {
        ...(title && { title }),
        ...(inputs && { inputs: JSON.stringify(inputs) }),
        ...(results && { results: JSON.stringify(results) }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(revision && { revision }),
      },
    });

    res.json({
      calculation: {
        ...calc,
        inputs: JSON.parse(calc.inputs),
        results: JSON.parse(calc.results),
      },
      message: 'Calculation updated',
    });
  } catch (err) {
    console.error('Update calculation error:', err);
    res.status(500).json({ error: 'Failed to update calculation' });
  }
});

// DELETE /api/calculations/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectIds = await getUserProjectIds(req.user!.id);

    const existing = await prisma.calculation.findFirst({
      where: { id: (req.params.id as string), projectId: { in: projectIds } },
    });

    if (!existing) {
      res.status(404).json({ error: 'Calculation not found' });
      return;
    }

    await prisma.calculation.delete({ where: { id: (req.params.id as string) } });

    res.json({ message: 'Calculation deleted' });
  } catch (err) {
    console.error('Delete calculation error:', err);
    res.status(500).json({ error: 'Failed to delete calculation' });
  }
});

// DELETE /api/calculations — clear all (optionally by project)
router.delete('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const projectIds = await getUserProjectIds(req.user!.id);

    const where: Prisma.CalculationWhereInput = {
      projectId: projectId ? projectId : { in: projectIds },
    };

    const { count } = await prisma.calculation.deleteMany({ where });

    res.json({ message: `${count} calculations deleted` });
  } catch (err) {
    console.error('Clear calculations error:', err);
    res.status(500).json({ error: 'Failed to clear calculations' });
  }
});

// GET /api/calculations/project/:projectId — project-scoped
router.get('/project/:projectId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: (req.params.projectId as string), userId: req.user!.id },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const calculations = await prisma.calculation.findMany({
      where: { projectId: (req.params.projectId as string) },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      calculations: calculations.map((c) => ({
        ...c,
        inputs: JSON.parse(c.inputs),
        results: JSON.parse(c.results),
      })),
    });
  } catch (err) {
    console.error('Get project calculations error:', err);
    res.status(500).json({ error: 'Failed to fetch calculations' });
  }
});

export default router;
