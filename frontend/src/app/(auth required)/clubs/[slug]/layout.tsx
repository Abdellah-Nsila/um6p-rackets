import { Footer } from '@/components/footer';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div className="pt-20">
      <div className="min-h-screen py-4 lg:py-6 xl:py-8 px-0">{children}</div>
      <Footer />
    </div>
  );
}
