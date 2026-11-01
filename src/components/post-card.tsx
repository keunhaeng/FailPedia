"use client"

import Link from "next/link"
import { MessageCircle, Pin } from "lucide-react"

import {
  AdoptedBadge,
  AuthorAvatar,
  CategoryBadge,
  HelpfulButton,
} from "@/components/post-parts"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDate, getPinnedComment, getPostAuthorName } from "@/lib/format"
import type { Post } from "@/lib/types"

export function PostCard({ post }: { post: Post }) {
  const pinned = getPinnedComment(post)
  const authorName = getPostAuthorName(post)

  return (
    <Card className="relative transition-shadow [--card-spacing:--spacing(6)] hover:ring-border-strong">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={post.category} />
          {pinned && <AdoptedBadge />}
          <time
            dateTime={post.createdAt}
            className="ml-auto text-xs text-muted-foreground"
          >
            {formatDate(post.createdAt)}
          </time>
        </div>
        <CardTitle className="text-lg text-pretty">
          <Link
            href={`/posts/${post.id}`}
            className="after:absolute after:inset-0 after:rounded-md focus-visible:underline focus-visible:outline-none"
          >
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="line-clamp-2 leading-relaxed text-muted-foreground">
          {post.situation}
        </p>
        {pinned && (
          <p className="flex gap-2 rounded-md bg-signature-cream px-3 py-2 text-foreground">
            <Pin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{pinned.body}</span>
          </p>
        )}
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-2">
            <AuthorAvatar name={authorName} anonymous={post.isAnonymous} />
            {authorName}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-4" aria-hidden="true" />
            <span className="sr-only">피드백</span>
            {post.comments.length}
          </span>
        </div>
        <HelpfulButton post={post} />
      </CardFooter>
    </Card>
  )
}
