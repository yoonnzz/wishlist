import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { StudioShell } from "../components/studio-shell";

const imageRoot = "/draft-images/2026-10-06-29cm";

export default function Home() {
  return <StudioShell active="home">
    <section className="home-contents" aria-labelledby="contents-title">
      <div className="section-intro"><div><span className="section-eyebrow">IN THIS JOURNAL</span><h1 id="contents-title">이번 기록을 읽어볼까요?</h1></div><span>01 — 02 <ArrowDownRight size={18}/></span></div>
      <div className="home-story-grid">
        <a className="home-story" href="/posts"><div className="story-image"><img src={`${imageRoot}/eaah-fit.webp`} alt="위시리스트에 담긴 아이템의 착용 사진"/><span className="story-index">01</span><span className="story-photo-credit">사진 출처 · 29CM</span></div><div className="story-copy"><span>WISHLIST / 29CM · 무신사</span><h3>눈여겨본 아이템,<br/>블로그 글로 다시 보기</h3><p>상품 사진과 글, 링크를 함께 확인하고 네이버 블로그에 옮겨보세요.</p><span className="story-link">위시리스트 읽기 <ArrowUpRight size={16}/></span></div></a>
        <a className="home-story" href="/trends"><div className="story-image story-art"><span>NOTES<br/>ON<br/><i>style.</i></span><span className="story-index">02</span><span className="story-art-ring"/></div><div className="story-copy"><span>EDITOR'S LETTER / TREND</span><h3>지금 달라지는<br/>패션의 분위기</h3><p>트렌드를 읽고, 내 취향과 어울리는 한 가지를 골라두는 노트.</p><span className="story-link">트렌드 레터 읽기 <ArrowUpRight size={16}/></span></div></a>
      </div>
    </section>

    <section className="home-rhythm" aria-label="글 작성 목표"><span>THE WRITING RHYTHM</span><strong>월요일 · 수요일 · 금요일, 오전 8시</strong><p>29CM와 무신사 시리즈를 번갈아 준비하는 목표예요.</p></section>
  </StudioShell>;
}
