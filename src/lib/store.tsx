"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Session } from "@supabase/supabase-js"
import { toast } from "sonner"

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase"
import type { Comment, NewPostInput, Post, User } from "@/lib/types"

export type NicknameResult = "saved" | "taken" | "failed"

// Postgres의 고유 제약 위반 코드
const UNIQUE_VIOLATION = "23505"

type AppStore = {
  posts: Post[]
  user: User | null
  loading: boolean
  loadFailed: boolean
  composerOpen: boolean
  setComposerOpen: (open: boolean) => void
  authOpen: boolean
  setAuthOpen: (open: boolean) => void
  openComposer: () => void
  signOut: () => Promise<void>
  updateNickname: (nickname: string) => Promise<NicknameResult>
  addPost: (input: NewPostInput) => Promise<boolean>
  editPost: (postId: string, input: NewPostInput) => Promise<boolean>
  deletePost: (postId: string) => Promise<boolean>
  toggleHelpful: (postId: string) => Promise<void>
  toggleReviewed: (postId: string) => Promise<boolean>
  addComment: (postId: string, body: string) => Promise<boolean>
  togglePin: (postId: string, commentId: string) => Promise<boolean>
}

const AppContext = createContext<AppStore | null>(null)

type CommentRow = {
  id: string
  post_id: string
  body: string
  created_at: string
  author_name: string | null
  is_post_author: boolean
  is_mine: boolean
}

type PostRow = {
  id: string
  is_anonymous: boolean
  category: Post["category"]
  title: string
  situation: string
  mistake: string
  self_action: string
  tags: string[]
  pinned_comment_id: string | null
  created_at: string
  author_name: string | null
  is_mine: boolean
  is_reviewed: boolean
  helpful_count: number
  helped_by_me: boolean
}

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
    isMine: row.is_mine,
    isPostAuthor: row.is_post_author,
  }
}

function toPost(row: PostRow, comments: Comment[]): Post {
  return {
    id: row.id,
    authorName: row.author_name,
    isMine: row.is_mine,
    isAnonymous: row.is_anonymous,
    category: row.category,
    title: row.title,
    situation: row.situation,
    mistake: row.mistake,
    selfAction: row.self_action,
    tags: row.tags,
    createdAt: row.created_at,
    helpfulCount: row.helpful_count,
    helpedByMe: row.helped_by_me,
    isReviewed: row.is_reviewed,
    comments,
    pinnedCommentId: row.pinned_comment_id,
  }
}

function toPostColumns(input: NewPostInput) {
  return {
    category: input.category,
    title: input.title,
    situation: input.situation,
    mistake: input.mistake,
    self_action: input.selfAction,
    tags: input.tags,
    is_anonymous: input.isAnonymous,
  }
}

function toUser(session: Session | null): User | null {
  if (!session) return null
  const { id, email, user_metadata: metadata } = session.user
  return { id, nickname: metadata.nickname ?? email?.split("@")[0] ?? "회원" }
}

const SAVE_ERROR = "저장하지 못했어요. 잠시 후 다시 시도해 주세요."

export function AppProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [loadFailed, setLoadFailed] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const refresh = useCallback(async () => {
    const supabase = getSupabase()
    const [postResult, commentResult] = await Promise.all([
      supabase
        .from("post_feed")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("comment_feed").select("*").order("created_at"),
    ])

    if (postResult.error || commentResult.error) {
      setLoadFailed(true)
      setLoading(false)
      return
    }

    const commentsByPost = new Map<string, Comment[]>()
    for (const row of commentResult.data as CommentRow[]) {
      const comments = commentsByPost.get(row.post_id) ?? []
      comments.push(toComment(row))
      commentsByPost.set(row.post_id, comments)
    }

    setPosts(
      (postResult.data as PostRow[]).map((row) =>
        toPost(row, commentsByPost.get(row.id) ?? [])
      )
    )
    setLoadFailed(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const { data } = getSupabase().auth.onAuthStateChange((event, session) => {
      setUser(toUser(session))
      if (event === "TOKEN_REFRESHED") return
      // 이 콜백 안에서 Supabase를 바로 호출하면 교착될 수 있어 다음 틱으로 미룬다.
      setTimeout(refresh, 0)
    })
    return () => data.subscription.unsubscribe()
  }, [refresh])

  const requireLogin = () => {
    if (!user) setAuthOpen(true)
    return Boolean(user)
  }

  const save = async (
    operation: PromiseLike<{ error: unknown }>,
    errorMessage = SAVE_ERROR
  ) => {
    const { error } = await operation
    if (error) toast.error(errorMessage)
    await refresh()
    return !error
  }

  const updatePost = (postId: string, update: (post: Post) => Post) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? update(post) : post))
    )
  }

  const store: AppStore = {
    posts,
    user,
    loading,
    loadFailed,
    composerOpen,
    setComposerOpen,
    authOpen,
    setAuthOpen,
    openComposer: () => {
      if (requireLogin()) setComposerOpen(true)
    },
    signOut: async () => {
      await getSupabase().auth.signOut()
    },
    updateNickname: async (nickname) => {
      if (!user) return "failed"
      const { error } = await getSupabase()
        .from("profiles")
        .update({ nickname })
        .eq("id", user.id)
      if (error?.code === UNIQUE_VIOLATION) return "taken"
      if (error) {
        toast.error(SAVE_ERROR)
        return "failed"
      }
      // 헤더와 마이페이지는 세션의 닉네임을 쓰므로 함께 맞춘다.
      await getSupabase().auth.updateUser({ data: { nickname } })
      await refresh()
      return "saved"
    },
    addPost: (input) =>
      save(getSupabase().from("posts").insert(toPostColumns(input))),
    editPost: (postId, input) =>
      save(
        getSupabase()
          .from("posts")
          .update(toPostColumns(input))
          .eq("id", postId)
      ),
    deletePost: (postId) =>
      save(getSupabase().from("posts").delete().eq("id", postId)),
    toggleHelpful: async (postId) => {
      const post = posts.find((item) => item.id === postId)
      if (!post || !requireLogin()) return

      const { helpedByMe } = post
      updatePost(postId, (item) => ({
        ...item,
        helpedByMe: !helpedByMe,
        helpfulCount: item.helpfulCount + (helpedByMe ? -1 : 1),
      }))
      const table = getSupabase().from("post_helpful")
      await save(
        helpedByMe
          ? table.delete().eq("post_id", postId)
          : table.insert({ post_id: postId })
      )
    },
    toggleReviewed: async (postId) => {
      const post = posts.find((item) => item.id === postId)
      if (!post) return false
      return save(
        getSupabase()
          .from("posts")
          .update({ is_reviewed: !post.isReviewed })
          .eq("id", postId)
      )
    },
    addComment: (postId, body) =>
      save(getSupabase().from("comments").insert({ post_id: postId, body })),
    togglePin: async (postId, commentId) => {
      const post = posts.find((item) => item.id === postId)
      if (!post) return false
      return save(
        getSupabase()
          .from("posts")
          .update({
            pinned_comment_id:
              post.pinnedCommentId === commentId ? null : commentId,
          })
          .eq("id", postId)
      )
    },
  }

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>
}

export function useAppStore() {
  const store = useContext(AppContext)
  if (!store) {
    throw new Error("useAppStore must be used within AppProvider")
  }
  return store
}
