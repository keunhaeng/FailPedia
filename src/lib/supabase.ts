import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && key)

let client: SupabaseClient | null = null

// 환경 변수가 없어도 빌드는 되도록 처음 사용할 때 클라이언트를 만든다.
export function getSupabase() {
  if (!client) {
    client = createClient(url!, key!)
  }
  return client
}
