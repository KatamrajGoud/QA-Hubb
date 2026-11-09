/**
 * Safe first-time admin creation script.
 * Usage: pnpm run create-admin
 *
 * Run this ONCE after initial setup to create your first administrator account.
 * The script checks for an existing admin before proceeding.
 */
import 'dotenv/config';
import * as readline from 'readline';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> =>
  new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log('\n=== Company Project & QA Hub — Create First Administrator ===\n');

  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (existing) {
    console.log('An administrator already exists. Use the web UI to manage users.');
    rl.close();
    process.exit(0);
  }

  const name = await ask('Full name: ');
  const email = await ask('Email address: ');
  const password = await ask('Password (min 8 chars): ');

  if (!name.trim() || !email.includes('@') || password.length < 8) {
    console.error('\n❌  Invalid input. Aborting.');
    rl.close();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`\n✅  Administrator created:`);
  console.log(`   Email : ${admin.email}`);
  console.log(`   ID    : ${admin.id}`);
  console.log(`\nYou can now log in at the frontend.\n`);
  rl.close();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
