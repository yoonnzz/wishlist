import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { StudioShell } from "../components/studio-shell";

const imageRoot = "/draft-images/2026-10-06-29cm";

export default function Home() {
  return <StudioShell active="home">
    <div className="home-edition-line"><span>THE PERSONAL EDIT</span><span>ISSUE 01 · 2026 AUTUMN</span></div>
    <section className="home-cover" aria-labelledby="home-title">
      <div className="home-cover-copy">
        <div className="cover-kicker"><span className="kicker-rule"/> 옷장에 남길 것들</div>
        <h1 id="home-title">마음에 드는 옷을<br/><em>하나씩 모으는 시간.</em></h1>
        <p>눈길이 가는 핏과 오래 입고 싶은 분위기. 이번 위시리스트와 패션 트렌드를 한 장의 편집지처럼 펼쳐두었어요.</p>
        <a className="cover-cta" href="/posts">블로그 위시리스트 보기 <ArrowUpRight size={19}/></a>
        <div className="cover-bottom"><span>CURATED BY YOONJI</span><span>29CM / MUSINSA</span></div>
      </div>
      <div className="home-cover-visual" aria-label="위시리스트 상품 사진 모음">
        <div className="cover-image-main"><img src={`${imageRoot}/cashmere-oatmeal-front.jpg`} alt="오트밀색 캐시미어 니트 착용 모습"/></div>
        <div className="cover-image-small"><img src={`${imageRoot}/corede-slacks-front.jpg`} alt="코어드 팬츠 착용 모습"/></div>
        <span className="cover-visual-label">THE WISHLIST<br/>EDIT · 01</span>
        <span className="cover-photo-credit">사진 출처 · 29CM 상품 페이지</span>
      </div>
    </section>

    <section className="home-contents" aria-labelledby="contents-title">
      <div className="section-intro"><div><span className="section-eyebrow">IN THIS JOURNAL</span><h2 id="contents-title">이번 기록을 읽어볼까요?</h2></div><span>01 — 02 <ArrowDownRight size={18}/></span></div>
      <div className="home-story-grid">
        <a className="home-story" href="/posts"><div className="story-image"><img src={`${imageRoot}/eaah-fit.webp`} alt="위시리스트에 담긴 아이템의 착용 사진"/><span className="story-index">01</span><span className="story-photo-credit">사진 출처 · 29CM</span></div><div className="story-copy"><span>WISHLIST / 29CM · 무신사</span><h3>눈여겨본 아이템,<br/>블로그 글로 다시 보기</h3><p>상품 사진과 글, 링크를 함께 확인하고 네이버 블로그에 옮겨보세요.</p><span className="story-link">위시리스트 읽기 <ArrowUpRight size={16}/></span></div></a>
        <a className="home-story" href="/trends"><div className="story-image story-art"><span>NOTES<br/>ON<br/><i>style.</i></span><span className="story-index">02</span><span className="story-art-ring"/></div><div className="story-copy"><span>EDITOR'S LETTER / TREND</span><h3>지금 달라지는<br/>패션의 분위기</h3><p>트렌드를 읽고, 내 취향과 어울리는 한 가지를 골라두는 노트.</p><span className="story-link">트렌드 레터 읽기 <ArrowUpRight size={16}/></span></div></a>
      </div>
    </section>

    <section className="home-rhythm" aria-label="글 작성 목표"><span>THE WRITING RHYTHM</span><strong>월요일 · 수요일 · 금요일, 오전 8시</strong><p>29CM와 무신사 시리즈를 번갈아 준비하는 목표예요.</p></section>
  </StudioShell>;
}
