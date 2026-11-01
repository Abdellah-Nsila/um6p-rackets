'use client';

import {
    Pagination as PaginationComponent,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function getPageItems(
    currentPage: number,
    totalPages: number
): (number | 'ellipsis-start' | 'ellipsis-end')[] {
    if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

  // Always include first page
    items.push(1);

    if (currentPage > 3) {
    items.push('ellipsis-start');
    }

    const start = Math.max(2, Math.min(currentPage - 1, totalPages - 3));
    const end = Math.min(totalPages - 1, Math.max(currentPage + 1, 4));

    for (let i = start; i <= end; i++) {
    items.push(i);
    }

    if (currentPage < totalPages - 2) {
    items.push('ellipsis-end');
    }

  // Always include last page
    items.push(totalPages);

    return items;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) {
    if (totalPages <= 0) return null;

    const pageItems = getPageItems(currentPage, totalPages);

    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    return (
    <PaginationComponent className="mx-0 w-auto">
        <PaginationContent className="gap-1 sm:gap-1.5">
        {/* Previous Button */}
        <PaginationItem>
            <PaginationPrevious
            href="#"
            onClick={(e) => {
                e.preventDefault();
                if (!isFirstPage) onPageChange(currentPage - 1);
            }}
            aria-disabled={isFirstPage}
            className={cn(
                    'h-8 px-2.5 text-xs font-bold italic transition-colors cursor-pointer',
                isFirstPage && 'pointer-events-none opacity-40 cursor-not-allowed'
            )}
            />
        </PaginationItem>

        {/* Page Numbers and Ellipses */}
        {pageItems.map((item, index) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
            return (
                <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis className="h-8 w-8 text-muted-foreground" />
                </PaginationItem>
            );
            }

            const pageNum = item as number;
            const isActive = pageNum === currentPage;

            return (
            <PaginationItem key={pageNum}>
                <PaginationLink
                href="#"
                isActive={isActive}
                onClick={(e) => {
                    e.preventDefault();
                    onPageChange(pageNum);
                }}
                className={cn(
                    'h-8 min-w-8 px-2.5 text-xs font-bold italic transition-colors cursor-pointer',
                    isActive
                    ? 'bg-brand-orange text-white border border-brand-orange hover:bg-brand-orange/90 hover:text-white dark:bg-brand-orange dark:text-white'
                    : 'hover:bg-muted text-foreground'
                )}
                >
                {pageNum}
                </PaginationLink>
            </PaginationItem>
            );
        })}

        {/* Next Button */}
        <PaginationItem>
            <PaginationNext
            href="#"
            onClick={(e) => {
                e.preventDefault();
                if (!isLastPage) onPageChange(currentPage + 1);
            }}
            aria-disabled={isLastPage}
            className={cn(
                'h-8 px-2.5 text-xs font-bold italic transition-colors cursor-pointer',
                isLastPage && 'pointer-events-none opacity-40 cursor-not-allowed'
            )}
            />
        </PaginationItem>
        </PaginationContent>
    </PaginationComponent>
    );
}
