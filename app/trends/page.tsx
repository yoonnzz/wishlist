"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, BookOpen, Plus, RefreshCw, Send } from "lucide-react";
import { StudioShell } from "../../components/studio-shell";
import { loadStudio, studioAction, type Letter, type StudioData } from "../../lib/studio-types";
import { registerWebMcpTool } from "../../lib/register-webmcp";

const initialIssue = {
  title: "가을 옷장의 익숙한 아이템, 조금 다르게 입기",
  kicker: "2026 AUTUMN / 첫 번째 트렌드 노트",
  summary: "단정한 실루엣에 질감과 장식으로 변화를 주는 흐름이 보여요. 위시리스트에서는 이미 좋아하는 옷에 더할 한 가지 디테일부터 찾아볼 만합니다.",
  body: "이번 가을 런웨이에서는 익숙한 기본 아이템을 새롭게 조합하는 스타일링이 눈에 띕니다. 보그는 부드러운 구조의 재킷과 풍부한 질감, 예상 밖의 디테일을 주요 흐름으로 정리했어요. 또 브로치와 보타이처럼 작은 장식이 평범한 옷차림의 분위기를 바꾸는 방법으로 소개됐습니다.\n\n위시리스트에 옮겨본다면, 처음부터 완전히 새로운 옷을 찾기보다 평소 좋아하는 가디건·재킷·스커트에 어떤 질감이나 장식을 더할 수 있을지 살펴보면 좋겠어요. 이 부분은 런웨이 흐름을 일상 쇼핑에 적용해 본 편집 메모입니다.",
  sourceUrls: [
    "https://www.vogue.com/article/fall-winter-2026-fashion-trends",
    "https://www.vogue.com/article/fall-2026-fashion-forecast",
  ],
  createdAt: "2026-10-06",
};

const poetCoreSource = "https://www.musinsa.com/content/1466324428764847985";
const poetCorePhotos = [
  { src: "/trend-images/2026-10-07-poet-core/layered-knit.webp", alt: "브라운 재킷 아래 질감 있는 니트를 겹쳐 입은 곽현주컬렉션 26 FW 런웨이", caption: "브라운 톤과 니트의 질감을 보여주는 런웨이 컷" },
  { src: "/trend-images/2026-10-07-poet-core/grey-tailoring.webp", alt: "그레이 재킷과 짙은 니트를 입은 곽현주컬렉션 26 FW 런웨이", caption: "그레이 테일러링과 차분한 니트" },
  { src: "/trend-images/2026-10-07-poet-core/brown-coat.webp", alt: "브라운 하이넥 코트를 입은 곽현주컬렉션 26 FW 런웨이", caption: "부드러운 브라운 색과 넉넉한 코트 실루엣" },
];

