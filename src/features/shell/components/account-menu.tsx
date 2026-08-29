"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/features/shell/components/logout-button";

type AccountMenuProps = {
  teacherName: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

export function AccountMenu({ teacherName }: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={false}
        aria-label={`Account menu: ${teacherName}`}
        render={
          <Avatar className="relative size-10 cursor-pointer border border-outline-variant bg-brand-violet-tint text-label-md font-bold text-brand-violet transition-opacity hover:opacity-80">
            <AvatarFallback>
              {initials(teacherName)}
            </AvatarFallback>
            <span
              aria-hidden="true"
              className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-error"
            />
          </Avatar>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <div className="flex items-center gap-3 border-b border-outline-variant px-md py-3">
          <Avatar className="size-9 shrink-0 bg-brand-violet-tint text-body-md font-bold text-brand-violet">
            <AvatarFallback>
              {initials(teacherName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-md text-body-md--line-height font-semibold text-foreground">
              {teacherName}
            </p>
          </div>
        </div>
        <LogoutButton variant="menu" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
