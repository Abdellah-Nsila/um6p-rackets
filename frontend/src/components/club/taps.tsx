'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import AnnouncementList from './announcement-list';
import DocumentList from './document-list';
import SessionsList, { SessionsSkeleton } from './sessions-list';

import { cn } from 'cn';
import { MemberRole } from '@/types/contracts/club';

const tabTriggerClass = cn(
  'flex-1 basis-0 min-w-0 h-9 sm:h-10 px-1.5 sm:px-4 py-1.5 sm:py-2',
  'text-xs sm:text-sm font-semibold text-center whitespace-nowrap',
  'text-muted-foreground transition-all duration-200 cursor-pointer',
  'hover:text-accent hover:bg-transparent',
  'data-active:bg-accent data-active:text-accent-foreground data-active:hover:bg-accent data-active:hover:text-accent-foreground data-active:shadow-2xs',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:text-muted-foreground',
  'after:hidden'
);

export default function ClubTaps({
  clubSlug,
  userRole, // 1. Add userRole to the props
}: { 
  clubSlug: string;
  userRole?: MemberRole | null; // 2. Add it to the types (Optional because non-members won't have a role)
}) {
  
  // 3. Define who is an admin (Role 1 = Leader, Role 2 = Coach)
  const isAdmin = userRole === 1 || userRole === 2;

  return (
    <Tabs defaultValue="sessions" className="w-full lg:h-full flex flex-col">
      <TabsList className="w-full group-data-horizontal/tabs:h-auto h-auto p-1 sm:p-1.5 bg-card border border-border/50 rounded-xl flex flex-row items-center gap-1 sm:gap-1.5 shadow-2xs shrink-0">
        <TabsTrigger value="sessions" className={tabTriggerClass}>
          Sessions
        </TabsTrigger>
        <TabsTrigger value="Announcements" className={tabTriggerClass}>
          Announcements
        </TabsTrigger>
        <TabsTrigger value="Tournament" disabled className={cn(tabTriggerClass, 'hidden')}>
          Tournament
        </TabsTrigger>
        <TabsTrigger value="Documents" className={tabTriggerClass}>
          Documents
        </TabsTrigger>
      </TabsList>
      <div className="w-full flex-1 p-4 flex flex-col mt-2 bg-card rounded-3xl border border-border/70 shadow-2xs">
        <TabsContent value="sessions" className="flex-1 flex flex-col m-0">
          <Suspense fallback={<SessionsSkeleton />}>
            {/* Pass isAdmin to Sessions (for later) */}
            <SessionsList clubSlug={clubSlug} isAdmin={isAdmin} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="Announcements" className="flex-1 flex flex-col m-0">
          {/* Pass isAdmin down to Announcements */}
          <AnnouncementList clubSlug={clubSlug} isAdmin={isAdmin} />
        </TabsContent>
        
        <TabsContent value="Tournament" className="flex-1 flex flex-col m-0">
          {/* TODO: Implement tournament content */}
          tournament content should be here
        </TabsContent>
        
        <TabsContent value="Documents" className="flex-1 flex flex-col m-0">
          {/* Pass isAdmin down to Documents */}
          <DocumentList clubSlug={clubSlug} isAdmin={isAdmin} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
