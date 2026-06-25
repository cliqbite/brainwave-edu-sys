import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcrypt';
import {
  ROLES,
  ROLE_DISPLAY_NAMES,
  PERMISSION_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from '@brainwave/shared';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function seed(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  // ---- 1. Create roles ----
  console.log('Creating roles...');
  const roleEntries = Object.entries(ROLES) as Array<[keyof typeof ROLES, string]>;
  const roles: Record<string, { id: number; name: string }> = {};

  for (const [key, name] of roleEntries) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {
        displayName: ROLE_DISPLAY_NAMES[key],
        isSystem: true,
      },
      create: {
        name,
        displayName: ROLE_DISPLAY_NAMES[key],
        description: `System ${ROLE_DISPLAY_NAMES[key]} role`,
        isSystem: true,
      },
    });
    roles[name] = { id: role.id, name: role.name };
    console.log(`  ✓ Role: ${role.name} (id: ${role.id})`);
  }

  // ---- 2. Create permissions ----
  console.log('\nCreating permissions...');
  const permissions: Record<string, number> = {};

  for (const perm of PERMISSION_DEFINITIONS) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        displayName: perm.displayName,
        module: perm.module,
        description: perm.description,
      },
      create: {
        name: perm.name,
        displayName: perm.displayName,
        module: perm.module,
        description: perm.description,
      },
    });
    permissions[perm.name] = permission.id;
    console.log(`  ✓ Permission: ${permission.name}`);
  }

  // ---- 3. Assign role permissions ----
  console.log('\nAssigning role permissions...');

  for (const [roleName, permNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = roles[roleName];
    if (!role) {
      console.warn(`  ⚠ Role '${roleName}' not found, skipping...`);
      continue;
    }

    for (const permName of permNames) {
      const permissionId = permissions[permName];
      if (permissionId === undefined) {
        console.warn(`  ⚠ Permission '${permName}' not found, skipping...`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId,
        },
      });
    }

    console.log(`  ✓ ${roleName}: ${permNames.length} permissions assigned`);
  }

  // ---- 4. Create master user ----
  console.log('\nCreating master user...');

  const masterEmail = process.env['MASTER_EMAIL'] ?? 'master@brainwave.edu';
  const masterPassword = process.env['MASTER_PASSWORD'] ?? 'Master@123';
  const masterName = process.env['MASTER_NAME'] ?? 'System Master';

  const masterRole = roles[ROLES.MASTER];
  if (!masterRole) {
    throw new Error('MASTER role not found — cannot create master user');
  }

  const passwordHash = await bcrypt.hash(masterPassword, 12);

  const masterUser = await prisma.user.upsert({
    where: { email: masterEmail },
    update: {
      name: masterName,
      passwordHash,
      roleId: masterRole.id,
    },
    create: {
      name: masterName,
      email: masterEmail,
      passwordHash,
      roleId: masterRole.id,
      status: 'ACTIVE',
    },
  });

  console.log(`  ✓ Master user: ${masterUser.email} (id: ${masterUser.id})`);

  console.log('\n✅ Seed completed successfully!\n');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
