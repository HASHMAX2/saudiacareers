import bcrypt from 'bcryptjs';
import { prisma } from './src/config/prisma.js';

const email = 'test_admin_qa@test.com';
const password = 'TestAdmin@12345';

await prisma.user.deleteMany({ where: { email } });
const hash = await bcrypt.hash(password, 12);
const user = await prisma.user.create({
  data: { name: 'QA Test Admin', email, passwordHash: hash, role: 'ADMIN', mustChangePassword: false },
});
console.log('Created test admin:', user.id, user.email);
await prisma.$disconnect();
