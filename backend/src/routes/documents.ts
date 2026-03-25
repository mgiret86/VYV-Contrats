import { Router } from 'express';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

export const documentsRouter = Router();
documentsRouter.use(authenticate);

// POST /api/documents/:contractId
documentsRouter.post(
  '/:contractId',
  requireRole('ADMIN', 'MANAGER'),
  upload.array('files', 10),
  async (req: AuthRequest, res) => {
    try {
      const contractId = req.params.contractId as string;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: 'Aucun fichier envoyé' });
        return;
      }

      const documents = await Promise.all(
        files.map((file) =>
          prisma.document.create({
            data: {
              contractId,
              filename: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              path: file.path,
            },
          })
        )
      );

      res.status(201).json(documents);
    } catch (err) {
      res.status(500).json({ error: 'Erreur upload' });
    }
  }
);

// GET /api/documents/:id/download
documentsRouter.get('/:id/download', async (req: AuthRequest, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.i as string as string },
    });

    if (!doc) {
      res.status(404).json({ error: 'Document non trouvé' });
      return;
    }

    res.download(doc.path, doc.originalName);
  } catch (err) {
    res.status(500).json({ error: 'Erreur téléchargement' });
  }
});

// DELETE /api/documents/:id
documentsRouter.delete('/:id', requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res) => {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.i as string as string },
    });

    if (!doc) {
      res.status(404).json({ error: 'Document non trouvé' });
      return;
    }

    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }

    await prisma.document.delete({ where: { id: doc.id } });
    res.json({ message: 'Document supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});
