"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// 피드에서 검색하면 카테고리와 정렬을 유지하고, 다른 페이지에서는 피드로 이동한다.
function getFeedParams() {
  return new URLSearchParams(
    window.location.pathname === "/" ? window.location.search : ""
  )
}

export function SiteSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setInput(getFeedParams().get("q") ?? "")
    }
    setOpen(next)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const params = getFeedParams()
    const query = input.trim()
    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }
    const search = params.toString()
    setOpen(false)
    router.push(search ? `/?${search}` : "/")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="검색"
          className="rounded-full"
        >
          <Search aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>회고 검색</DialogTitle>
          <DialogDescription>
            제목과 본문에서 키워드를 찾아요. 태그는 #을 붙여 검색하세요.
          </DialogDescription>
        </DialogHeader>
        <form role="search" onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="search"
            aria-label="회고 검색"
            value={input}
            placeholder="키워드 또는 #태그"
            onChange={(event) => setInput(event.target.value)}
          />
          <Button type="submit" className="h-11">
            찾기
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
