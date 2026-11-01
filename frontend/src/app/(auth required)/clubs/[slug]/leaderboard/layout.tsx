
export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div>
      <div className="min-h-screen p-4 lg:p-6 xl:p-8">{children}</div>
    </div>
  );
}
