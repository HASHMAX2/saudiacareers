import { prisma } from './src/config/prisma.js';
import { createAccessToken } from './src/services/tokenService.js';

const email = 'ali.hashmi0@gmail.com';

let user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  user = await prisma.user.create({
    data: {
      name: 'Ali Hashmi',
      email,
      passwordHash: 'not-a-real-hash-test-account',
      role: 'CANDIDATE',
      profile: {
        create: {
          location: 'Riyadh',
          designation: 'Software Engineer',
          experience: '3-5 years',
          skills: 'Node.js, React, PostgreSQL',
          summary: 'Test candidate created for admin feedback feature verification.',
        },
      },
    },
  });
  console.log('Created candidate:', user.id, user.email);
} else {
  console.log('Using existing candidate:', user.id, user.email);
}

const admin = await prisma.user.findUnique({ where: { email: 'admin@saudiacareers.com' } });
const adminToken = createAccessToken(admin);

console.log('CANDIDATE_ID=' + user.id);
console.log('ADMIN_TOKEN=' + adminToken);

await prisma.$disconnect();
