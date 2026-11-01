import { useState } from "react";
import MembersRow from "./members-row";
import Pagination from "@/components/leaderboard/pagination";
import type { MemberWithUser } from "@/types/contracts/club";

const ITEMS_PER_PAGE = 10;

export default function MembersTable({ members }: { members: MemberWithUser[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = ITEMS_PER_PAGE;

  const totalPages = Math.ceil(members.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMembers = members.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full max-w-6xl bg-card shadow-sm rounded-xl sm:rounded-2xl p-3 sm:p-8 border border-border">
      <div className="w-full md:overflow-x-auto md:pb-4 scrollbar-thin">
        <div className="w-full md:min-w-187.5">
          {/* Desktop Table Header - Added DEPARTMENT and updated grid cols */}
          <div className="hidden md:grid grid-cols-[90px_2fr_1fr_1.5fr_1fr] gap-4 w-full px-4 sm:px-6 py-3 mb-2 text-[9px] sm:text-xs font-black text-muted-foreground italic tracking-widest border-b border-border">
            <div>ROLE</div>
            <div>ATHLETE</div>
            <div>LOGIN</div>
            <div>DEPARTMENT</div>
            <div>JOINED DATE</div>
          </div>

          {/* Members List */}
          <div className="flex flex-col gap-3 md:gap-2">
            {currentMembers.map((member) => (
              <MembersRow key={member.id} member={member} />
            ))}
          </div>

          {currentMembers.length === 0 && (
            <div className="text-center py-10 text-muted-foreground italic font-semibold">
              No members found.
            </div>
          )}
        </div>
      </div>

      {totalPages > 0 && (
        <div className="mt-4 sm:mt-8 flex flex-col md:flex-row justify-between items-center gap-4 px-2 sm:px-4 text-[10px] sm:text-xs font-bold text-muted-foreground italic">
          <p className="text-center md:text-left">
            Displaying {startIndex + 1}–{Math.min(startIndex + itemsPerPage, members.length)} of{" "}
            {members.length} members
          </p>

          <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
