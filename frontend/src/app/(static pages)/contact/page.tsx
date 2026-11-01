import type { Metadata } from "next";
import { CONTACT_EMAIL, ContactForm } from "@/components/contact/contact-form";


export const metadata: Metadata = {
  title: "Contact | UM6P Rackets",
  description: "Get in touch with the UM6P Rackets team.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-16 md:grid-cols-[2fr_3fr]">
      <section className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight">Contact us</h1>
        <p className="text-muted-foreground">
          Found a bug, have an idea, or need help with your account? Send us a message and we will
          reply by email.
        </p>

        <dl className="space-y-4 border-t pt-6 text-sm">
          <div>
            <dt className="font-medium">Email</dt>
            <dd>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-muted-foreground underline">
                {CONTACT_EMAIL}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium">Questions about a club</dt>
            <dd className="text-muted-foreground">
              Coaches and leaders answer these fastest. You can find them in the club&apos;s
              members list.
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <ContactForm />
      </section>
    </main>
  );
}