import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "风格图谱 · Style Atlas",
  description: "艺术风格词典：按领域与谱系整理视觉风格，为 AI 绘画提供可复用的提示词参考。",
  openGraph: {
    title: "风格图谱 · Style Atlas",
    description:
      "艺术风格词典：按领域与谱系整理视觉风格，为 AI 绘画提供可复用的提示词参考。",
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <header className="border-b border-neutral-200">
          <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-baseline gap-3">
              <span className="text-xl font-bold tracking-tight">风格图谱</span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500">
                Style Atlas
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="hover:underline underline-offset-4">
                图谱
              </Link>
              <Link href="/explore" className="hover:underline underline-offset-4">
                随便逛逛
              </Link>
              <Link href="/search" className="hover:underline underline-offset-4">
                搜索
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-neutral-200 mt-24">
          <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-neutral-500">
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              Style Atlas
            </span>
            <span>为 AI 绘画创作者整理的视觉风格参考</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
