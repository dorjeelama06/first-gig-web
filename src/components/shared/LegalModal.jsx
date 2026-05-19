export default function LegalModal({ section, onClose }) {
  return (
    <div className="gs-legal-overlay">
      <div className="gs-legal-header">
        <button className="gs-legal-back" onClick={onClose} aria-label="Go back">
          ← Back
        </button>
        <span className="gs-legal-header-title">
          {section === "terms" ? "Terms of Service" : "Privacy Policy"}
        </span>
        {/* spacer keeps title centred */}
        <span style={{ width: 64, flexShrink: 0 }} />
      </div>

      <div className="gs-legal-body">
        {section === "terms" ? <TermsContent /> : <PrivacyContent />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Terms of Service                                          */
/* ─────────────────────────────────────────────────────────── */
function TermsContent() {
  return (
    <>
      <p className="gs-legal-meta">Last updated: May 2025</p>

      <p className="gs-legal-p">
        These Terms of Service govern your use of the <strong>First Gig</strong> platform,
        website, mobile application, and related services. First Gig is a platform that helps
        local businesses connect with local applicants, including minors, for part-time,
        seasonal, temporary, or entry-level work opportunities. By using First Gig, you agree
        to the terms below.
      </p>

      <h2 className="gs-legal-h2">1. Nature of the Platform</h2>
      <p className="gs-legal-p">
        First Gig is only a connection platform. First Gig helps businesses and applicants find
        each other. First Gig is <strong>not the employer</strong> of any applicant. Any job
        offered through the app is between the business and the applicant. The business is
        responsible for all hiring decisions, wages, schedules, supervision, workplace safety,
        taxes, insurance, and compliance with employment laws.
      </p>

      <h2 className="gs-legal-h2">2. Eligibility and Minor Users</h2>
      <p className="gs-legal-p">
        If you are under 18, you may only use First Gig with the knowledge and permission of
        your parent or legal guardian. Before you can apply for jobs or communicate with
        businesses through the app, you must provide a valid email address for your parent or
        legal guardian. First Gig may use that email address to notify your parent or guardian
        about your account, job applications, communications, or other activity on the app.
      </p>
      <p className="gs-legal-p">
        You may not provide false information, lie about your age, or use someone else&apos;s
        parent or guardian email address.
      </p>

      <h2 className="gs-legal-h2">3. Parent / Guardian Notice and Consent</h2>
      <p className="gs-legal-p">
        By permitting a minor to use First Gig, the parent or legal guardian acknowledges and
        agrees that:
      </p>
      <ul className="gs-legal-list">
        <li>The parent or guardian is responsible for reviewing each job opportunity before the
          minor accepts work.</li>
        <li>Before a minor starts a job, the parent or guardian should review the job duties,
          hours, pay, location, transportation, supervision, and safety of the position.</li>
        <li>Parents and guardians should also confirm that the job is lawful and appropriate for
          the minor.</li>
        <li>First Gig is not the employer of the minor and does not guarantee the safety,
          legality, quality, or suitability of any job posting, business, workplace, or
          employment relationship.</li>
      </ul>

      <h2 className="gs-legal-h2">4. Business User Responsibilities</h2>
      <p className="gs-legal-p">
        Businesses using First Gig are responsible for following all applicable federal, state,
        and local employment laws, including laws that apply to minors. This includes, but is
        not limited to:
      </p>
      <ul className="gs-legal-list">
        <li>Child labor laws</li>
        <li>Minimum wage and overtime laws</li>
        <li>Working papers or employment certificate requirements</li>
        <li>Restrictions on school-day hours and total work hours</li>
        <li>Restrictions on hazardous or prohibited work</li>
        <li>Workplace safety rules</li>
        <li>Tax, payroll, and insurance obligations</li>
      </ul>
      <p className="gs-legal-p">
        Businesses may not post jobs that are unsafe, unlawful, misleading, discriminatory, or
        inappropriate for minors. Before allowing a minor to begin work, the business must
        confirm that the minor is legally allowed to work and has any required working papers,
        permits, or parental consent.
      </p>

      <h2 className="gs-legal-h2">5. New Jersey Youth Employment Notice</h2>
      <p className="gs-legal-p">
        Because First Gig is intended for use in New Jersey, businesses must comply with New
        Jersey youth employment laws. Businesses are responsible for confirming whether a minor
        needs working papers, an employment certificate, or another permit before starting work.
        Businesses must also follow all rules about the number of hours a minor may work, the
        times of day a minor may work, required breaks, and the types of work a minor may
        perform.
      </p>
      <p className="gs-legal-p">
        First Gig does not issue working papers, approve jobs for minors, or guarantee that any
        job complies with New Jersey law.
      </p>

      <h2 className="gs-legal-h2">6. No Guarantee of Employment or Applicants</h2>
      <p className="gs-legal-p">
        First Gig does not guarantee that an applicant will get a job, nor that a business will
        find qualified applicants. Applicants, parents, and guardians are responsible for
        deciding whether a job is safe, lawful, and appropriate. Businesses are responsible for
        deciding whether an applicant is qualified and legally eligible to work.
      </p>

      <h2 className="gs-legal-h2">7. User Safety</h2>
      <p className="gs-legal-p">
        Users should be careful when communicating with other users, attending interviews,
        traveling to job sites, or accepting work. Minor applicants should not attend interviews,
        visit job sites, or accept work without parent or guardian knowledge and approval.
        Parents and guardians are encouraged to review all job postings, communications,
        business information, work locations, job duties, hours, and pay before allowing a minor
        to move forward.
      </p>

      <h2 className="gs-legal-h2">8. Background Checks and Verification</h2>
      <p className="gs-legal-p">
        Unless expressly stated otherwise, First Gig does not independently verify the identity,
        background, qualifications, licenses, insurance, or legal compliance of any user,
        business, or applicant. Any background check, reference check, or screening process is
        the responsibility of the hiring business.
      </p>

      <h2 className="gs-legal-h2">9. Payment, Wages, and Taxes</h2>
      <p className="gs-legal-p">
        Unless expressly stated otherwise, First Gig does not pay applicants, process payroll,
        set wages, issue tax forms, withhold taxes, or decide whether someone is an employee or
        independent contractor. The hiring business is responsible for payment, payroll, taxes,
        insurance, and all wage and hour requirements.
      </p>

      <h2 className="gs-legal-h2">10. User Information</h2>
      <p className="gs-legal-p">
        All users must provide accurate and truthful information. Applicants may not lie about
        their age, identity, experience, availability, qualifications, school status, or
        parent/guardian consent. Businesses may not misrepresent job duties, pay, hours,
        location, safety conditions, or legal requirements.
      </p>
      <p className="gs-legal-p">
        First Gig may remove content, suspend accounts, or restrict access if a user provides
        false, misleading, inappropriate, or unlawful information.
      </p>

      <h2 className="gs-legal-h2">11. Privacy and Minor Information</h2>
      <p className="gs-legal-p">
        First Gig may collect information from users, including minors, as described in its{" "}
        <strong>Privacy Policy</strong>. For minors, this may include name, age, contact
        information, parent or guardian email address, location, work availability, applications,
        and communications through the app. Children under 13 may not use First Gig unless
        legally required parental consent procedures have been completed.
      </p>

      <h2 className="gs-legal-h2">12. Disclaimer of Liability</h2>
      <p className="gs-legal-p">
        To the fullest extent allowed by law, First Gig is not responsible for claims, injuries,
        losses, disputes, or damages related to: job postings; hiring decisions; workplace
        conditions; interviews or meetings; travel to or from work; wages or payment disputes;
        user communications; false or misleading information; child labor compliance; working
        papers or permits; or any employment relationship between a business and an applicant.
      </p>
      <p className="gs-legal-p">
        <strong>Use of First Gig is at your own risk.</strong>
      </p>

      <h2 className="gs-legal-h2">13. Account Suspension</h2>
      <p className="gs-legal-p">
        First Gig may suspend, restrict, or remove any account or job posting if we believe a
        user has violated these terms, provided false information, created a safety concern,
        violated the law, or misused the app.
      </p>

      <h2 className="gs-legal-h2">14. Minor Applicant Certification</h2>
      <p className="gs-legal-p">
        Before creating an account, applying for a job, or communicating with a business through
        First Gig, any user under 18 certifies the following:
      </p>
      <ul className="gs-legal-list">
        <li>I certify that I am under 18 years old.</li>
        <li>I certify that all information I provide to First Gig is true and accurate.</li>
        <li>I understand that I may not apply for, accept, or begin any job through First Gig
          without the knowledge and approval of my parent or legal guardian.</li>
        <li>I understand that I must provide a valid email address for my parent or legal
          guardian before I can apply for jobs or communicate with businesses through First
          Gig.</li>
        <li>I understand that my parent or legal guardian may receive notice about my account,
          job applications, communications, and other activity on First Gig.</li>
        <li>I understand that, if I work in New Jersey, I may need working papers, an
          employment certificate, or another required permit before I can begin work.</li>
        <li>I understand that First Gig is not my employer and does not guarantee that I will
          get a job.</li>
        <li>I understand that First Gig does not guarantee that any job, business, workplace, or
          communication is safe, lawful, or appropriate for me.</li>
        <li>I agree that I will not lie about my age, provide false information, use someone
          else&apos;s parent or guardian email address, or use First Gig without my parent or
          guardian&apos;s knowledge.</li>
      </ul>

      <div className="gs-legal-notice-box">
        By creating an account on First Gig you confirm you have read, understood, and agree to
        these Terms of Service.
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Privacy Policy                                            */
/* ─────────────────────────────────────────────────────────── */
function PrivacyContent() {
  return (
    <>
      <p className="gs-legal-meta">Last updated: May 2025</p>

      <p className="gs-legal-p">
        First Gig (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to
        protecting the privacy of all users, especially minors. This Privacy Policy explains
        what information we collect, how we use it, and your rights regarding that information.
      </p>

      <h2 className="gs-legal-h2">1. Information We Collect</h2>
      <p className="gs-legal-p">We collect the following categories of information:</p>
      <ul className="gs-legal-list">
        <li><strong>Account information</strong> — email address and password (managed
          securely via Supabase Auth).</li>
        <li><strong>Seeker profile</strong> — first and last name, date of birth, gender,
          zip code, phone number, work availability, interests/skills, and work experience
          entries.</li>
        <li><strong>Employer profile</strong> — company name, contact name, email, phone,
          website, and zip code.</li>
        <li><strong>Parent / guardian email</strong> — required for users under 18 before
          they may apply for jobs or message businesses.</li>
        <li><strong>Job applications</strong> — records of which seekers applied to which
          job postings.</li>
        <li><strong>Messages</strong> — chat messages sent between employers and seekers
          through the in-app messaging system.</li>
        <li><strong>Usage data</strong> — standard server logs (IP address, browser type,
          pages visited) collected automatically by our hosting provider.</li>
      </ul>

      <h2 className="gs-legal-h2">2. How We Use Your Information</h2>
      <ul className="gs-legal-list">
        <li>To create and manage your account.</li>
        <li>To display your profile to relevant employers or seekers.</li>
        <li>To facilitate job applications and employer-seeker communication.</li>
        <li>To notify parents or guardians of minor account activity as required by our
          Terms of Service.</li>
        <li>To enforce our Terms of Service and keep the platform safe.</li>
        <li>To improve First Gig&apos;s features and user experience.</li>
      </ul>
      <p className="gs-legal-p">
        We do <strong>not</strong> sell your personal information. We do not use your data for
        targeted advertising.
      </p>

      <h2 className="gs-legal-h2">3. Minor Users and COPPA</h2>
      <p className="gs-legal-p">
        First Gig is designed for users aged 13 and older. <strong>Children under 13 may not
        create an account</strong> unless all legally required parental consent procedures under
        the Children&apos;s Online Privacy Protection Act (COPPA) have been completed. If we
        learn that we have collected personal information from a child under 13 without proper
        consent, we will delete that information promptly.
      </p>
      <p className="gs-legal-p">
        For users aged 13–17, we collect a parent or guardian email address and may contact
        that address with notifications about account activity, job applications, and
        communications. Parents may request access to, correction of, or deletion of their
        minor child&apos;s data by contacting us at the address below.
      </p>

      <h2 className="gs-legal-h2">4. Data Sharing</h2>
      <p className="gs-legal-p">We share information only in these limited circumstances:</p>
      <ul className="gs-legal-list">
        <li><strong>Between platform users</strong> — seeker profiles are visible to employers
          who receive applications; employer profiles and job postings are visible to seekers.</li>
        <li><strong>Supabase</strong> — our database and authentication provider processes data
          on our behalf under a data processing agreement.</li>
        <li><strong>Legal requirements</strong> — we may disclose information if required by
          law, court order, or to protect the safety of users.</li>
      </ul>

      <h2 className="gs-legal-h2">5. Data Retention</h2>
      <p className="gs-legal-p">
        We retain your account and profile data for as long as your account is active. If you
        delete your account, we will delete your personal data within 30 days, except where
        retention is required by law.
      </p>

      <h2 className="gs-legal-h2">6. Security</h2>
      <p className="gs-legal-p">
        We use industry-standard security practices including encrypted connections (HTTPS),
        hashed passwords, and row-level security policies on our database. No system is
        perfectly secure — if you suspect unauthorized access to your account, contact us
        immediately.
      </p>

      <h2 className="gs-legal-h2">7. Your Rights</h2>
      <p className="gs-legal-p">
        You may request access to, correction of, or deletion of your personal data at any
        time. Parents and guardians may make these requests on behalf of their minor children.
        To exercise these rights, contact us at the address below.
      </p>

      <h2 className="gs-legal-h2">8. Changes to This Policy</h2>
      <p className="gs-legal-p">
        We may update this Privacy Policy from time to time. We will notify registered users of
        material changes by email. Continued use of First Gig after changes are posted
        constitutes acceptance of the updated policy.
      </p>

      <h2 className="gs-legal-h2">9. Contact Us</h2>
      <p className="gs-legal-p">
        For privacy questions, data requests, or COPPA-related inquiries, please contact:
      </p>
      <div className="gs-legal-contact-box">
        <strong>First Gig</strong><br />
        New Jersey, USA<br />
        Email: <a href="mailto:privacy@firstgig.app" className="gs-legal-link-inline">privacy@firstgig.app</a>
      </div>
    </>
  );
}
