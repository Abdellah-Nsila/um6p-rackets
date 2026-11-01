import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const links = [
  { label: 'Home', href: '/' },
  { label: 'Browse Clubs', href: '/#clubs' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' }
];

const legalLinks = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' }
];

function LinkList({ items }: { items: typeof links }) {
  return (
    <ul className="space-y-3">
      {items.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="hover:text-accent hover:underline transition-colors">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 py-10 px-6 text-secondary-foreground flex flex-col items-center">
      <Separator
        className="bg-secondary-foreground mb-12 md:mb-18"
        style={{ height: '4px', width: '70%' }}
      />
      
      <div className="w-full max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between gap-12 md:gap-4 h-full">
          
          <LinkList items={links} />
          <LinkList items={legalLinks} />

          <div className="space-y-2 text-sm sm:text-base">
            <p>Location: UM6P Campus, Ben Guerir, Morocco</p>
            <p>Email: support@um6prackets.ma</p>
            <p>Hours: Monday – Sunday, 7:00 AM – 10:00 PM</p>
            
            <div className="mt-6 inline-block rounded-md dark:bg-white dark:p-2">
              <Link
                href="https://www.um6p.ma/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/UM6P_LOGO/COLOR/UM6P_Horizontal.png"
                  alt="UM6P"
                  width={200}
                  height={50}
                  className="h-auto w-40"
                />
              </Link>
            </div>
          </div>
          
        </div>
      </div>
    </footer>
  );
}