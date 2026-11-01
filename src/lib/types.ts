export const CATEGORIES = ["학업", "취업", "연애", "관계", "기타"] as const
export type Category = (typeof CATEGORIES)[number]

export const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "helpful", label: "도움 많이 된 순" },
  { value: "feedback", label: "피드백 많은 순" },
] as const
export type SortKey = (typeof SORT_OPTIONS)[number]["value"]

export type User = {
  id: string
  nickname: string
}

export type Comment = {
  id: string
  // 익명 글의 작성자가 쓴 피드백은 null이다.
  authorName: string | null
  body: string
  createdAt: string
  isMine: boolean
  isPostAuthor: boolean
}

export type Post = {
  id: string
  // 익명 글은 null이다.
  authorName: string | null
  isMine: boolean
  isAnonymous: boolean
  category: Category
  title: string
  situation: string
  mistake: string
  selfAction: string
  tags: string[]
  createdAt: string
  helpfulCount: number
  helpedByMe: boolean
  isReviewed: boolean
  comments: Comment[]
  pinnedCommentId: string | null
}

export type NewPostInput = Pick<
  Post,
  | "category"
  | "title"
  | "situation"
  | "mistake"
  | "selfAction"
  | "tags"
  | "isAnonymous"
>
