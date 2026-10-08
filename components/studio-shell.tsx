import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function StudioShell({ active, children }: { active: "home" | "trends" | "posts" | "taste"; children: ReactNode }) {
  return <div className="site-frame">
    <div className="edition-bar"><span>MY PICKS · PERSONAL FASHION JOURNAL</span><span>29CM × 무신사 <span className="edition-divider">/</span> 매일 08:00</span></div>
    <header className="site-header">
      <a className="site-wordmark" href="/" aria-label="My Picks 홈"><span>MY</span> PICKS<span className="wordmark-period">.</span><small>WISHLIST JOURNAL</small></a>
      <a className="header-blog-link" href="https://blog.naver.com/yoon__z" target="_blank" rel="noopener noreferrer">윤지의 네이버 블로그 <ArrowUpRight size={15}/></a>
    </header>
    <nav className="editorial-nav" aria-label="주요 메뉴">
      <a className={active === "home" ? "active" : ""} href="/">홈</a>
      <a className={active === "posts" ? "active" : ""} href="/posts">블로그 위시리스트</a>
      <a className={active === "taste" ? "active" : ""} href="/posts?tab=taste">취향 알려주기</a>
      <a className={active === "trends" ? "active" : ""} href="/trends">트렌드 레터</a>
      <span>나의 취향을 모으는 곳</span>
    </nav>
    <main className="main-area"><div className="content-area">{children}</div></main>
    <footer className="site-footer"><strong>MY PICKS.</strong><span>좋아하는 옷을 오래 바라보고, 천천히 고르는 기록.</span><a href="/signin-with-chatgpt?return_to=%2Fposts" target="_top">작업실 관리</a></footer>
  </div>;
}
