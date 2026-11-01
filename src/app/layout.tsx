import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import { AuthDialog } from "@/components/auth-dialog";
import { CreatePostDialog } from "@/components/post-form-dialog";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FailPedia",
  description: "일상의 실수를 회고하고 피드백을 나누는 공간",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col break-keep wrap-break-word">
        <AppProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            {children}
          </main>
          <CreatePostDialog />
          <AuthDialog />
          <Toaster theme="light" position="bottom-center" />
        </AppProvider>
      </body>
    </html>
  );
}
