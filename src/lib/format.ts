import type { Category, Comment, Post } from "@/lib/types"

export const ANONYMOUS_NAME = "익명의 회고러"

export const CATEGORY_STYLES: Record<Category, string> = {
  학업: "bg-signature-mint text-foreground",
  취업: "bg-signature-peach text-foreground",
  연애: "bg-signature-yellow text-foreground",
  관계: "bg-signature-cream text-foreground",
  기타: "bg-surface-strong text-foreground",
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
})

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

export function getPostAuthorName(post: Post) {
  return post.authorName ?? ANONYMOUS_NAME
}

export function getCommentAuthorName(comment: Comment) {
  return comment.authorName ?? ANONYMOUS_NAME
}

export function getPinnedComment(post: Post) {
  return post.comments.find((comment) => comment.id === post.pinnedCommentId)
}
