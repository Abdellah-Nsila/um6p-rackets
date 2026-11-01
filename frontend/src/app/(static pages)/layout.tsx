import { Footer } from '@/components/footer';

export default function StaticLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="min-h-screen pt-20">
      {/* <StaticNavbar /> its old */}
      {children}
      <Footer />
    </div>
  );
}
