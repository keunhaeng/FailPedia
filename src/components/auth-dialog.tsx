"use client"

import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/lib/store"
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase"

const MIN_PASSWORD_LENGTH = 6

type Mode = "signIn" | "signUp"

function getErrorMessage(mode: Mode, code: string | undefined) {
  if (code === "invalid_credentials") {
    return "이메일 또는 비밀번호가 올바르지 않아요."
  }
  if (code === "email_not_confirmed") {
    return "이메일 인증을 먼저 완료해 주세요."
  }
  if (code === "user_already_exists") {
    return "이미 가입된 이메일이에요."
  }
  if (code === "weak_password") {
    return "비밀번호를 더 안전하게 만들어 주세요."
  }
  if (code === "over_email_send_rate_limit") {
    return "메일 발송 한도를 넘었어요. 잠시 후 다시 시도해 주세요."
  }
  return mode === "signIn"
    ? "로그인하지 못했어요. 잠시 후 다시 시도해 주세요."
    : "가입하지 못했어요. 잠시 후 다시 시도해 주세요."
}

export function AuthDialog() {
  const { authOpen, setAuthOpen } = useAppStore()
  const [mode, setMode] = useState<Mode>("signIn")
  const [nickname, setNickname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  const isSignUp = mode === "signUp"

  const switchMode = () => {
    setMode(isSignUp ? "signIn" : "signUp")
    setError("")
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")

    if (!isSupabaseConfigured) {
      setError("Supabase 연결 설정이 아직 없어요.")
      return
    }
    if (isSignUp && !nickname.trim()) {
      setError("닉네임을 입력해 주세요.")
      return
    }
    if (isSignUp && password.length < MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`)
      return
    }

    setPending(true)
    const auth = getSupabase().auth
    const { data, error: authError } = isSignUp
      ? await auth.signUp({
          email,
          password,
          options: { data: { nickname: nickname.trim() } },
        })
      : await auth.signInWithPassword({ email, password })
    setPending(false)

    if (authError) {
      setError(getErrorMessage(mode, authError.code))
      return
    }

    setPassword("")
    if (!data.session) {
      setMode("signIn")
      setError("")
      toast.success("인증 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.")
      return
    }
    setAuthOpen(false)
    toast.success(isSignUp ? "가입을 환영해요." : "로그인했어요.")
  }

  return (
    <Dialog open={authOpen} onOpenChange={setAuthOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "회원가입" : "로그인"}</DialogTitle>
          <DialogDescription>
            기록을 남기고 피드백을 나누려면 로그인이 필요해요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="auth-nickname">닉네임</Label>
              <Input
                id="auth-nickname"
                value={nickname}
                maxLength={30}
                autoComplete="nickname"
                onChange={(event) => setNickname(event.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="auth-email">이메일</Label>
            <Input
              id="auth-email"
              type="email"
              required
              value={email}
              autoComplete="email"
              aria-describedby={isSignUp ? "auth-email-hint" : undefined}
              onChange={(event) => setEmail(event.target.value)}
            />
            {isSignUp && (
              <p id="auth-email-hint" className="text-xs text-muted-foreground">
                실제 이메일 인증을 거치지 않기 때문에 가상의 이메일을
                가입해주셔도 괜찮습니다.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">비밀번호</Label>
            <Input
              id="auth-password"
              type="password"
              required
              value={password}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {isSignUp ? "가입하기" : "로그인"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={switchMode}
          >
            {isSignUp ? "이미 계정이 있어요" : "처음이신가요? 회원가입"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
