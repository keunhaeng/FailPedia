"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { SearchX, X } from "lucide-react"

import { PostCard } from "@/components/post-card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppStore } from "@/lib/store"
import { isSupabaseConfigured } from "@/lib/supabase"
import {
  CATEGORIES,
  SORT_OPTIONS,
  type Post,
  type SortKey,
} from "@/lib/types"

const ALL = "전체"

const byLatest = (a: Post, b: Post) => b.createdAt.localeCompare(a.createdAt)

const SORTERS: Record<SortKey, (a: Post, b: Post) => number> = {
  latest: byLatest,
  helpful: (a, b) => b.helpfulCount - a.helpfulCount || byLatest(a, b),
  feedback: (a, b) => b.comments.length - a.comments.length || byLatest(a, b),
}

// '#'으로 시작하면 태그를, 그 외에는 본문 네 항목을 검색한다.
function matchesSearch(post: Post, query: string) {
  const normalized = query.toLowerCase()
  if (normalized.startsWith("#")) {
    const tag = normalized.slice(1)
    return post.tags.some((item) => item.toLowerCase().includes(tag))
  }
  return [post.title, post.situation, post.mistake, post.selfAction].some(
    (text) => text.toLowerCase().includes(normalized)
  )
}

export function Feed() {
  const { posts, loading, loadFailed } = useAppStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const categoryParam = searchParams.get("category")
  const category = CATEGORIES.find((item) => item === categoryParam) ?? ALL
  const sortParam = searchParams.get("sort")
  const sort =
    SORT_OPTIONS.find((option) => option.value === sortParam)?.value ?? "latest"
  const query = searchParams.get("q") ?? ""

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    const search = next.toString()
    router.replace(search ? `/?${search}` : "/", { scroll: false })
  }

  const visiblePosts = posts
    .filter((post) => category === ALL || post.category === category)
    .filter((post) => !query || matchesSearch(post, query))
    .sort(SORTERS[sort])

  return (
    <section
      aria-labelledby="feed-heading"
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="space-y-3 pt-6 pb-4 text-center sm:pt-12">
        <h1 id="feed-heading" className="text-3xl leading-tight sm:text-[40px]">
          오늘의 실수가 내일의 배움이 되도록
        </h1>
        <p className="text-muted-foreground">
          다른 사람의 기록을 읽으며 같은 실수를 미리 피해 보세요.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={category}
          onValueChange={(value) =>
            setParam("category", value === ALL ? null : value)
          }
          className="-my-1.5 max-w-full overflow-x-auto overflow-y-hidden py-1.5 [scrollbar-width:none]"
        >
          <TabsList variant="line" className="h-11">
            {[ALL, ...CATEGORIES].map((item) => (
              <TabsTrigger key={item} value={item} className="px-3">
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select
          value={sort}
          onValueChange={(value) =>
            setParam("sort", value === "latest" ? null : value)
          }
        >
          <SelectTrigger aria-label="정렬 기준" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query && (
        <div className="flex items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            &lsquo;{query}&rsquo; 검색 결과 {visiblePosts.length}건
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setParam("q", null)}
          >
            <X aria-hidden="true" />
            검색 해제
          </Button>
        </div>
      )}

      {!isSupabaseConfigured || loadFailed ? (
        <p
          role="alert"
          className="rounded-md border border-dashed px-6 py-16 text-center text-sm text-muted-foreground"
        >
          {isSupabaseConfigured
            ? "기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
            : "Supabase 연결 설정이 아직 없어요. .env.local을 확인해 주세요."}
        </p>
      ) : loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          불러오는 중이에요.
        </p>
      ) : visiblePosts.length > 0 ? (
        <div className="space-y-4">
          {visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed px-6 py-16 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            조건에 맞는 회고가 아직 없어요.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/">필터 초기화</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
