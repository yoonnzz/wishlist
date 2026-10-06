import { ArrowUpRight, CalendarDays, Newspaper, PenLine, Sparkles } from "lucide-react";

export default function Home() {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-mark"><span>m.</span><div><strong>MY PICKS</strong><small>WISHLIST STUDIO</small></div></div>
      <p className="side-label">WORKSPACE</p>
      <nav className="side-nav" aria-label="주요 메뉴">
        <a className="active" href="/"><Sparkles size={17}/> 홈</a>
        <a href="/trends"><Newspaper size={17}/> 트렌드 레터</a>
        <a href="/posts"><PenLine size={17}/> 블로그 초안</a>
      </nav>
      <div className="sidebar-foot"><span className="live-dot"/> 매주 월 · 수 · 금 08:00 <small>Asia/Seoul</small></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><span>나만의 패션 아카이브</span><span className="topbar-right">꼼지의 작업실 <span className="avatar">꼼</span></span></header>
      <div className="content-area">
        <div className="eyebrow">EDITORIAL DESK / MY PICKS</div>
        <div className="heading-row"><div><h1>이번 주의 위시리스트를<br/><em>준비해볼까요?</em></h1><p>취향을 모으고, 흐름을 읽고, 나다운 글로 완성해요.</p></div><div className="date-box"><CalendarDays size={18}/><span>작성 일정 · 월 · 수 · 금<br/><strong>오전 8시</strong></span></div></div>
        <div className="hero-grid">
          <a className="feature-card dark" href="/posts"><div><span className="card-kicker">01 / WRITE</span><h2>블로그 글쓰기</h2><p>29CM와 무신사, 두 시리즈의 위시리스트를 한곳에서.</p></div><span className="circle-arrow"><ArrowUpRight size={22}/></span><span className="visual-arc"/></a>
          <a className="feature-card light" href="/trends"><div><span className="card-kicker">02 / DISCOVER</span><h2>트렌드 레터</h2><p>달라지는 패션의 분위기를 뉴스레터처럼 읽어보세요.</p></div><span className="circle-arrow"><ArrowUpRight size={22}/></span><span className="visual-asterisk">✳</span></a>
        </div>
        <section className="schedule-strip"><div><span className="side-label">PUBLISHING RHYTHM</span><h3>취향은 꾸준히 쌓일 때 선명해져요.</h3></div><div className="schedule-days"><span>MON <b>29CM</b></span><span>WED <b>무신사</b></span><span>FRI <b>29CM</b></span><small>첫 주 예시 · 다음 주에는 무신사부터 이어집니다.</small></div></section>
      </div>
    </main>
  </div>;
}
