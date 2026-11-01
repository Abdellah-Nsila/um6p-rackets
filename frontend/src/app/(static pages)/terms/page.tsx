import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | UM6P Racket",
  description: "The rules for using the UM6P Racket platform.",
};

const LAST_UPDATED = "2026-10-29";
const CONTACT_EMAIL = "um6prackets@gmail.com";

const sections = [
  {
    title: "1. About the service",
    body: [
      "UM6P Racket is a student platform for discovering and joining racket sports clubs at UM6P. By creating an account or using the site, you agree to these Terms.",
    ],
  },
  {
    title: "2. Eligibility and accounts",
    body: [
      "You must provide accurate information when you register. You are responsible for your account and your password. Tell us right away if you think someone accessed your account without permission.",
    ],
  },
  {
    title: "3. Acceptable use",
    body: [
      "Do not impersonate other people, upload offensive or illegal content (including avatars), try to break or overload the platform, or access other users' data.",
    ],
  },
  {
    title: "4. Your content",
    body: [
      "You keep ownership of what you upload, such as your avatar. You give us permission to display it inside the platform.",
    ],
  },
  {
    title: "5. Suspension and deletion",
    body: [
      "We may suspend or delete accounts that break these Terms. You can delete your account at any time by contacting us.",
    ],
  },
  {
    title: "6. Disclaimer and liability",
    body: [
      'The platform is provided "as is". We are not responsible for injuries, disputes, or incidents at club activities, or for temporary downtime or data loss.',
    ],
  },
  {
    title: "7. Changes to these Terms",
    body: [
      "We may update these Terms. If you keep using the platform after a change, you accept the new version.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-lg font-medium">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-neutral-700">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section>
          <h2 className="mb-2 text-lg font-medium">8. Contact</h2>
          <p className="leading-relaxed text-neutral-700">
            Questions about these Terms? Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        See also our{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </footer>
    </main>
  );
}
