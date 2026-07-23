import { prisma } from "./src/config/prisma.js";

const admin = await prisma.user.findUnique({ where: { email: "admin@saudiacareers.com" } });
if (!admin) throw new Error("Seed admin not found — run prisma/seed.js first");

const INDUSTRIES = [
  "IT - Software Services", "Finance & Banking", "Healthcare & Pharmaceuticals",
  "Retail & Consumer Goods", "Oil, Gas & Energy", "Construction & Real Estate",
  "Education & Training", "Media & Entertainment", "Hospitality & Tourism",
  "Telecommunications", "Logistics & Supply Chain", "Government & Public Sector",
  "Manufacturing", "Legal & Consulting",
];
const EXPERIENCE_LEVELS = ["Fresh graduate", "1-2 years", "2-3 years", "3-5 years", "5-10 years", "10+ years"];
const SALARY_RANGES = [
  "Under 5,000 SAR", "5,000 – 10,000 SAR", "10,000 – 15,000 SAR",
  "15,000 – 20,000 SAR", "20,000 – 30,000 SAR", "30,000+ SAR", null,
];
const LOCATIONS = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Mecca", "Medina", "Abha", "Tabuk", "Dhahran", "Jubail", "Remote - Saudi Arabia", "Other"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Temporary"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];
const GENDERS = ["Any", "Male", "Female"];
const NATIONALITIES = ["Any Nationality", "Saudi", "Non-Saudi"];
const STATUSES = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "INACTIVE", "PENDING_REVIEW", "DRAFT", "EXPIRED"];

const COMPANY_TEMPLATES = [
  "Nexora", "Al-Fanar", "Zenith", "Horizon", "Dunes & Co", "Falcon Peak", "Crescent Bay",
  "Rub' al Khali Ventures", "Emerald Sands", "Barq Digital", "Waha Industries", "Najd Holdings",
  "Tuwaiq Analytics", "Marina Point", "Qiddiya Partners", "Sadara Consulting", "Diriyah Works",
  "Al Ula Innovations", "Jawhara Group", "Masarat Logistics",
];
const COMPANY_SUFFIXES = ["", " LLC", " Group", " Holding", " Co.", " Enterprises", " International", " Trading Est."];

const TITLE_BY_INDUSTRY = {
  "IT - Software Services": ["Senior Full-Stack Engineer", "DevOps Platform Lead", "Mobile Applications Developer", "QA Automation Engineer"],
  "Finance & Banking": ["Corporate Credit Analyst", "Treasury Operations Manager", "Compliance & AML Officer", "Investment Banking Associate"],
  "Healthcare & Pharmaceuticals": ["Clinical Pharmacist", "Hospital Operations Manager", "Medical Affairs Specialist", "Regulatory Affairs Associate"],
  "Retail & Consumer Goods": ["Category Manager", "Store Operations Supervisor", "Merchandising Planner", "E-commerce Growth Manager"],
  "Oil, Gas & Energy": ["Process Safety Engineer", "Reservoir Engineer", "HSE Field Supervisor", "Pipeline Integrity Analyst"],
  "Construction & Real Estate": ["Senior Site Engineer", "Quantity Surveyor", "Facilities Project Manager", "BIM Coordinator"],
  "Education & Training": ["Curriculum Development Lead", "Corporate Training Manager", "Academic Program Coordinator", "STEM Instructor"],
  "Media & Entertainment": ["Content Production Manager", "Social Media Strategist", "Broadcast Engineer", "Creative Director"],
  "Hospitality & Tourism": ["Guest Relations Manager", "Hotel Revenue Analyst", "Events & Conference Manager", "Front Office Supervisor"],
  "Telecommunications": ["Network Operations Engineer", "RF Planning Specialist", "Telecom Billing Analyst", "5G Deployment Lead"],
  "Logistics & Supply Chain": ["Supply Chain Planner", "Warehouse Operations Manager", "Fleet Logistics Coordinator", "Customs & Trade Compliance Specialist"],
  "Government & Public Sector": ["Policy Research Analyst", "Public Program Coordinator", "Municipal Planning Officer", "Government Relations Advisor"],
  "Manufacturing": ["Production Planning Engineer", "Quality Assurance Manager", "Plant Maintenance Supervisor", "Industrial Process Engineer"],
  "Legal & Consulting": ["Corporate Legal Counsel", "Management Consultant", "Contracts & Compliance Specialist", "Strategy Advisory Associate"],
};

