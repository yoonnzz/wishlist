import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Picks | 위시리스트 스튜디오",
  description: "패션 트렌드와 나의 취향을 모아 네이버 블로그 위시리스트를 준비하는 작업실",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
