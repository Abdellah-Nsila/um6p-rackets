import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About | UM6P Rackets",
  description: "What UM6P Rackets is and how the clubs work.",
};

// What a member can do. Plain words, from the member's point of view.
const FEATURES = [
  {
    title: "Join a club",
    text: "Send a request to the sport you play. A leader accepts it, and you are in.",
  },
  {
    title: "Book weekly sessions",
    text: "Each club posts its sessions by week. Take a spot, or free it if your plans change.",
  },
  {
    title: "Arrange matches",
    text: "Pick your partner and opponents, choose a place and a time. A leader confirms the match and the referee enters the score.",
  },
  {
    title: "Climb the leaderboard",
    text: "A win earns 10 points and a loss costs 5. Everyone in the club is ranked.",
  },
  {
    title: "Stay informed",
    text: "Announcements and club documents live on the club page, next to the sessions.",
  },
];

const TEAM = [
  { name: "Zobair & Nsila", role: "Backend and infrastructure" },
  { name: "Hamza & Abdelkrim", role: "Frontend and design" },
];

// Court lines drawn in the theme's border color, so it works in light and dark mode
function CourtLines() {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="w-full max-w-md text-muted-foreground/40"
    >
      <rect x="2" y="2" width="196" height="96" />
      <rect x="2" y="14" width="196" height="72" />
      <line x1="100" y1="2" x2="100" y2="98" strokeWidth="3" />
      <line x1="50" y1="14" x2="50" y2="86" />
      <line x1="150" y1="14" x2="150" y2="86" />
      <line x1="50" y1="50" x2="150" y2="50" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-16 px-6 py-16">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            Every racket club at UM6P, in one place
          </h1>
          <p className="max-w-prose text-muted-foreground">
            UM6P Rackets is where students join their sport&apos;s club, book training sessions,
            arrange matches, and follow the rankings. It covers tennis, padel, badminton, squash,
            table tennis, and pickleball.
          </p>
          <Link href="/#clubs" className={buttonVariants({ variant: "default", size: "sm" })}>
            See the clubs
          </Link>
        </div>
        <CourtLines />
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">What you can do</h2>
        <dl className="divide-y border-y">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="grid gap-1 py-4 md:grid-cols-[1fr_2fr] md:gap-8">
              <dt className="font-medium">{feature.title}</dt>
              <dd className="text-muted-foreground">{feature.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Who built it</h2>
        <p className="max-w-prose text-muted-foreground">
          A team of four students built UM6P Rackets for the ft_transcendence project.
        </p>
        <dl className="divide-y border-y">
          {TEAM.map((member) => (
            <div key={member.name} className="grid gap-1 py-4 md:grid-cols-[1fr_2fr] md:gap-8">
              <dt className="font-medium">{member.name}</dt>
              <dd className="text-muted-foreground">{member.role}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
