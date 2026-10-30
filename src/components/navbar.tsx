// =============================================================================
// Navbar — top navigation bar
// =============================================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Code2, LogOut, User, Users, Map, BookOpen, Settings } from "lucide-react";
import { NavbarStreakBadge } from "@/components/navbar-streak-badge";
import { TimezoneSync } from "@/components/timezone-sync";
import { TimezoneSettingsDialog } from "@/components/timezone-settings-dialog";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session, status } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/problems", label: "Problems" },
    { href: "/roadmap", label: "Roadmap" },
    { href: "/catalog", label: "Catalog" },
    { href: "/groups", label: "Groups" },
  ];

  return (
    <>
      <TimezoneSync />
      <TimezoneSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-card/92 backdrop-blur-md shadow-soft-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow-orange transition-transform group-hover:scale-105">
              <Code2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-foreground leading-tight">
                Level Up
              </span>
              <span className="font-mono text-[9px] font-bold tracking-widest text-text-muted uppercase leading-none">
                DSA Mastery
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-2 md:flex">
            {session && (
              <>
                {navLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all",
                        isActive
                          ? "bg-secondary text-foreground shadow-2xs"
                          : "text-muted-foreground hover:bg-tint hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {session?.user && <NavbarStreakBadge />}

            {status === "loading" ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-tint" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8.5 w-8.5 rounded-full cursor-pointer focus:outline-none flex items-center justify-center ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                  <Avatar className="h-8.5 w-8.5">
                    <AvatarImage
                      src={session.user.image ?? undefined}
                      alt={session.user.name ?? "User"}
                    />
                    <AvatarFallback className="font-bold text-xs bg-accent-dark text-white">
                      {session.user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-[18px] p-1.5 shadow-soft border-border/60" align="end">
                  <div className="flex items-center justify-start gap-2 p-2.5 bg-tint/60 rounded-[12px] mb-1">
                    <div className="flex flex-col space-y-0.5 leading-none">
                      {session.user.name && (
                        <p className="font-bold text-sm text-foreground">{session.user.name}</p>
                      )}
                      {session.user.email && (
                        <p className="w-[180px] truncate text-xs text-muted-foreground font-mono">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="my-1 bg-border/40" />
                  <Link href="/problems">
                    <DropdownMenuItem className="cursor-pointer rounded-[10px] text-xs font-semibold py-2">
                      <User className="mr-2 h-4 w-4 text-primary" />
                      My Problems
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/roadmap">
                    <DropdownMenuItem className="cursor-pointer rounded-[10px] text-xs font-semibold py-2">
                      <Map className="mr-2 h-4 w-4 text-primary" />
                      Learning Roadmap
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/catalog">
                    <DropdownMenuItem className="cursor-pointer rounded-[10px] text-xs font-semibold py-2">
                      <BookOpen className="mr-2 h-4 w-4 text-primary" />
                      Problem Catalog
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/groups">
                    <DropdownMenuItem className="cursor-pointer rounded-[10px] text-xs font-semibold py-2">
                      <Users className="mr-2 h-4 w-4 text-primary" />
                      Study Groups
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator className="my-1 bg-border/40" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-[10px] text-xs font-semibold py-2"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    Timezone & Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-border/40" />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive rounded-[10px] text-xs font-semibold py-2"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => signIn()} size="sm" className="font-semibold">
                Sign in
              </Button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
