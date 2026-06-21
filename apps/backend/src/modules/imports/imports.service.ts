import prisma from '../../config/database.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { auditLog } from '../../middlewares/auditLogger.js';
import { buildPrismaQueryArgs, buildPaginationMeta } from '../../utils/pagination.js';
import ExcelJS from 'exceljs';
import bcrypt from 'bcrypt';
import { generateSlug } from '../../utils/slug.js';
import type { PaginationQuery } from '@brainwave/shared';
import fs from 'fs';

export async function importUsers(file: Express.Multer.File, groupIdsStr: string | undefined, createdById: number) {
  let groupIds: number[] = [];
  if (groupIdsStr) {
    try {
      groupIds = JSON.parse(groupIdsStr);
    } catch (e) {
      throw new ValidationError('Invalid groupIds format');
    }
  }

  // Parse Excel/CSV
  const workbook = new ExcelJS.Workbook();
  const isCsv = file.originalname.toLowerCase().endsWith('.csv');
  
  if (isCsv) {
    await workbook.csv.readFile(file.path);
  } else {
    await workbook.xlsx.readFile(file.path);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount <= 1) {
    throw new ValidationError('File is empty or missing headers');
  }

  const rows: any[] = [];
  const headers: string[] = [];

  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value?.toString().trim() || '';
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    const rowData: any = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        rowData[header] = cell.value?.toString().trim();
      }
    });
    rows.push(rowData);
  });

  if (rows.length === 0) {
    throw new ValidationError('File is empty');
  }

  const batch = await prisma.importBatch.create({
    data: {
      filename: file.originalname,
      fileType: file.originalname.endsWith('.csv') ? 'CSV' : 'XLSX',
      totalRows: rows.length,
      groupIds: groupIds,
      createdById,
      status: 'PROCESSING',
    },
  });

  const defaultRole = await prisma.role.findUnique({ where: { name: 'USER' } });
  if (!defaultRole) throw new Error('Default USER role not found');

  let successCount = 0;
  let failedCount = 0;
  const errors: any[] = [];
  const defaultPassword = await bcrypt.hash('Brainwave@123', 12);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // Assuming 1 header row

    try {
      if (!row.name || !row.email) {
        throw new Error('Name and email are required');
      }

      const email = String(row.email).toLowerCase().trim();
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        throw new Error('Email already exists');
      }

      const user = await prisma.user.create({
        data: {
          name: String(row.name).trim(),
          email,
          passwordHash: defaultPassword,
          phone: row.phone ? String(row.phone).trim() : null,
          whatsappNumber: row.whatsappNumber ? String(row.whatsappNumber).trim() : (row.phone ? String(row.phone).trim() : null),
          rollNumber: row.rollNumber ? String(row.rollNumber).trim() : null,
          department: row.department ? String(row.department).trim() : null,
          className: row.className ? String(row.className).trim() : null,
          roleId: defaultRole.id,
        },
      });

      if (groupIds.length > 0) {
        await prisma.userGroup.createMany({
          data: groupIds.map(groupId => ({
            userId: user.id,
            groupId,
            addedById: createdById,
          })),
        });
      }

      await prisma.importRow.create({
        data: {
          batchId: batch.id,
          rowNumber,
          rawData: row,
          status: 'SUCCESS',
          userId: user.id,
        },
      });

      successCount++;
    } catch (err: any) {
      failedCount++;
      errors.push({ row: rowNumber, message: err.message });
      await prisma.importRow.create({
        data: {
          batchId: batch.id,
          rowNumber,
          rawData: row,
          status: 'FAILED',
          errorMessage: err.message,
        },
      });
    }
  }

  const finalBatch = await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      successCount,
      failedCount,
      status: failedCount > 0 ? (successCount > 0 ? 'COMPLETED' : 'FAILED') : 'COMPLETED',
      completedAt: new Date(),
      errors,
    },
  });

  auditLog({
    userId: createdById,
    action: 'CREATE',
    module: 'IMPORTS',
    targetType: 'ImportBatch',
    targetId: batch.id,
    newValues: { filename: file.originalname, totalRows: rows.length, successCount, failedCount },
  });

  // Clean up file
  try { fs.unlinkSync(file.path); } catch (e) {}

  return finalBatch;
}

export async function getHistory(query: PaginationQuery) {
  const { skip, take, orderBy } = buildPrismaQueryArgs(query);

  const [batches, total] = await Promise.all([
    prisma.importBatch.findMany({
      skip,
      take,
      orderBy,
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.importBatch.count(),
  ]);

  return {
    batches,
    meta: buildPaginationMeta(total, query.page, query.limit),
  };
}

export async function getBatchDetails(batchId: number) {
  const batch = await prisma.importBatch.findUnique({
    where: { id: batchId },
    include: {
      createdBy: { select: { name: true } },
      importRows: { orderBy: { rowNumber: 'asc' } },
    },
  });

  if (!batch) throw new NotFoundError('Import batch not found');

  return batch;
}