const RESPONSIBILITIES = [
  "Own the end-to-end delivery of key initiatives from scoping through post-launch review, coordinating across cross-functional stakeholders to keep timelines realistic and outcomes measurable.",
  "Partner closely with regional leadership to translate high-level strategic priorities into concrete, sequenced execution plans with clear ownership at every stage.",
  "Continuously monitor operational KPIs, flag emerging risks early, and drive root-cause analysis on recurring issues rather than treating symptoms in isolation.",
  "Mentor junior team members, run regular knowledge-sharing sessions, and help build institutional documentation so critical processes don't live only in one person's head.",
  "Represent the department in vendor negotiations and external partner discussions, balancing commercial terms against long-term relationship value.",
  "Lead process improvement efforts, identifying manual, error-prone workflows and championing their automation or simplification wherever the business case supports it.",
  "Prepare and present periodic performance reviews to senior stakeholders, translating raw operational data into a clear narrative that supports better decision-making.",
  "Ensure full compliance with relevant Saudi regulatory frameworks and internal governance policies across every deliverable this role touches.",
];

const REQUIREMENTS = [
  "A proven track record of delivering complex, multi-stakeholder projects on time and within budget, ideally within the Saudi or wider GCC market.",
  "Strong analytical instincts — comfortable moving between big-picture strategy and the granular detail needed to actually execute it.",
  "Excellent written and verbal communication in English; Arabic fluency is a strong plus given the volume of local stakeholder engagement in this role.",
  "Demonstrated ability to operate independently in ambiguous situations while still keeping leadership informed at the right cadence, not too much and not too little.",
  "A collaborative mindset — this role sits at the intersection of several teams and requires genuine cross-functional influence rather than top-down authority.",
  "Relevant professional certification in the field is preferred but not mandatory if the practical experience clearly demonstrates equivalent depth.",
];

const BENEFITS = [
  "Competitive base salary benchmarked against the local market, reviewed annually.",
  "Comprehensive medical insurance covering the employee and immediate family.",
  "Structured relocation and housing allowance support for candidates moving to Saudi Arabia.",
  "Clear internal growth pathway with quarterly performance check-ins, not just an annual review.",
  "Generous annual leave in line with Saudi labor law, plus additional leave accrual with tenure.",
  "Access to ongoing professional development budget for courses, conferences, and certifications.",
];

