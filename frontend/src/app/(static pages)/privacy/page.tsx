import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | UM6P Racket",
  description: "How UM6P Racket collects, uses, and protects your data.",
};

const LAST_UPDATED = "2026-10-29";
const CONTACT_EMAIL = "um6prackets@gmail.com";
const HOSTING_PROVIDER = "GitHub Pages";
const STORAGE_LOCATION = "Morocco (GitHub) servers)";
const RETENTION_DAYS = 30;

const accountData = [
  "Username",
  "First name and last name",
  "Gender",
  "Department",
  "Phone number",
  "Email address",
  "Avatar",
];

const technicalData = [
  "IP address, browser, and device information",
  "Logs needed to run and secure the service",
  "Cookies or local storage used to keep you logged in",
];

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-neutral-700">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="mb-2 text-lg font-medium">1. Data we collect</h2>
          <p className="mb-2 text-neutral-700">Account data you give us:</p>
          <BulletList items={accountData} />
          <p className="mb-2 mt-4 text-neutral-700">Technical data collected automatically:</p>
          <BulletList items={technicalData} />
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium">2. Why we use it</h2>
          <p className="leading-relaxed text-neutral-700">
            To create and manage your account, show your profile and club membership, contact you
            about the platform, and keep it secure.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium">3. Sharing</h2>
          <p className="leading-relaxed text-neutral-700">
            We do not sell your data. It is only shared with the infrastructure providers needed to
            run the platform ({HOSTING_PROVIDER}) and, where relevant, club organizers at UM6P.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium">4. Storage and retention</h2>
          <p className="leading-relaxed text-neutral-700">
            Your data is stored in {STORAGE_LOCATION}. We keep it while your account is active and
            delete it within {RETENTION_DAYS} days of an account deletion request.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium">5. Your rights</h2>
          <p className="leading-relaxed text-neutral-700">
            You can access, correct, or delete your data at any time by contacting us. In Morocco
            this is covered by Law 09-08. If you are in the EU, GDPR rights also apply.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium">6. Security</h2>
          <p className="leading-relaxed text-neutral-700">
            Passwords are hashed and data is sent over HTTPS.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium">7. Contact</h2>
          <p className="leading-relaxed text-neutral-700">
            Questions or requests? Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        See also our{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Terms of Service
        </Link>
        .
      </footer>
    </main>
  );
}
