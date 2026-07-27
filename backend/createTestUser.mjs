import bcrypt from 'bcryptjs';
import { prisma } from './src/config/prisma.js';

const email = 'breach_test@test.com';
const password = 'Test@12345';

await prisma.user.deleteMany({ where: { email } });
const hash = await bcrypt.hash(password, 12);
const user = await prisma.user.create({
  data: { name: 'Breach Tester', email, passwordHash: hash, role: 'CANDIDATE', profile: { create: {} } },
});
console.log('Created user:', user.id, user.email);
await prisma.$disconnect();
