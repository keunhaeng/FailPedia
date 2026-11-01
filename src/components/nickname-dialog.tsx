"use client"

import { useState, type FormEvent } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/lib/store"

const MAX_NICKNAME_LENGTH = 30

export function NicknameDialog({ nickname }: { nickname: string }) {
  const { updateNickname } = useAppStore()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState(nickname)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setInput(nickname)
      setError("")
    }
    setOpen(next)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) {
      setError("닉네임을 입력해 주세요.")
      return
    }
    if (trimmed === nickname) {
      setOpen(false)
      return
    }

    setPending(true)
    const result = await updateNickname(trimmed)
    setPending(false)
    if (result === "taken") {
      setError("이미 사용 중인 닉네임이에요.")
      return
    }
    if (result === "failed") return

    setOpen(false)
    toast.success("닉네임을 변경했어요.")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Pencil aria-hidden="true" />
          닉네임 변경
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>닉네임 변경</DialogTitle>
          <DialogDescription>
            이전에 쓴 글과 피드백의 이름도 함께 바뀌어요. 익명 글에는 표시되지
            않아요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nickname-input">새 닉네임</Label>
            <Input
              id="nickname-input"
              value={input}
              maxLength={MAX_NICKNAME_LENGTH}
              autoComplete="nickname"
              aria-invalid={Boolean(error)}
              onChange={(event) => setInput(event.target.value)}
            />
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={pending}>
              저장하기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
