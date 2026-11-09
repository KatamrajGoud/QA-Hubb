import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const dbUrl = process.env.DATABASE_URL || '';
  const directUrl = process.env.DIRECT_URL || '';

  if (!dbUrl || dbUrl.startsWith('file:') || dbUrl.includes('[YOUR_PASSWORD]') || dbUrl.includes('[YOUR-PASSWORD]')) {
    console.log('⚠️ DATABASE_URL has not yet been configured with your actual Supabase password in backend/.env.');
    console.log('   Please open backend/.env and replace [YOUR_PASSWORD] with your actual Supabase database password.');
    return;
  }

  console.log('🔌 Connecting to Supabase PostgreSQL...');
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now;`;
    console.log('✅ Connection to Supabase PostgreSQL succeeded!');
    console.log('   Server time from Supabase:', result[0]?.now);
  } catch (err: any) {
    console.error('❌ Could not connect to Supabase:');
    console.error('   Error message:', err.message || err);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Ensure your database password does not have unescaped special characters (e.g. use URL encoding: # -> %23, @ -> %40).');
    console.log('   2. Ensure project is active and not paused in your Supabase dashboard.');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
