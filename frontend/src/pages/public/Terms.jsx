const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: "By creating an account or using SaudiaCareers, you agree to these Terms & Conditions. If you are registering on behalf of a company, you confirm you have authority to bind that company to these terms.",
  },
  {
    title: "2. Candidate accounts",
    body: "Candidates may create a free profile, upload a resume, and apply to job listings. You are responsible for keeping your account credentials confidential and for the accuracy of the information in your profile and resume.",
  },
  {
    title: "3. Employer accounts",
    body: "Employer accounts are subject to a company verification review before job postings can be published. We may request supporting documents to confirm your company's identity. Draft job postings may be created at any time; publishing is gated on verification and available job credits.",
  },
  {
    title: "4. Job postings and applications",
    body: "Employers are responsible for the accuracy and legality of the job listings they publish. Submitting an application sends your profile and resume directly to the employer's designated HR contact for that listing. SaudiaCareers does not guarantee interviews, offers, or employment outcomes.",
  },
  {
    title: "5. Job credits and billing",
    body: "Free and paid job-posting plans are described on the Billing page inside the employer portal. Credit purchases and plan changes are confirmed manually by our team; credits are applied once payment is verified. Pricing is subject to change with notice.",
  },
  {
    title: "6. Acceptable use",
    body: "You may not use SaudiaCareers to post discriminatory, fraudulent, or misleading listings, to scrape or harvest candidate data, or to interfere with the normal operation of the platform.",
  },
  {
    title: "7. Termination",
    body: "We may suspend or terminate accounts that violate these terms, including employers who fail verification, submit fraudulent job postings, or misuse candidate data.",
  },
  {
    title: "8. Changes to these terms",
    body: "We may update these Terms & Conditions from time to time. Continued use of SaudiaCareers after changes take effect constitutes acceptance of the revised terms.",
  },
  {
    title: "9. Contact",
    body: "Questions about these terms can be sent to admin@saudiacareers.com.",
  },
];

export function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="section-label">Legal</p>
      <h1 className="page-title text-3xl md:text-4xl">Terms & Conditions</h1>
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
