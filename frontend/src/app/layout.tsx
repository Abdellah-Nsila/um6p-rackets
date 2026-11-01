import type { Metadata } from 'next';
import { Poppins, Roboto_Condensed, Geist_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import Navbar from '@/components/navbars/navbar';
import { Toaster } from '@/components/ui/sonner';
import { AuthDialog } from '@/components/auth/auth-dialog';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  preload: false
});

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  variable: '--font-roboto-condensed',
  display: 'swap',
  preload: false
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false
});

export const metadata: Metadata = {
  title: 'UM6P Racket',
  description: 'All Rackets Sport In One Place'
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning // react checks if server & client html match, but next-themes changes the theme on the client, so this is needed to avoid a hydration error
      className={cn(
        'h-full',
        'antialiased',
        poppins.variable,
        robotoCondensed.variable,
        geistMono.variable,
        'font-sans'
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Navbar />
          {children}
          <AuthDialog />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
