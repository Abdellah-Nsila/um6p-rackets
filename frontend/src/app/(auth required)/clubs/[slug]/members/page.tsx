"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import MembersHeader from "@/components/members/members-header";
import MembersTable from "@/components/members/members-table";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClubMembers } from "@/hooks/use-club-members";
import { MemberRole } from "@/types/contracts/club";

const ROLE_OPTIONS = [
  { role: MemberRole.MEMBER, label: "Members" },
  { role: MemberRole.LEADER, label: "Leaders" },
  { role: MemberRole.COACH, label: "Coaches" },
];

export default function ClubMembersPage() {
  const { slug } = useParams<{ slug: string }>();
  // The Select works with strings, so we keep the role as a string and convert it
  const [roleValue, setRoleValue] = useState(MemberRole.MEMBER);
  const [search, setSearch] = useState("");

  const { data, isPending, isError, error, refetch } = useClubMembers(slug, roleValue);

  // Local search on the loaded page of members (the backend login filter is an exact match)
  const filteredMembers = useMemo(() => {
    const members = data?.data ?? [];
    const term = search.toLowerCase().trim();
    if (!term) return members;

    return members.filter((m) => {
      // Seeded users can have no first or last name
      const fullName = `${m.user.first_name ?? ""} ${m.user.last_name ?? ""}`;
      return m.user.login.toLowerCase().includes(term) || fullName.toLowerCase().includes(term);
    });
  }, [data, search]);

  return (
    <main className="min-h-screen px-4 py-8 sm:p-8 md:p-15 flex flex-col items-center">
      <MembersHeader clubName={slug} />

      <div className="w-full max-w-6xl mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <InputGroup className="w-full sm:max-w-sm bg-card shadow-sm border-border">
          <InputGroupInput
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent"
          />
          <InputGroupAddon>
            <Search className="w-4 h-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupAddon
            align="inline-end"
            className="text-xs font-semibold text-muted-foreground"
          >
            {filteredMembers.length} results
          </InputGroupAddon>
        </InputGroup>

        <Select
          value={ROLE_OPTIONS.find((o) => o.role === roleValue)?.label ?? "Select role"}
          onValueChange={(value) =>
            value &&
            setRoleValue(ROLE_OPTIONS.find((o) => o.label === value)?.role ?? MemberRole.MEMBER)
          }
        >
          <SelectTrigger className="w-full sm:w-45 bg-card shadow-sm border-border font-semibold">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem
                key={option.role}
                value={option.label}
                className="font-semibold cursor-pointer"
                // on select show label not role value
                // and for that we need to use the SelectValue component in the trigger
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending && (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-brand-orange" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-24">
          <p className="text-muted-foreground">{error.message}</p>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && (
        <>
          <MembersTable key={`${roleValue}-${search}`} members={filteredMembers} />
          {data.total > data.data.length && (
            <p className="mt-4 text-sm text-muted-foreground">
              Showing the first {data.data.length} of {data.total} members.
            </p>
          )}
        </>
      )}
    </main>
  );
}
