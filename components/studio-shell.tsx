import { Newspaper, PenLine, Sparkles, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";

export function StudioShell({ active, children }: { active: "home" | "trends" | "posts"; children: ReactNode }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand-mark" href="/"><span>m.</span><div><strong>MY PICKS</strong><small>WISHLIST STUDIO</small></div></a>
      <p className="side-label">WORKSPACE</p>
      <nav className="side-nav" aria-label="주요 메뉴">
        <a className={active === "home" ? "active" : ""} href="/"><Sparkles size={17}/> 홈</a>
        <a className={active === "trends" ? "active" : ""} href="/trends"><Newspaper size={17}/> 트렌드 레터</a>
        <a className={active === "posts" ? "active" : ""} href="/posts"><PenLine size={17}/> 블로그 위시리스트</a>
      </nav>
      <div className="sidebar-foot"><ShoppingBag size={16}/><div>29CM × 무신사<small>작성 목표 · 월 · 수 · 금 08:00</small></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><span>나만의 패션 아카이브</span><span className="topbar-right">꼼지의 작업실 <span className="avatar">꼼</span></span></header>
      <div className="content-area">{children}</div>
    </main>
  </div>;
}
