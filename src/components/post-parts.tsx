"use client"

import Link from "next/link"
import {
  CheckCircle2,
  CircleDashed,
  Hash,
  Lightbulb,
  Pin,
  UserRound,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CATEGORY_STYLES } from "@/lib/format"
import { useAppStore } from "@/lib/store"
import type { Category, Post } from "@/lib/types"
import { cn } from "@/lib/utils"

export function CategoryBadge({ category }: { category: Category }) {
  return <Badge className={CATEGORY_STYLES[category]}>{category}</Badge>
}

export function AdoptedBadge() {
  return (
    <Badge className="bg-signature-forest text-white">
      <Pin aria-hidden="true" />
      채택 완료
    </Badge>
  )
}

export function ReviewStatusBadge({ reviewed }: { reviewed: boolean }) {
  if (reviewed) {
    return (
      <Badge>
        <CheckCircle2 aria-hidden="true" />
        복기 완료
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <CircleDashed aria-hidden="true" />
      복기 중
    </Badge>
  )
}

export function TagLink({ tag }: { tag: string }) {
  return (
    <Link
      href={`/?q=${encodeURIComponent(`#${tag}`)}`}
      className="relative z-10 inline-flex items-center rounded-md text-xs text-link transition-colors hover:text-link-active focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Hash className="size-3" aria-hidden="true" />
      {tag}
    </Link>
  )
}

export function AuthorAvatar({
  name,
  anonymous = false,
}: {
  name: string
  anonymous?: boolean
}) {
  return (
    <Avatar className="size-7">
      <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
        {anonymous ? (
          <UserRound className="size-4" aria-hidden="true" />
        ) : (
          name.charAt(0)
        )}
      </AvatarFallback>
    </Avatar>
  )
}

export function HelpfulButton({ post }: { post: Post }) {
  const { toggleHelpful } = useAppStore()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-pressed={post.helpedByMe}
      onClick={() => toggleHelpful(post.id)}
      className={cn(
        "relative z-10",
        post.helpedByMe &&
          "border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
      )}
    >
      <Lightbulb aria-hidden="true" />
      도움이 돼요
      <span
        key={post.helpfulCount}
        className="animate-in tabular-nums duration-200 zoom-in-125"
      >
        {post.helpfulCount}
      </span>
    </Button>
  )
}