function pick(arr, i) { return arr[i % arr.length]; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffled(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function buildDescription(industry, title, seedIndex) {
  const intro = `We are looking for an experienced ${title} to join a fast-growing organisation operating in the ${industry} sector across the Kingdom of Saudi Arabia. This is a highly visible role reporting directly into senior leadership, with real ownership over outcomes from day one — not a role where you'll be shuffling paperwork while someone else makes every real decision.`;

  const respCount = 4 + (seedIndex % 4);
  const responsibilities = shuffled(RESPONSIBILITIES).slice(0, respCount);
  const reqCount = 3 + (seedIndex % 3);
  const requirements = shuffled(REQUIREMENTS).slice(0, reqCount);
  const benefitCount = 3 + (seedIndex % 3);
  const benefits = shuffled(BENEFITS).slice(0, benefitCount);

  return [
    intro,
    "",
    "Key responsibilities:",
    ...responsibilities.map((r) => `- ${r}`),
    "",
    "What we're looking for:",
    ...requirements.map((r) => `- ${r}`),
    "",
    "What's on offer:",
    ...benefits.map((b) => `- ${b}`),
    "",
    "This posting is part of a UI/content stress-test seed batch and is not an active vacancy.",
  ].join("\n");
}

const SKILL_POOL = [
  "Stakeholder Management", "Project Planning", "Budgeting & Forecasting", "Risk Management",
  "Process Improvement", "Data Analysis", "Vendor Negotiation", "Regulatory Compliance",
  "Cross-functional Collaboration", "Reporting & KPIs", "Team Leadership", "Arabic & English Communication",
  "MS Excel (Advanced)", "Power BI", "SAP", "ERP Systems", "Contract Management", "Quality Assurance",
  "Supply Chain Coordination", "Client Relationship Management",
];

function buildSkills(seedIndex) {
  const count = 4 + (seedIndex % 6);
  return shuffled(SKILL_POOL).slice(0, count).join(", ");
}

const jobs = [];
let idx = 0;

for (let i = 0; i < 50; i++) {
  const industry = pick(INDUSTRIES, i);
  const titleOptions = TITLE_BY_INDUSTRY[industry];
  const title = pick(titleOptions, i);
  const company = `${pick(COMPANY_TEMPLATES, i)}${pick(COMPANY_SUFFIXES, i + 3)}`;
  const location = pick(LOCATIONS, i);
  const employmentType = pick(EMPLOYMENT_TYPES, i);
  const experienceRequired = pick(EXPERIENCE_LEVELS, i);
  const salaryRange = pick(SALARY_RANGES, i);
  const workMode = pick(WORK_MODES, i);
  const gender = pick(GENDERS, i);
  const nationality = pick(NATIONALITIES, i);
  const status = pick(STATUSES, i);
  const domain = `${company.toLowerCase().replace(/[^a-z0-9]+/g, "")}-demo.com`;

  jobs.push({
    title,
    companyName: company,
    location,
    industry,
    employmentType,
    experienceRequired,
    salaryRange,
    description: buildDescription(industry, title, i),
    requiredSkills: buildSkills(i),
    hrEmail: `careers@${domain}`,
    gender,
    nationality,
    workMode,
    applyMethod: "PLATFORM",
    status,
    listingDurationDays: pick([30, 45, 60], i),
    department: i % 3 === 0 ? pick(["Operations", "Engineering", "People & Culture", "Commercial", "Strategy"], i) : null,
    createdBy: admin.id,
  });
  idx++;
}

// A handful of deliberate edge cases to stress-test UI text wrapping/overflow.
jobs.push({
  title: "Senior Principal Staff Software Engineer, Cross-Platform Infrastructure & Developer Experience Tooling Group",
  companyName: "SupercalifragilisticexpialidociousinfrastructureandtoolingcompanynameforUIoverflowtesting Holding",
  location: "Riyadh",
  industry: "IT - Software Services",
  employmentType: "Full-time",
  experienceRequired: "10+ years",
  salaryRange: "30,000+ SAR",
  description: buildDescription("IT - Software Services", "Senior Principal Staff Software Engineer", 1) +
    "\n\nEdgecasenote: ThisDescriptionAlsoContainsAVeryLongUnbrokenStringWithNoSpacesToSpecificallyTestCSSOverflowWrapAndWordBreakBehaviorAcrossJobCardAndJobDetailComponents1234567890abcdefghijklmnopqrstuvwxyz.",
  requiredSkills: shuffled(SKILL_POOL).concat(shuffled(SKILL_POOL)).slice(0, 20).join(", ") + ", " + "SupplyChainCoordinationButWrittenAsOneVeryLongUnbrokenSkillNameToTestWrapping",
  hrEmail: "careers@supercalifragilistic-demo.com",
  gender: "Any",
  nationality: "Any Nationality",
  workMode: "Hybrid",
  applyMethod: "PLATFORM",
  status: "ACTIVE",
  listingDurationDays: 60,
  department: "Engineering",
  createdBy: admin.id,
});

jobs.push({
  title: "مهندس برمجيات أول - فريق البنية التحتية والمنصات (Senior Software Engineer, Arabic Title Test)",
  companyName: "شركة الابتكار الرقمي للحلول التقنية المتقدمة",
  location: "الرياض - Riyadh",
  industry: "IT - Software Services",
  employmentType: "Full-time",
  experienceRequired: "5-10 years",
  salaryRange: "20,000 – 30,000 SAR",
  description: buildDescription("IT - Software Services", "Senior Software Engineer", 2) +
    "\n\nهذا الإعلان جزء من دفعة اختبار لواجهة المستخدم للتأكد من أن النصوص العربية تُعرض بشكل صحيح مع التفاف النص من اليمين إلى اليسار دون كسر تصميم الصفحة.",
  requiredSkills: "React, Node.js, Arabic/English Communication, البرمجة, إدارة المشاريع",
  hrEmail: "careers@digitalinnovation-demo.com",
  gender: "Any",
  nationality: "Saudi",
  workMode: "On-site",
  applyMethod: "PLATFORM",
  status: "ACTIVE",
  listingDurationDays: 30,
  department: null,
  createdBy: admin.id,
});

jobs.push({
  title: "Intern",
  companyName: "X",
  location: "Other",
  industry: "Legal & Consulting",
  employmentType: "Internship",
  experienceRequired: "Fresh graduate",
  salaryRange: null,
  description: "Short internship posting to test minimal-length content rendering. ".repeat(1),
  requiredSkills: "Excel",
  hrEmail: "hr@x-demo.com",
  gender: "Any",
  nationality: "Any Nationality",
  workMode: "Remote",
  applyMethod: "PLATFORM",
  status: "ACTIVE",
  listingDurationDays: 30,
  department: null,
  createdBy: admin.id,
});

const created = await prisma.job.createMany({ data: jobs });
console.log(`Created ${created.count} jobs.`);

const byStatus = await prisma.job.groupBy({ by: ["status"], _count: true, where: { createdBy: admin.id } });
console.log("By status:", byStatus.map((s) => `${s.status}=${s._count}`).join(", "));

const byIndustry = await prisma.job.groupBy({ by: ["industry"], _count: true, where: { createdBy: admin.id } });
console.log("By industry:", byIndustry.map((s) => `${s.industry}=${s._count}`).join(", "));

await prisma.$disconnect();
