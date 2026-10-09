import { Router, Response } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/stats — aggregate stats for the logged-in user
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const userProjects = await prisma.project.findMany({
      where: { userId },
      select: { id: true },
    });
    const projectIds = userProjects.map((p) => p.id);

    const [totalProjects, totalCalcs, calcByType, recentCalcs, recentProjects] = await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.calculation.count({ where: { projectId: { in: projectIds } } }),
      prisma.calculation.groupBy({
        by: ['type'],
        where: { projectId: { in: projectIds } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.calculation.findMany({
        where: { projectId: { in: projectIds } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { _count: { select: { calculations: true } } },
      }),
    ]);

    res.json({
      stats: {
        totalProjects,
        totalCalcs,
        calcByType: calcByType.map((c) => ({ type: c.type, count: c._count?.id ?? 0 })),
      },
      recentCalcs: recentCalcs.map((c) => ({
        ...c,
        inputs: JSON.parse(c.inputs),
        results: JSON.parse(c.results),
      })),
      recentProjects,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
