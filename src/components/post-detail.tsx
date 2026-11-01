"use client"

import { useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Pin, PinOff, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { PostOwnerActions } from "@/components/post-owner-actions"
import {
  AdoptedBadge,
  AuthorAvatar,
  CategoryBadge,
  HelpfulButton,
  ReviewStatusBadge,
  TagLink,
} from "@/components/post-parts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  formatDate,
  getCommentAuthorName,
  getPinnedComment,
  getPostAuthorName,
} from "@/lib/format"
import { useAppStore } from "@/lib/store"
import type { Comment, Post } from "@/lib/types"
import { cn } from "@/lib/utils"

function CommentItem({ post, comment }: { post: Post; comment: Comment }) {
  const { togglePin } = useAppStore()
  const isPinned = post.pinnedCommentId === comment.id
  // 스스로 채택 완료를 주지 못하도록 다른 사람의 댓글만 채택할 수 있다.
  const canPin = post.isMine && !comment.isPostAuthor
  const authorName = getCommentAuthorName(comment)

  const handlePin = async () => {
    const saved = await togglePin(post.id, comment.id)
    if (saved) {
      toast.success(isPinned ? "채택을 취소했어요." : "피드백을 채택했어요.")
    }
  }

  return (
    <li
      className={cn(
        "space-y-2 rounded-md border bg-card p-4",
        isPinned && "border-transparent bg-signature-cream"
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <AuthorAvatar
          name={authorName}
          anonymous={comment.authorName === null}
        />
        <span className="font-medium">{authorName}</span>
        {comment.isPostAuthor && <Badge variant="outline">글쓴이</Badge>}
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
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {comment.body}
      </p>
      {canPin && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant={isPinned ? "ghost" : "outline"}
            size="sm"
            onClick={handlePin}
          >
            {isPinned ? (
              <PinOff aria-hidden="true" />
            ) : (
              <Pin aria-hidden="true" />
            )}
            {isPinned ? "채택 취소" : "채택하기"}
          </Button>
        </div>
      )}
    </li>
  )
}

function CommentSection({ post }: { post: Post }) {
  const { user, addComment, setAuthOpen } = useAppStore()
  const [body, setBody] = useState("")
  const [pending, setPending] = useState(false)
  // 방문한 상세 페이지는 숨겨진 채 DOM에 남으므로 고정 id를 쓰면 서로 겹친다.
  const bodyId = useId()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setPending(true)
    const saved = await addComment(post.id, trimmed)
    setPending(false)
    if (saved) setBody("")
  }

  const comments = [...post.comments].sort(
    (a, b) =>
      Number(b.id === post.pinnedCommentId) -
      Number(a.id === post.pinnedCommentId)
  )

  return (
    <section aria-labelledby="comments-heading" className="space-y-4">
      <h2 id="comments-heading" className="text-2xl">
        피드백 {post.comments.length}
      </h2>

      {comments.length > 0 ? (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <CommentItem key={comment.id} post={post} comment={comment} />
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          아직 피드백이 없어요. 첫 의견을 남겨 주세요.
        </p>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Label htmlFor={bodyId}>피드백 남기기</Label>
          <Textarea
            id={bodyId}
            rows={3}
            value={body}
            placeholder="비슷한 경험이나 도움이 될 만한 의견을 나눠 주세요."
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={!body.trim() || pending}>
              등록
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setAuthOpen(true)}
          >
            로그인하고 피드백 남기기
          </Button>
        </div>
      )}
    </section>
  )
}

function RetroBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <p className="leading-relaxed whitespace-pre-wrap">{body}</p>
    </div>
  )
}

export function PostDetail() {
  const { posts, loading, toggleReviewed } = useAppStore()
  const { id } = useParams<{ id: string }>()
  const post = posts.find((item) => item.id === id)

  if (loading) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        불러오는 중이에요.
      </p>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">회고를 찾을 수 없어요.</p>
        <Button asChild variant="outline">
          <Link href="/">피드로 돌아가기</Link>
        </Button>
      </div>
    )
  }

  const authorName = getPostAuthorName(post)
  const isMine = post.isMine

  const handleToggleReviewed = async () => {
    const saved = await toggleReviewed(post.id)
    if (saved) {
      toast.success(
        post.isReviewed ? "복기 중으로 되돌렸어요." : "복기 완료로 표시했어요."
      )
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/">
          <ArrowLeft aria-hidden="true" />
          피드
        </Link>
      </Button>

      <article className="space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={post.category} />
            {getPinnedComment(post) && <AdoptedBadge />}
            {isMine && <ReviewStatusBadge reviewed={post.isReviewed} />}
          </div>
          <h1 className="text-[32px] leading-tight text-pretty">
            {post.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AuthorAvatar name={authorName} anonymous={post.isAnonymous} />
            <span>{authorName}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
            {isMine && <PostOwnerActions post={post} />}
          </div>
        </header>

        <div className="space-y-5 rounded-md border bg-card p-6">
          <RetroBlock title="상황" body={post.situation} />
          <Separator />
          <RetroBlock
            title="나의 행동 및 실수했다고 느끼는 부분"
            body={post.mistake}
          />
        </div>

        <div className="rounded-md bg-signature-cream p-6">
          <RetroBlock title="다시 돌아간다면?" body={post.selfAction} />
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {post.tags.map((tag) => (
              <TagLink key={tag} tag={tag} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <HelpfulButton post={post} />
          {isMine && (
            <Button
              type="button"
              variant={post.isReviewed ? "outline" : "default"}
              onClick={handleToggleReviewed}
            >
              {post.isReviewed ? (
                <RotateCcw aria-hidden="true" />
              ) : (
                <CheckCircle2 aria-hidden="true" />
              )}
              {post.isReviewed ? "복기 완료 취소" : "복기 완료"}
            </Button>
          )}
        </div>
      </article>

      <Separator />
      <CommentSection post={post} />
    </div>
  )
}
