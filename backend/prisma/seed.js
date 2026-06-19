import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@saudiacareers.com" },
    update: {
      name: "SaudiaCareers Admin",
      role: Role.ADMIN,
    },
    create: {
      name: "SaudiaCareers Admin",
      email: "admin@saudiacareers.com",
      passwordHash,
      role: Role.ADMIN,
      emailVerified: true,
      mustChangePassword: true,
    },
  });

  const jobCount = await prisma.job.count();
  if (jobCount === 0) {
    await prisma.job.createMany({
      data: [
        {
          title: "Frontend Developer",
          companyName: "Saudi Digital Co.",
          location: "Riyadh",
          industry: "Technology",
          employmentType: "Full-time",
          experienceRequired: "2-4 years",
          description: "Build accessible and maintainable web experiences.",
          requiredSkills: "React, JavaScript, CSS",
          hrEmail: "admin@saudiacareers.com",
          createdBy: admin.id,
        },
        {
          title: "Operations Coordinator",
          companyName: "Gulf Services Group",
          location: "Jeddah",
          industry: "Business Services",
          employmentType: "Full-time",
          experienceRequired: "1-3 years",
          description: "Coordinate daily operations and reporting.",
          requiredSkills: "Operations, Excel, Communication",
          hrEmail: "admin@saudiacareers.com",
          createdBy: admin.id,
        },
      ],
    });
  }

  console.info("Seed completed. Change the default admin password immediately after login.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

