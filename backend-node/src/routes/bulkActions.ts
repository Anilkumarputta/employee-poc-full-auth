import { Router } from 'express';
import multer from 'multer';
import csvParser from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const router = Router();
const upload = multer({ dest: 'uploads/' });

// Bulk import employees from CSV
import { Request, Response } from 'express';
router.post(
  '/bulk-import',
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const results: any[] = [];
    const errors: Array<{ email?: string; error: string }> = [];
    const filePath = req.file.path;
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        for (const row of results) {
          try {
            // Upsert employee by email
            await prisma.employee.upsert({
              where: { email: row.email },
              update: {
                name: row.name,
                age: Number(row.age),
                role: row.role,
                status: row.status,
                location: row.location,
                attendance: Number(row.attendance),
                className: row.className || '',
                lastLogin: new Date().toISOString(),
                updatedAt: new Date(),
              },
              create: {
                name: row.name,
                email: row.email,
                age: Number(row.age),
                role: row.role,
                status: row.status,
                location: row.location,
                attendance: Number(row.attendance),
                className: row.className || '',
                lastLogin: new Date().toISOString(),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          } catch (err: any) {
            errors.push({ email: row.email, error: (err && err.message) || String(err) });
          }
        }
        fs.unlinkSync(filePath);
        res.json({ imported: results.length - errors.length, errors });
      });
  },
);

// Bulk export employees to CSV
router.get('/bulk-export', async (req, res) => {
  const employees = await prisma.employee.findMany();
  const header = 'name,email,age,role,status,location,attendance\n';
  const rows = employees
    .map((e) => `${e.name},${e.email},${e.age},${e.role},${e.status},${e.location},${e.attendance}`)
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
  res.send(header + rows);
});

export default router;
