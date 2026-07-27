import { prisma } from './src/config/prisma.js';
const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true }, take: 10 });
console.log(JSON.stringify(users, null, 2));
await prisma.$disconnect();
