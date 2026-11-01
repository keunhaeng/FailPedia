"use client"

import { Suspense } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogIn, LogOut, PenLine, Sprout } from "lucide-react"

import { SiteSearch } from "@/components/site-search"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "피드" },
  { href: "/me", label: "마이페이지" },
]

function NavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="주요 메뉴" className="flex gap-1">
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "rounded-md px-2 py-1 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
            pathname === href && "font-medium text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />
}

export function SiteHeader() {
  const { user, openComposer, setAuthOpen, signOut } = useAppStore()

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 sm:gap-4">
        <Link href="/" className="flex items-center gap-1.5 text-base font-medium">
          <Sprout className="size-5 text-signature-coral" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">FailPedia</span>
        </Link>
        <Suspense fallback={<NavLinks />}>
          <ActiveNavLinks />
        </Suspense>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SiteSearch />
          <Button type="button" onClick={openComposer}>
            <PenLine aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">실수 기록하기</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={user ? "로그아웃" : "로그인"}
            title={user ? `${user.nickname}님 로그아웃` : "로그인"}
            className="rounded-full"
            onClick={user ? signOut : () => setAuthOpen(true)}
          >
            {user ? <LogOut aria-hidden="true" /> : <LogIn aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
