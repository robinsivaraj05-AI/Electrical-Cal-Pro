import { Router, Response } from 'express';
import prisma from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/settings
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.user!.id },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: req.user!.id,
          engineerName: req.user!.name,
          theme: 'dark',
          unitSystem: 'metric',
          standard: 'IEC',
        },
      });
    }

    res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { theme, unitSystem, standard, companyName, engineerName, logoUrl, autoSave } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user!.id },
      update: {
        ...(theme && { theme }),
        ...(unitSystem && { unitSystem }),
        ...(standard && { standard }),
        ...(companyName !== undefined && { companyName }),
        ...(engineerName && { engineerName }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(autoSave !== undefined && { autoSave: Boolean(autoSave) }),
      },
      create: {
        userId: req.user!.id,
        theme: theme || 'dark',
        unitSystem: unitSystem || 'metric',
        standard: standard || 'IEC',
        companyName,
        engineerName: engineerName || req.user!.name,
        logoUrl,
        autoSave: autoSave !== undefined ? Boolean(autoSave) : true,
      },
    });

    res.json({ settings, message: 'Settings updated' });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
