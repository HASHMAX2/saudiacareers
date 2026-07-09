const SECTIONS = [
  {
    title: "1. Information we collect",
    body: "For candidates: name, email, mobile number, location, professional details, resume, and profile photo. For employers: company details, contact person information, and verification documents. We also store records of job applications and their status.",
  },
  {
    title: "2. How we use your information",
    body: "Candidate profile and resume data is shared with the employer's HR contact only when you apply to a specific job. Employer company details are used to verify accounts and are shown on public job listings. We use contact details to send account, application, and billing-related emails.",
  },
  {
    title: "3. File storage",
    body: "Resumes, profile photos, and employer verification documents are stored in private cloud storage and are never publicly accessible. Access is granted only through short-lived signed links generated when you or an authorized party requests a file.",
  },
  {
    title: "4. Data retention",
    body: "We retain account and application data for as long as your account is active. Job listings are soft-deleted (not permanently erased) to preserve accurate application history. You may request deletion of your candidate account and associated data at any time.",
  },
  {
    title: "5. Data sharing",
    body: "We do not sell candidate or employer data. Candidate profile and resume data is shared only with the employer you apply to, for the purpose of that application. We may share data with service providers (such as our email and storage providers) strictly to operate the platform.",
  },
  {
    title: "6. Security",
    body: "Passwords are hashed and never stored in plain text. Authentication uses short-lived access tokens with secure, httpOnly refresh cookies. All file access uses time-limited signed URLs rather than public links.",
  },
  {
    title: "7. Your choices",
    body: "You can update or remove your profile information, resume, and photo at any time from your dashboard. Candidates can request full account deletion by contacting admin@saudiacareers.com.",
  },
  {
    title: "8. Changes to this policy",
    body: "We may update this Privacy Policy periodically. Material changes will be communicated by email or an in-app notice.",
  },
  {
    title: "9. Contact",
    body: "Questions about this policy or your data can be sent to admin@saudiacareers.com.",
  },
];

export function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="section-label">Legal</p>
      <h1 className="page-title text-3xl md:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm" style={{ color: "var(--text-tertiary)" }}>Last updated July 2026</p>

      <div className="mt-8 space-y-7">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>{s.title}</h2>
            <p className="mt-2 text-[15px] leading-7" style={{ color: "var(--text-secondary)" }}>{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
