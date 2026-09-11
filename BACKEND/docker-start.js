const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function run(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit' });
}

async function main() {
  console.log('Syncing Prisma schema...');
  run('npx prisma db push');

  const userCount = await prisma.user.count();

  if (userCount === 0) {
    console.log('Database is empty. Running seed...');
    run('npm run seed');
  } else {
    console.log(`Database already has ${userCount} users. Skipping seed.`);
  }

  await prisma.$disconnect();

  console.log('Starting API...');
  require('./src/server');
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
