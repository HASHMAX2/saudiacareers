import { prisma } from './src/config/prisma.js';
import { createAccessToken } from './src/services/tokenService.js';

const employerEmail = 'test_employer_qa@test.com';
const adminEmail = 'test_admin_qa@test.com';

let employer = await prisma.user.findUnique({ where: { email: employerEmail } });
if (!employer) {
  employer = await prisma.user.create({
    data: { name: 'QA Test Employer', email: employerEmail, passwordHash: 'not-a-real-hash-test-account', role: 'EMPLOYER' },
  });
}
let employerProfile = await prisma.employerProfile.findUnique({ where: { userId: employer.id } });
if (!employerProfile) {
  employerProfile = await prisma.employerProfile.create({
    data: { userId: employer.id, companyName: 'QA Test Co', verificationStatus: 'APPROVED' },
  });
}

let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
if (!admin) {
  admin = await prisma.user.create({
    data: { name: 'QA Test Admin', email: adminEmail, passwordHash: 'not-a-real-hash-test-account', role: 'ADMIN', mustChangePassword: false },
  });
}

// Two separate original PAID invoices — one for the sequential test, one for the concurrency test
const invoiceA = await prisma.invoice.create({
  data: { employerProfileId: employerProfile.id, type: 'CREDIT_PACK', amountSar: 100, status: 'PAID', gatewayRef: 'test_gw_ref_A', paidAt: new Date() },
});
const invoiceB = await prisma.invoice.create({
  data: { employerProfileId: employerProfile.id, type: 'CREDIT_PACK', amountSar: 100, status: 'PAID', gatewayRef: 'test_gw_ref_B', paidAt: new Date() },
});

console.log('EMPLOYER_TOKEN=' + createAccessToken(employer));
console.log('ADMIN_TOKEN=' + createAccessToken(admin));
console.log('INVOICE_A_ID=' + invoiceA.id);
console.log('INVOICE_B_ID=' + invoiceB.id);

await prisma.$disconnect();
