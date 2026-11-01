"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { EditPostDialog } from "@/components/post-form-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAppStore } from "@/lib/store"
import type { Post } from "@/lib/types"

export function PostOwnerActions({ post }: { post: Post }) {
  const { deletePost } = useAppStore()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  const handleDelete = async () => {
    setPending(true)
    const deleted = await deletePost(post.id)
    setPending(false)
    if (!deleted) return

    setConfirming(false)
    toast.success("회고를 삭제했어요.")
    router.replace("/")
  }

  return (
    <div className="ml-auto flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
      >
        <Pencil aria-hidden="true" />
        수정
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        <Trash2 aria-hidden="true" />
        삭제
      </Button>

      {editing && (
        <EditPostDialog post={post} onClose={() => setEditing(false)} />
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>이 회고를 삭제할까요?</DialogTitle>
            <DialogDescription>
              달린 피드백과 반응도 함께 사라지고, 되돌릴 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
