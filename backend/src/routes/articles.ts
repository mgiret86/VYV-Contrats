import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

export const articlesRouter = Router();
articlesRouter.use(authenticate);

// GET /api/contracts/:contractId/articles
articlesRouter.get('/contracts/:contractId/articles', async (req: AuthRequest, res) => {
  try {
    const articles = await prisma.contractArticle.findMany({
      where: { contractId: req.params.contractId as string },
      include: {
        agency: {
          select: { id: true, code: true, name: true, city: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(articles);
  } catch (err) {
    console.error('GET articles error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/contracts/:contractId/articles
articlesRouter.post('/contracts/:contractId/articles', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { contractId } = req.params;
    const data = req.body;

    const article = await prisma.contractArticle.create({
      data: {
        contractId: contractId as string,
        designation: data.designation,
        quantity: data.quantity || 1,
        agencyId: data.agencyId || null,
      },
      include: {
        agency: {
          select: { id: true, code: true, name: true, city: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'CREATE',
        entity: 'contract_article',
        entityId: article.id,
        details: { contractId, designation: article.designation },
        ipAddress: req.ip || null,
      },
    });

    res.status(201).json(article);
  } catch (err) {
    console.error('POST article error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/contracts/:contractId/articles/:id
articlesRouter.put('/contracts/:contractId/articles/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const data = req.body;

    const article = await prisma.contractArticle.update({
      where: { id: req.params.id as string },
      data: {
        designation: data.designation,
        quantity: data.quantity || 1,
        agencyId: data.agencyId || null,
      },
      include: {
        agency: {
          select: { id: true, code: true, name: true, city: true },
        },
      },
    });

    res.json(article);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/contracts/:contractId/articles/:id
articlesRouter.delete('/contracts/:contractId/articles/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    await prisma.contractArticle.delete({ where: { id: req.params.id as string } });

    await prisma.auditLog.create({
      data: {
        userId: req.userId,
        action: 'DELETE',
        entity: 'contract_article',
        entityId: req.params.id as string,
        ipAddress: req.ip || null,
      },
    });

    res.json({ message: 'Article supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/contracts/:contractId/articles (batch — remplace tous les articles)
articlesRouter.put('/contracts/:contractId/articles', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { contractId } = req.params;
    const articles: Array<{ designation: string; quantity: number; agencyId?: string }> = req.body.articles || [];

    // Supprimer les anciens
    await prisma.contractArticle.deleteMany({ where: { contractId: contractId as string } });

    // Créer les nouveaux
    if (articles.length > 0) {
      await prisma.contractArticle.createMany({
        data: articles.map((a) => ({
          contractId: contractId as string,
          designation: a.designation,
          quantity: a.quantity || 1,
          agencyId: a.agencyId || null,
        })),
      });
    }

    // Récupérer les articles créés avec les relations
    const created = await prisma.contractArticle.findMany({
      where: { contractId: contractId as string },
      include: {
        agency: {
          select: { id: true, code: true, name: true, city: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(created);
  } catch (err) {
    console.error('PUT articles batch error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
