import { Card } from '../ui/card';

export default function ClubTitle({
  name,
}: {
  name: string;
  slug?: string;
  avatar?: string;
}) {
  const cleanName = name.replace(/club/i, '').trim();
  const formattedName = cleanName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return (
    <div className="pt-2 sm:pt-4">
      {/* Mobile Header Card */}
      <Card className="sm:hidden p-4 rounded-xl border border-border/70 shadow-2xs bg-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="min-w-0">
            <h1 className="text-center text-xl font-extrabold tracking-tight text-accent leading-tight truncate">
              {formattedName} <span className="text-foreground">Club</span>
            </h1>
            <p className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-accent/10 border border-accent/20 text-accent shrink-0">
              Official Campus Club
            </p>
          </div>
        </div>
      </Card>

      {/* Desktop / Tablet Header */}
      <div className="hidden sm:flex items-center gap-3.5">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-accent">
          {formattedName} <span className="text-foreground">Club</span>
        </h1>
        <p className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-accent/10 border border-accent/20 text-accent shrink-0">
            Official Campus Club
        </p>
      </div>
    </div>
  );
}
