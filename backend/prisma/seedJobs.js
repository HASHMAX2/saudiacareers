import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: "admin@saudiacareers.com" } });
  if (!admin) throw new Error("Admin user not found. Run the main seed first.");

  const jobs = [
    {
      title: "Senior Backend Engineer",
      companyName: "Tamara Financial",
      location: "Riyadh",
      industry: "Technology",
      employmentType: "Full-time",
      experienceRequired: "5-8 years",
      salaryRange: "SAR 18,000 – 24,000 / month",
      description:
        "Design and scale distributed backend systems powering millions of transactions. You will own core payment infrastructure, define API contracts, and collaborate with product and mobile teams.\n\nResponsibilities:\n- Build and maintain high-throughput REST and gRPC services in Node.js / Go\n- Lead technical design reviews and mentor junior engineers\n- Drive performance, reliability, and observability improvements\n- Ensure PCI-DSS compliance across payment pipelines",
      requiredSkills: "Node.js, Go, PostgreSQL, Redis, Kubernetes, AWS",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-08-15"),
      createdBy: admin.id,
    },
    {
      title: "Product Manager – Growth",
      companyName: "Noon Commerce",
      location: "Riyadh",
      industry: "E-commerce",
      employmentType: "Full-time",
      experienceRequired: "3-5 years",
      salaryRange: "SAR 22,000 – 30,000 / month",
      description:
        "Own growth product initiatives across the Noon buyer funnel. You will define strategy, ship experiments, and obsess over conversion and retention metrics.\n\nResponsibilities:\n- Write and prioritize product specs for A/B tests and new features\n- Work with engineering, design, and data teams on weekly release cycles\n- Own the growth OKR dashboard and report to VP Product",
      requiredSkills: "Product Management, A/B Testing, SQL, Figma, Agile",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-07-31"),
      createdBy: admin.id,
    },
    {
      title: "Data Scientist",
      companyName: "Saudi Aramco Digital",
      location: "Dammam",
      industry: "Energy",
      employmentType: "Full-time",
      experienceRequired: "2-4 years",
      salaryRange: "SAR 16,000 – 22,000 / month",
      description:
        "Apply machine learning and statistical modelling to upstream oil-field operations. You will build predictive models for equipment failure, reservoir analysis, and supply-chain optimisation.\n\nResponsibilities:\n- Clean, explore, and model large sensor datasets\n- Deploy models to production via MLflow / Kubernetes\n- Present findings to engineering and executive stakeholders",
      requiredSkills: "Python, Scikit-learn, TensorFlow, SQL, Spark, MLflow",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-09-01"),
      createdBy: admin.id,
    },
    {
      title: "UX Designer",
      companyName: "stc pay",
      location: "Riyadh",
      industry: "Fintech",
      employmentType: "Full-time",
      experienceRequired: "2-4 years",
      salaryRange: "SAR 14,000 – 18,000 / month",
      description:
        "Shape the end-to-end experience of a super-app used by over 10 million users. You will run user research, create wireframes and high-fidelity prototypes, and work hand-in-hand with engineers to ship pixel-perfect interfaces.\n\nResponsibilities:\n- Conduct usability tests and synthesise findings into design decisions\n- Maintain and extend the stc pay design system\n- Collaborate with product and engineering on sprint planning",
      requiredSkills: "Figma, User Research, Prototyping, Design Systems, Accessibility",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-07-20"),
      createdBy: admin.id,
    },
    {
      title: "Financial Analyst",
      companyName: "Al Rajhi Capital",
      location: "Riyadh",
      industry: "Finance",
      employmentType: "Full-time",
      experienceRequired: "1-3 years",
      salaryRange: "SAR 10,000 – 14,000 / month",
      description:
        "Support the investment banking team with financial modelling, valuation, and deal execution for Saudi and GCC capital markets.\n\nResponsibilities:\n- Build and maintain DCF, LBO, and comparable-company models\n- Prepare pitchbooks and management presentations\n- Conduct sector research and due-diligence analysis",
      requiredSkills: "Excel, Financial Modelling, Bloomberg, PowerPoint, CFA (progress)",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-08-01"),
      createdBy: admin.id,
    },
    {
      title: "DevOps Engineer",
      companyName: "Mozn AI",
      location: "Riyadh",
      industry: "Technology",
      employmentType: "Full-time",
      experienceRequired: "3-5 years",
      salaryRange: "SAR 15,000 – 20,000 / month",
      description:
        "Build and operate the cloud infrastructure that runs Mozn's AI products at scale. You will own CI/CD pipelines, Kubernetes clusters, and observability stacks.\n\nResponsibilities:\n- Manage multi-region AWS infrastructure via Terraform\n- Design and maintain GitHub Actions / ArgoCD pipelines\n- Implement SLOs, alerting, and on-call runbooks\n- Harden security posture across services",
      requiredSkills: "AWS, Terraform, Kubernetes, Helm, Prometheus, GitHub Actions",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-08-30"),
      createdBy: admin.id,
    },
    {
      title: "Marketing Specialist",
      companyName: "Jarir Bookstore",
      location: "Jeddah",
      industry: "Retail",
      employmentType: "Full-time",
      experienceRequired: "1-3 years",
      salaryRange: "SAR 8,000 – 11,000 / month",
      description:
        "Plan and execute multi-channel marketing campaigns across Jarir's retail and digital presence in Jeddah and surrounding regions.\n\nResponsibilities:\n- Manage social media calendars, content, and paid campaigns\n- Coordinate with store managers on in-store promotions\n- Track campaign KPIs and report weekly to the marketing manager\n- Localise national campaigns for the Western Region",
      requiredSkills: "Social Media Marketing, Google Ads, Meta Ads, Canva, Arabic Copywriting",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-07-10"),
      createdBy: admin.id,
    },
    {
      title: "Supply Chain Coordinator",
      companyName: "SABIC Logistics",
      location: "Dammam",
      industry: "Manufacturing",
      employmentType: "Full-time",
      experienceRequired: "2-4 years",
      salaryRange: "SAR 10,000 – 13,000 / month",
      description:
        "Coordinate end-to-end supply chain operations including procurement, vendor management, and shipment tracking for petrochemical raw materials.\n\nResponsibilities:\n- Raise and track purchase orders with approved vendor list\n- Liaise with freight forwarders and customs brokers\n- Maintain inventory accuracy in SAP ERP\n- Produce weekly supply chain status reports",
      requiredSkills: "SAP, Supply Chain Management, Procurement, Excel, Inventory Control",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-08-10"),
      createdBy: admin.id,
    },
    {
      title: "Customer Success Manager",
      companyName: "Unifonic",
      location: "Riyadh",
      industry: "Technology",
      employmentType: "Full-time",
      experienceRequired: "3-5 years",
      description:
        "Drive adoption and retention for Unifonic's enterprise CPaaS customers across the GCC. You will own a portfolio of key accounts and act as the primary point of contact post-sales.\n\nResponsibilities:\n- Onboard new enterprise accounts and run QBRs\n- Monitor account health, identify churn risk, and create mitigation plans\n- Work with solutions engineers on technical escalations\n- Upsell and cross-sell additional channels to existing accounts",
      requiredSkills: "Customer Success, CRM (Salesforce), SaaS, Account Management, Arabic",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-09-15"),
      createdBy: admin.id,
    },
    {
      title: "Civil Engineer – Infrastructure",
      companyName: "NEOM Development Authority",
      location: "Other",
      industry: "Construction",
      employmentType: "Full-time",
      experienceRequired: "5-8 years",
      salaryRange: "SAR 20,000 – 28,000 / month",
      description:
        "Join the NEOM infrastructure team to design and oversee delivery of civil works for one of the world's most ambitious smart-city projects.\n\nResponsibilities:\n- Prepare and review civil engineering designs for roads, drainage, and utilities\n- Manage contractor submissions, RFIs, and site inspections\n- Ensure compliance with Saudi Building Code and project specifications\n- Coordinate with MEP, landscape, and structural disciplines",
      requiredSkills: "AutoCAD Civil 3D, Primavera P6, Saudi Building Code, Project Management, Revit",
      hrEmail: "admin@saudiacareers.com",
      applicationDeadline: new Date("2026-10-01"),
      createdBy: admin.id,
    },
  ];

  const result = await prisma.job.createMany({ data: jobs });
  console.info(`Inserted ${result.count} sample jobs.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
