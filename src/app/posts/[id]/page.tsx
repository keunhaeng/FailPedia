import { Suspense } from "react"

import { PostDetail } from "@/components/post-detail"

export default function PostPage() {
  return (
    <Suspense>
      <PostDetail />
    </Suspense>
  )
}
