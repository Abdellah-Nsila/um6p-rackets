export default function SectionHeader({ title, id }: { title: string; id: string }) {
  return (
    <div 
      className="flex items-center gap-2 sm:gap-4 w-full mt-12 mb-6 md:mt-20 md:mb-8 lg:mt-28 lg:mb-12" 
      id={id}
    >
      <span className="h-1.5 sm:h-2.5 lg:h-3 w-16 sm:w-20 md:w-30 lg:w-30 bg-accent shrink-0" />
      
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-7.5xl text-secondary-foreground font-black italic uppercase tracking-tight leading-none">
        {title}
      </h2>
    </div>
  );
}