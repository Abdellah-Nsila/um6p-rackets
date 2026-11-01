'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp, Loader2, Plus, Trash2 } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { 
  useClubAnnouncements, 
  useCreateAnnouncement, 
  useDeleteAnnouncement 
} from '@/hooks/use-announcement';
import { createAnnouncementSchema, type CreateAnnouncementValues } from '@/lib/schemas/announcement';
import type { AnnouncementWithAuthor } from '@/types/contracts/club';

function Announcement({
  clubSlug,
  announcement,
  isAdmin,
}: {
  clubSlug: string;
  announcement: AnnouncementWithAuthor;
  isAdmin: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const deleteMutation = useDeleteAnnouncement(clubSlug);

  const formattedDate = (() => {
    if (!announcement.created_at) return '';
    const isoString = announcement.created_at.includes(' ') && !announcement.created_at.includes('T')
      ? announcement.created_at.replace(' ', 'T')
      : announcement.created_at;
    const date = new Date(isoString);
    return !isNaN(date.getTime())
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : announcement.created_at;
  })();

  // Directly extract the author details from the announcement contract object
  const announcer = announcement.announcer;
  const displayName = [announcer?.first_name, announcer?.last_name]
    .filter(Boolean).join(' ') || announcer?.login || 'Club Admin';

  const isLongText = announcement.description.length > 160 || announcement.description.includes('\n');

  return (
    <Card className="p-4 gap-2 flex flex-col justify-between items-start m-0 w-full bg-card border border-border/70 rounded-xl shadow-2xs group relative">
      {isAdmin && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 transition-opacity text-destructive hover:bg-destructive/10 z-10"
              />
            }
          >
            <Trash2 className="w-4 h-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the announcement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate(announcement.id)} 
                className="bg-destructive text-white hover:bg-white hover:border-destructive hover:text-destructive"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <div className="w-full pr-8">
        <CardDescription className={cn(
          "text-sm sm:text-base text-foreground font-medium leading-relaxed whitespace-pre-wrap break-all",
          !isExpanded && "line-clamp-3"
        )}>
          {announcement.description}
        </CardDescription>

        {isLongText && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1.5 text-xs text-brand-orange hover:text-brand-orange/80 hover:bg-transparent p-0 h-auto font-semibold cursor-pointer"
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        )}
      </div>

      <div className="flex justify-between w-full text-xs text-muted-foreground/80 pt-1 mt-3 border-t border-border/40">
        <span className="italic font-medium">By {displayName}</span>
        <span className="font-semibold">{formattedDate}</span>
      </div>
    </Card>
  );
}

export default function AnnouncementList({
  clubSlug,
  isAdmin = false
}: {
  clubSlug: string;
  isAdmin?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const INITIAL_VISIBLE_COUNT = 4;

  const { data: announcements = [], isLoading } = useClubAnnouncements(clubSlug);
  const createMutation = useCreateAnnouncement(clubSlug);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAnnouncementValues>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: {
      description: '',
    },
  });

  const onSubmit = (values: CreateAnnouncementValues) => {
    createMutation.mutate(values.description, {
      onSuccess: () => {
        reset();
        setIsAddOpen(false);
      },
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-orange" /></div>;

  const visibleAnnouncements = showAll ? announcements : announcements.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = announcements.length > INITIAL_VISIBLE_COUNT;

  return (
    <div className="flex-1 flex flex-col">
      {isAdmin && (
        <div className="flex justify-end mb-8">
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) reset(); }}>
            <DialogTrigger render={<Button size="sm" className="h-9 sm:h-10 rounded-lg bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-xs sm:text-sm cursor-pointer not-italic" />}>
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> New Announcement
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Message Content</Label>
                  <Textarea
                    placeholder="Type the announcement here..."
                    className="min-h-25"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive font-medium">{errors.description.message}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { reset(); setIsAddOpen(false); }}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Post"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="text-sm text-muted-foreground italic p-6 text-center bg-card rounded-xl border border-border/70">
          No announcements have been posted yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visibleAnnouncements.map((announcement) => (
            <Announcement
              key={announcement.id}
              clubSlug={clubSlug}
              announcement={announcement}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="pt-2 pb-1 flex justify-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-brand-orange hover:text-brand-orange/80 hover:bg-transparent p-0 h-auto font-semibold cursor-pointer inline-flex items-center gap-1"
          >
            {showAll ? (
              <><span>Show less</span><ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <><span>Show more ({announcements.length - INITIAL_VISIBLE_COUNT} more)</span><ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
