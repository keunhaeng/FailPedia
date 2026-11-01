"use client"

import { useState } from "react"
import Link from "next/link"
import { EyeOff, Pin } from "lucide-react"

import {
  CategoryBadge,
  ReviewStatusBadge,
  TagLink,
} from "@/components/post-parts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/format"
import { useAppStore } from "@/lib/store"
import type { Comment, Post } from "@/lib/types"

type Feedback = { post: Post; comment: Comment; isPinned: boolean }

const REVIEW_FILTERS = [
  { value: "all", label: "전체", matches: () => true },
  {
    value: "reviewing",
    label: "복기 중",
    matches: (post: Post) => !post.isReviewed,
  },
  {
    value: "reviewed",
    label: "복기 완료",
    matches: (post: Post) => post.isReviewed,
  },
] as const
type ReviewFilter = (typeof REVIEW_FILTERS)[number]["value"]

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

function ReviewNote({ post }: { post: Post }) {
  return (
    <li className="relative space-y-3 rounded-md border bg-card p-6">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={post.category} />
        <ReviewStatusBadge reviewed={post.isReviewed} />
        {post.isAnonymous && (
          <Badge variant="outline">
            <EyeOff aria-hidden="true" />
            익명
          </Badge>
        )}
        <time
          dateTime={post.createdAt}
          className="ml-auto text-xs text-muted-foreground"
        >
          {formatDate(post.createdAt)}
        </time>
      </div>
      <h3 className="text-lg font-medium text-pretty">
        <Link
          href={`/posts/${post.id}`}
          className="after:absolute after:inset-0 after:rounded-md focus-visible:underline focus-visible:outline-none"
        >
          {post.title}
        </Link>
      </h3>
      <div className="space-y-1 border-l-2 border-border pl-3">
        <p className="text-xs font-medium text-muted-foreground">
          다시 돌아간다면?
        </p>
        <p className="text-sm leading-relaxed">{post.selfAction}</p>
      </div>
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {post.tags.map((tag) => (
            <TagLink key={tag} tag={tag} />
          ))}
        </div>
      )}
    </li>
  )
}

function FeedbackList({ items, empty }: { items: Feedback[]; empty: string }) {
  if (items.length === 0) {
    return <EmptyMessage>{empty}</EmptyMessage>
  }

  return (
    <ul className="space-y-3">
      {items.map(({ post, comment, isPinned }) => (
        <li
          key={comment.id}
          className="relative space-y-2 rounded-md border bg-card p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={post.category} />
            {isPinned && (
              <Badge className="bg-signature-forest text-white">
                <Pin aria-hidden="true" />
                채택됨
              </Badge>
            )}
            <time
              dateTime={comment.createdAt}
              className="ml-auto text-xs text-muted-foreground"
            >
              {formatDate(comment.createdAt)}
            </time>
          </div>
          <p className="text-sm leading-relaxed">{comment.body}</p>
          <Link
            href={`/posts/${post.id}`}
            className="block truncate text-xs text-muted-foreground after:absolute after:inset-0 after:rounded-md hover:text-foreground focus-visible:underline focus-visible:outline-none"
          >
            원글: {post.title}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function MyPage() {
  const { posts, user, loading, openComposer, setAuthOpen } = useAppStore()
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all")

  const myPosts = posts.filter((post) => post.isMine)
  const activeFilter = REVIEW_FILTERS.find(
    (filter) => filter.value === reviewFilter
  )
  const visiblePosts = myPosts.filter((post) => activeFilter?.matches(post))
  const myFeedback = posts.flatMap((post) =>
    post.comments
      .filter((comment) => comment.isMine)
      .map((comment) => ({
        post,
        comment,
        isPinned: post.pinnedCommentId === comment.id,
      }))
  )
  const pinnedFeedback = myFeedback.filter((item) => item.isPinned)

  const stats = [
    { label: "내 회고", value: myPosts.length },
    {
      label: "복기 완료",
      value: myPosts.filter((post) => post.isReviewed).length,
    },
    { label: "내가 쓴 피드백", value: myFeedback.length },
    { label: "채택된 피드백", value: pinnedFeedback.length },
  ]

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        불러오는 중이에요.
      </p>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyMessage>
          로그인하면 내 회고와 피드백을 모아 볼 수 있어요.
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAuthOpen(true)}
          >
            로그인
          </Button>
        </EmptyMessage>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-[32px] leading-tight">
          {user.nickname}님의 오답노트
        </h1>
        <p className="text-sm text-muted-foreground">
          기록한 실수와 나눈 피드백을 한곳에서 돌아보세요.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-6 rounded-lg bg-surface-dark p-8 text-white sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-white/70">{label}</dt>
            <dd className="text-[32px] leading-tight tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <Tabs defaultValue="notes" className="gap-4">
        <TabsList variant="line" className="h-11">
          <TabsTrigger value="notes">오답노트</TabsTrigger>
          <TabsTrigger value="feedback">내 피드백</TabsTrigger>
          <TabsTrigger value="pinned">채택된 피드백</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          {myPosts.length > 0 ? (
            <>
              <div
                role="group"
                aria-label="복기 상태 필터"
                className="flex flex-wrap gap-2"
              >
                {REVIEW_FILTERS.map(({ value, label, matches }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={reviewFilter === value ? "default" : "outline"}
                    size="sm"
                    aria-pressed={reviewFilter === value}
                    onClick={() => setReviewFilter(value)}
                  >
                    {label}
                    <span className="tabular-nums">
                      {myPosts.filter(matches).length}
                    </span>
                  </Button>
                ))}
              </div>
              {visiblePosts.length > 0 ? (
                <ul className="space-y-3">
                  {visiblePosts.map((post) => (
                    <ReviewNote key={post.id} post={post} />
                  ))}
                </ul>
              ) : (
                <EmptyMessage>
                  {activeFilter?.label} 상태인 글이 없어요.
                </EmptyMessage>
              )}
            </>
          ) : (
            <EmptyMessage>
              아직 기록한 실수가 없어요.
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openComposer}
              >
                첫 회고 남기기
              </Button>
            </EmptyMessage>
          )}
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackList
            items={myFeedback}
            empty="아직 작성한 피드백이 없어요."
          />
        </TabsContent>
        <TabsContent value="pinned">
          <FeedbackList
            items={pinnedFeedback}
            empty="아직 채택된 피드백이 없어요."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