export default function TrendsPage() {
  const [data, setData] = useState<StudioData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [compose, setCompose] = useState(false);
  const [selected, setSelected] = useState<Letter | "initial" | null>(null);
  const [form, setForm] = useState({ title: "", kicker: "", summary: "", body: "", sourceUrls: "" });

  async function refresh() { setData(await loadStudio()); }
  useEffect(() => { refresh().catch((cause) => setError(cause.message)); }, []);
  useEffect(() => registerWebMcpTool({
    name: "save_trend_letter", title: "트렌드 레터 저장",
    description: "출처가 있는 패션 트렌드 레터를 현재 사용자의 보관함에 저장합니다.",
    inputSchema: { type: "object", properties: { title: { type: "string" }, kicker: { type: "string" }, summary: { type: "string" }, body: { type: "string" }, sourceUrls: { type: "array", items: { type: "string" }, minItems: 1 } }, required: ["title", "summary", "body", "sourceUrls"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    async execute(input) {
      const letter = input as Record<string, unknown>;
      if (!letter.title || !letter.summary || !letter.body || !Array.isArray(letter.sourceUrls) || !letter.sourceUrls.length) throw new Error("제목, 요약, 본문, 출처를 확인해 주세요.");
      const result = await studioAction("letter.add", letter);
      setData(await loadStudio());
      return { id: (result.letter as Letter).id, saved: true };
    },
  }), []);

  async function saveLetter(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await studioAction("letter.add", { ...form, sourceUrls: form.sourceUrls.split("\n").map((value) => value.trim()).filter(Boolean) });
      await refresh();
      setForm({ title: "", kicker: "", summary: "", body: "", sourceUrls: "" });
      setCompose(false); setSelected(null); setNotice("트렌드 레터를 저장했어요.");
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }

  const letters = data?.letters ?? [];
  const currentLetter = selected === "initial" ? null : selected ?? letters[0];
  const issue = currentLetter ? { ...currentLetter, sourceUrls: JSON.parse(currentLetter.sourceUrls) as string[] } : initialIssue;
  const activeId = selected === "initial" || !currentLetter ? "initial" : currentLetter.id;
  const isPoetCore = issue.title === "2026 가을, 포엣 코어를 옷으로 읽어보면";
  const paragraphs = issue.body.split("\n\n");
  return <StudioShell active="trends">
    <div className="eyebrow">DISCOVER / TREND LETTER</div>
    <div className="page-head"><div><h1>트렌드 레터</h1><p>달라지는 패션의 흐름을 읽고, 내 위시리스트에 어울리는 것만 골라보세요.</p></div><button className="secondary-button" onClick={() => setCompose((value) => !value)}><Plus size={16}/> 레터 작성</button></div>
    {error && <div className="flash error" role="alert">{error}</div>}
    {notice && <div className="flash success" role="status">{notice}</div>}
    {compose && <form className="panel letter-form" onSubmit={saveLetter}>
      <div className="panel-heading"><div><span className="eyebrow">NEW ISSUE</span><h2>새 트렌드 레터</h2></div><Send size={21}/></div>
      <div className="two-fields"><label className="field-label">제목<input className="text-field" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required/></label><label className="field-label">짧은 분류<input className="text-field" value={form.kicker} onChange={(event) => setForm({ ...form, kicker: event.target.value })} placeholder="예: 2026 AUTUMN"/></label></div>
      <label className="field-label">한 줄 요약<input className="text-field" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} required/></label>
      <label className="field-label">본문<textarea className="text-area large" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} required/></label>
      <label className="field-label">출처 링크 · 한 줄에 하나씩<textarea className="text-area" value={form.sourceUrls} onChange={(event) => setForm({ ...form, sourceUrls: event.target.value })} placeholder="https://" required/></label>
      <button className="primary-button" disabled={busy}>레터 저장</button>
    </form>}
    <div className="letter-layout">
      <article className="letter-article">
        <div className="letter-top"><span className="eyebrow">{issue.kicker}</span><span>{issue.createdAt.slice(0,10)}</span></div>
        {isPoetCore ? <figure className="trend-photo trend-photo-hero"><img src={poetCorePhotos[0].src} alt={poetCorePhotos[0].alt}/><figcaption>{poetCorePhotos[0].caption} · <a href={poetCoreSource} target="_blank" rel="noopener noreferrer">사진 출처: 무신사 / 곽현주컬렉션 26 FW <ArrowUpRight size={12}/></a></figcaption></figure> : <div className="letter-illustration"><span className="il-number">01</span><span className="il-text">A NEW<br/>POINT OF VIEW</span><div className="il-shape one"/><div className="il-shape two"/></div>}
        <h2>{issue.title}</h2>
        <p className="letter-summary">{issue.summary}</p>
        <div className="letter-body">
          {paragraphs.map((paragraph, index) => <div key={index}>
            <p>{paragraph}</p>
            {isPoetCore && index === 1 && <div className="trend-photo-pair">{poetCorePhotos.slice(1).map((photo) => <figure className="trend-photo" key={photo.src}><img src={photo.src} alt={photo.alt}/><figcaption>{photo.caption}<br/><a href={poetCoreSource} target="_blank" rel="noopener noreferrer">사진 출처: 무신사 / 곽현주컬렉션 26 FW <ArrowUpRight size={12}/></a></figcaption></figure>)}</div>}
          </div>)}
        </div>
        <div className="source-box"><h3><BookOpen size={17}/> 참고한 자료</h3>{issue.sourceUrls.map((url, index) => <a href={url} target="_blank" rel="noopener noreferrer" key={url}>자료 {index + 1} <ArrowUpRight size={15}/><small>{new URL(url).hostname}</small></a>)}</div>
      </article>
      <aside className="letter-side">
        <div className="panel"><span className="eyebrow">THE EDITOR'S NOTE</span><h3>트렌드를 고르는 기준</h3><p>유행을 그대로 따라가기보다, 내가 좋아하는 색과 핏에 닿는 흐름만 위시리스트에 담아요.</p><div className="mini-rule"><span>01</span> 어떤 변화가 보이나요?</div><div className="mini-rule"><span>02</span> 내 취향과 맞나요?</div><div className="mini-rule"><span>03</span> 실제 상품으로 이어지나요?</div></div>
        <div className="panel"><span className="eyebrow">ISSUE ARCHIVE</span><h3>지난 레터</h3>{letters.map((letter) => <button key={letter.id} className={activeId === letter.id ? "issue-link active" : "issue-link"} onClick={() => setSelected(letter)}><span>{letter.createdAt.slice(0,10)}</span>{letter.title}</button>)}<button className={activeId === "initial" ? "issue-link active" : "issue-link"} onClick={() => setSelected("initial")}><span>2026.10.06</span>{initialIssue.title}</button></div>
      </aside>
    </div>
  </StudioShell>;
}
