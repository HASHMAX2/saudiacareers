import { prisma } from './src/config/prisma.js';
import { consumeJobCredit } from './src/services/employerBillingService.js';

const email = 'test_employer_qa@test.com';
const testName = process.argv[2] || 'all';
const concurrency = Number(process.argv[3] || 5);

let user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  user = await prisma.user.create({
    data: { name: 'QA Test Employer', email, passwordHash: 'not-a-real-hash-test-account', role: 'EMPLOYER' },
  });
}

let profile = await prisma.employerProfile.findUnique({ where: { userId: user.id } });
if (!profile) {
  profile = await prisma.employerProfile.create({
    data: { userId: user.id, companyName: 'QA Test Co', verificationStatus: 'APPROVED' },
  });
}

async function resetSubscription({ paidCreditsRemaining, freeJobUsedAt }) {
  const existing = await prisma.employerSubscription.findUnique({ where: { employerProfileId: profile.id } });
  if (existing) {
    return prisma.employerSubscription.update({
      where: { id: existing.id },
      data: { paidCreditsRemaining, freeJobUsedAt },
    });
  }
  return prisma.employerSubscription.create({
    data: { employerProfileId: profile.id, paidCreditsRemaining, freeJobUsedAt },
  });
}

async function fireConcurrent(subscription, n) {
  const results = await Promise.allSettled(
    Array.from({ length: n }, () => consumeJobCredit(subscription, { userId: user.id, companyName: profile.companyName })),
  );
  const fulfilled = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const rejected = results.filter((r) => r.status === 'rejected');
  return { fulfilled, rejectedCount: rejected.length };
}

if (testName === 'free' || testName === 'all') {
  console.log(`=== TEST: free-job race (SA-03) — fresh subscription, 0 paid credits, ${concurrency} concurrent requests ===`);
  const sub = await resetSubscription({ paidCreditsRemaining: 0, freeJobUsedAt: null });
  const { fulfilled, rejectedCount } = await fireConcurrent(sub, concurrency);
  const final = await prisma.employerSubscription.findUnique({ where: { id: sub.id } });
  console.log(`  fulfilled=${fulfilled.length} (${JSON.stringify(fulfilled)}) rejected=${rejectedCount} finalFreeJobUsedAt=${final.freeJobUsedAt}`);
  console.log(`  PASS=${fulfilled.length === 1 && rejectedCount === concurrency - 1 && final.freeJobUsedAt !== null}`);
}

if (testName === 'combined' || testName === 'all') {
  console.log(`=== TEST: combined race — free available AND 3 paid credits, ${concurrency} concurrent requests ===`);
  const sub = await resetSubscription({ paidCreditsRemaining: 3, freeJobUsedAt: null });
  const { fulfilled, rejectedCount } = await fireConcurrent(sub, concurrency);
  const final = await prisma.employerSubscription.findUnique({ where: { id: sub.id } });
  const freeCount = fulfilled.filter((v) => v === 'FREE').length;
  const paidCount = fulfilled.filter((v) => v === 'PAID').length;
  const expectedPaid = Math.min(3, concurrency - 1);
  console.log(`  fulfilled=${fulfilled.length} (free=${freeCount}, paid=${paidCount}) rejected=${rejectedCount} finalPaidCreditsRemaining=${final.paidCreditsRemaining}`);
  console.log(`  PASS=${freeCount === 1 && paidCount === expectedPaid && final.paidCreditsRemaining === 3 - expectedPaid}`);
}

console.log('EMPLOYER_PROFILE_ID=' + profile.id);
console.log('EMPLOYER_USER_ID=' + user.id);
await prisma.$disconnect();
