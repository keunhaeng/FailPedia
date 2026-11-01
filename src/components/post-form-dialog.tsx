"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/store"
import {
  CATEGORIES,
  type Category,
  type NewPostInput,
  type Post,
} from "@/lib/types"

const MAX_TAGS = 5

type Draft = {
  category: Category | ""
  title: string
  situation: string
  mistake: string
  selfAction: string
  tags: string[]
  tagInput: string
  isAnonymous: boolean
}

const EMPTY_DRAFT: Draft = {
  category: "",
  title: "",
  situation: "",
  mistake: "",
  selfAction: "",
  tags: [],
  tagInput: "",
  isAnonymous: false,
}

function mergeTag(tags: string[], raw: string) {
  const tag = raw.replace(/[#,\s]/g, "")
  if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) {
    return tags
  }
  return [...tags, tag]
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  )
}

type PostFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  heading: string
  description: string
  submitLabel: string
  initialDraft: Draft
  onSave: (input: NewPostInput) => Promise<boolean>
  onSaved: () => void
}

function PostFormDialog({
  open,
  onOpenChange,
  heading,
  description,
  submitLabel,
  initialDraft,
  onSave,
  onSaved,
}: PostFormDialogProps) {
  // Dialog 내용은 닫히면 언마운트되므로, 초안을 잃지 않도록 여기서 상태를 관리한다.
  const [draft, setDraft] = useState(initialDraft)
  const [showErrors, setShowErrors] = useState(false)
  const [pending, setPending] = useState(false)

  const update = (patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  const title = draft.title.trim()
  const situation = draft.situation.trim()
  const mistake = draft.mistake.trim()
  const selfAction = draft.selfAction.trim()

  const commitTagInput = () => {
    update({ tags: mergeTag(draft.tags, draft.tagInput), tagInput: "" })
  }

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter는 글자를 확정하는 입력이므로 태그로 처리하지 않는다.
    if (event.nativeEvent.isComposing) return

    if (event.key === "Enter" || event.key === "," || event.key === " ") {
      event.preventDefault()
      commitTagInput()
    } else if (event.key === "Backspace" && !draft.tagInput) {
      update({ tags: draft.tags.slice(0, -1) })
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.category || !title || !situation || !mistake || !selfAction) {
      setShowErrors(true)
      return
    }

    setPending(true)
    const saved = await onSave({
      category: draft.category,
      title,
      situation,
      mistake,
      selfAction,
      tags: mergeTag(draft.tags, draft.tagInput),
      isAnonymous: draft.isAnonymous,
    })
    setPending(false)
    if (!saved) return

    setDraft(initialDraft)
    setShowErrors(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="post-category">카테고리</Label>
            <Select
              value={draft.category}
              onValueChange={(value) =>
                update({ category: value as Category })
              }
            >
              <SelectTrigger
                id="post-category"
                className="w-full"
                aria-invalid={showErrors && !draft.category}
              >
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showErrors && !draft.category && (
              <FieldError
                id="post-category-error"
                message="카테고리를 선택해 주세요."
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-title">제목</Label>
            <Input
              id="post-title"
              value={draft.title}
              maxLength={80}
              placeholder="배운 점을 한 문장으로 요약해주세요."
              aria-invalid={showErrors && !title}
              aria-describedby="post-title-error"
              onChange={(event) => update({ title: event.target.value })}
            />
            {showErrors && !title && (
              <FieldError
                id="post-title-error"
                message="제목을 입력해 주세요."
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-situation">상황</Label>
            <Textarea
              id="post-situation"
              rows={4}
              value={draft.situation}
              placeholder="어떤 상황이었나요? 자유롭게 적어주세요."
              aria-invalid={showErrors && !situation}
              aria-describedby="post-situation-error"
              onChange={(event) => update({ situation: event.target.value })}
            />
            {showErrors && !situation && (
              <FieldError
                id="post-situation-error"
                message="상황을 입력해 주세요."
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-mistake">
              나의 행동 및 실수했다고 느끼는 부분
            </Label>
            <Textarea
              id="post-mistake"
              rows={4}
              value={draft.mistake}
              placeholder="그때 어떻게 행동했고, 어떤 부분이 실수라고 느끼나요?"
              aria-invalid={showErrors && !mistake}
              aria-describedby="post-mistake-error"
              onChange={(event) => update({ mistake: event.target.value })}
            />
            {showErrors && !mistake && (
              <FieldError
                id="post-mistake-error"
                message="나의 행동과 실수한 부분을 입력해 주세요."
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-self-action">다시 돌아간다면?</Label>
            <Textarea
              id="post-self-action"
              rows={4}
              value={draft.selfAction}
              placeholder="같은 상황으로 돌아간다면 어떻게 하고 싶나요?"
              aria-invalid={showErrors && !selfAction}
              aria-describedby="post-self-action-error"
              onChange={(event) => update({ selfAction: event.target.value })}
            />
            {showErrors && !selfAction && (
              <FieldError
                id="post-self-action-error"
                message="다시 돌아간다면 어떻게 할지 입력해 주세요."
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-tags">태그</Label>
            {draft.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {draft.tags.map((tag) => (
                  <li key={tag}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        update({ tags: draft.tags.filter((t) => t !== tag) })
                      }
                    >
                      #{tag}
                      <X aria-hidden="true" />
                      <span className="sr-only">태그 삭제</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Input
              id="post-tags"
              value={draft.tagInput}
              placeholder="예: 시간관리, 말실수 (Enter로 추가)"
              disabled={draft.tags.length >= MAX_TAGS}
              aria-describedby="post-tags-hint"
              onChange={(event) => update({ tagInput: event.target.value })}
              onKeyDown={handleTagKeyDown}
              onBlur={commitTagInput}
            />
            <p id="post-tags-hint" className="text-xs text-muted-foreground">
              최대 {MAX_TAGS}개까지 추가할 수 있어요.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="post-anonymous">익명으로 작성</Label>
              <p
                id="post-anonymous-hint"
                className="text-xs text-muted-foreground"
              >
                피드에 이름 대신 &lsquo;익명의 회고러&rsquo;로 표시돼요.
              </p>
            </div>
            <Switch
              id="post-anonymous"
              checked={draft.isAnonymous}
              aria-describedby="post-anonymous-hint"
              onCheckedChange={(checked) => update({ isAnonymous: checked })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              닫기
            </Button>
            <Button type="submit" disabled={pending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CreatePostDialog() {
  const { composerOpen, setComposerOpen, addPost } = useAppStore()
  const router = useRouter()

  return (
    <PostFormDialog
      open={composerOpen}
      onOpenChange={setComposerOpen}
      heading="실수 기록하기"
      description="어떤 일이 있었고, 다시 돌아간다면 어떻게 할지 차례로 적어 보세요."
      submitLabel="기록 올리기"
      initialDraft={EMPTY_DRAFT}
      onSave={addPost}
      onSaved={() => {
        setComposerOpen(false)
        toast.success("회고가 피드에 올라갔어요.")
        router.push("/")
      }}
    />
  )
}

export function EditPostDialog({
  post,
  onClose,
}: {
  post: Post
  onClose: () => void
}) {
  const { editPost } = useAppStore()

  return (
    <PostFormDialog
      open
      onOpenChange={onClose}
      heading="회고 수정하기"
      description="내용을 고친 뒤 저장해 주세요. 피드백과 반응은 그대로 유지돼요."
      submitLabel="저장하기"
      initialDraft={{ ...post, tagInput: "" }}
      onSave={(input) => editPost(post.id, input)}
      onSaved={() => {
        onClose()
        toast.success("회고를 수정했어요.")
      }}
    />
  )
}
