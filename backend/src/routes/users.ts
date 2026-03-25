import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

export const usersRouter = Router();
usersRouter.use(authenticate);
usersRouter.use(requireRole('ADMIN'));

// GET /api/users
usersRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        alertsEnabled: true,
        alertDaysBefore: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { lastName: 'asc' },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/users
usersRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const data = req.body;

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash,
        role: data.role || 'VIEWER',
        isActive: data.isActive ?? true,
        alertsEnabled: data.alertsEnabled ?? true,
        alertDaysBefore: data.alertDaysBefore || 30,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        alertsEnabled: true,
        alertDaysBefore: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'CREATE',
        entity: 'user',
        entityId: user.id,
        details: { email: user.email },
        ipAddress: req.ip || null,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/users/:id
usersRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
      alertsEnabled: data.alertsEnabled,
      alertDaysBefore: data.alertDaysBefore,
    };

    // Changer le mot de passe seulement si fourni
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        alertsEnabled: true,
        alertDaysBefore: true,
      },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/users/:id
usersRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // Protection : on ne peut pas supprimer son propre compte
    if ((req.params.id as string) === req.userId) {
      res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
      return;
    }

    await prisma.refreshToken.deleteMany({ where: { userId: req.params.id as string } });
    await prisma.user.delete({ where: { id: req.params.id as string } });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'DELETE',
        entity: 'user',
        entityId: req.params.id as string,
        ipAddress: req.ip || null,
      },
    });

    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
