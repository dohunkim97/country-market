import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "나라장터 매칭",
  description: "나라장터 입찰 매칭 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-full">
        <div className="flex h-screen w-full bg-page text-text-primary">
          <Sidebar />
          <main className="flex-1 overflow-y-auto relative min-w-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
