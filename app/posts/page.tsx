"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, PenLine, Plus, Save } from "lucide-react";
import { StudioShell } from "../../components/studio-shell";
import { loadStudio, studioAction, type Post, type Product, type StudioData, type TasteExample } from "../../lib/studio-types";
import { registerWebMcpTool } from "../../lib/register-webmcp";
import { originalProductUrl } from "../../lib/original-share-links";

const defaultStyle = "도입·상품 감상·맺음말은 한 줄에 문장 하나씩. 아주 짧은 문장 두 개만 자연스러울 때 한 줄에 함께 쓰기. 첫 번째 위시리스트 글처럼 친근한 존댓말과 짧은 구어체로 쓰기. 감탄(!, ?!), 말줄임표(...), ,,ㅎㅎ를 문맥에 맞게 자연스럽게 섞되 같은 표현을 반복하지 않기. 제목을 제외한 글 한 편의 본문 전체에 이모지는 정확히 1개만 넣기. 소재를 언급할 때는 그 상품에서 의미 있는 장점이나 단점 한 가지를 함께 쓰고 확인하지 않은 성능은 단정하지 않기. 막연한 -려고요 대신 문맥에 맞는 -구요 말투로 쓰기. 관심을 가진 이유를 구체적으로 쓰기. 실제 구매·착용 경험은 제공된 사실만 사용하기.";

export default function PostsPage() {
  const [data, setData] = useState<StudioData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<"edit" | "products" | "archive">("archive");
  const [tasteUrl, setTasteUrl] = useState("");
  const [tasteNote, setTasteNote] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [styleNotes, setStyleNotes] = useState(defaultStyle);
  const [favoriteNotes, setFavoriteNotes] = useState("");
  const [avoidedNotes, setAvoidedNotes] = useState("");

  async function refresh() {
    const value = await loadStudio();
    setData(value);
    if (value.preferences) {
      setStyleNotes(value.preferences.styleNotes || defaultStyle);
      setFavoriteNotes(value.preferences.favoriteNotes);
      setAvoidedNotes(value.preferences.avoidedNotes);
    }
  }
  useEffect(() => { refresh().catch((cause) => setError(cause.message)); }, []);
  useEffect(() => { const unregisterProduct = registerWebMcpTool({
    name: "add_wishlist_product", title: "위시리스트 상품 저장",
    description: "현재 사용자의 29CM 또는 무신사 상품을 보관함에 저장하고 중복 모델을 확인합니다.",
    inputSchema: { type: "object", properties: { store: { type: "string", enum: ["29CM", "무신사"] }, brand: { type: "string" }, name: { type: "string" }, model: { type: "string" }, color: { type: "string" }, url: { type: "string" }, note: { type: "string" } }, required: ["store", "brand", "name", "model", "url"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    async execute(input) {
      const product = input as Record<string, unknown>;
      if (!["29CM", "무신사"].includes(String(product.store)) || !product.brand || !product.name || !product.model || !product.url) throw new Error("쇼핑몰과 필수 상품 정보를 확인해 주세요.");
      const result = await studioAction("product.add", product);
      setData(await loadStudio());
      return { id: (result.product as Product).id, saved: true };
    },
  });
    const unregisterTaste = registerWebMcpTool({
      name: "add_taste_example", title: "취향 참고 상품 저장",
      description: "사용자가 좋아하는 29CM·무신사 상품 링크 하나를 확인해 브랜드·상품명·색상·대표 사진을 저장합니다. 다음 초안에서 반드시 참고합니다.",
      inputSchema: { type: "object", properties: { url: { type: "string" }, note: { type: "string" } }, required: ["url"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const result = await studioAction("taste.add", input as Record<string, unknown>);
        setData(await loadStudio());
        return { id: (result.tasteExample as TasteExample).id, saved: true };
      },
    });
    const unregisterDraft = registerWebMcpTool({
      name: "save_wishlist_draft", title: "위시리스트 초안 저장",
      description: "완성한 글을 저장합니다. 취향 알려주기의 새 상품을 모두 사진으로 확인하고, tasteExampleIds와 비교 근거 tasteBasis를 함께 전달하세요.",
      inputSchema: { type: "object", properties: { store: { type: "string", enum: ["29CM", "무신사"] }, title: { type: "string" }, body: { type: "string" }, productIds: { type: "array", items: { type: "string" } }, tasteExampleIds: { type: "array", items: { type: "string" } }, tasteBasis: { type: "string" } }, required: ["store", "title", "body", "productIds"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const result = await studioAction("post.create", input as Record<string, unknown>);
        setData(await loadStudio());
        return { id: (result.post as Post).id, saved: true };
      },
    });
    const unregisterImport = registerWebMcpTool({
      name: "import_naver_wishlist_draft", title: "네이버 글을 초안으로 가져오기",
      description: "사용자가 이미 작성한 네이버 블로그 글을 위시리스트 보관함에 복사합니다. 새 취향 상품의 다음 글 반영 상태는 유지합니다.",
      inputSchema: { type: "object", properties: { sourceUrl: { type: "string" }, store: { type: "string", enum: ["29CM", "무신사"] }, title: { type: "string" }, body: { type: "string" }, productIds: { type: "array", items: { type: "string" } } }, required: ["sourceUrl", "store", "title", "body", "productIds"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const result = await studioAction("post.import", input as Record<string, unknown>);
        setData(await loadStudio());
        return { id: (result.post as Post).id, saved: true };
      },
    });
    return () => { unregisterProduct(); unregisterTaste(); unregisterDraft(); unregisterImport(); };
  }, []);

  async function addTaste(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await studioAction("taste.add", { url: tasteUrl, note: tasteNote });
      const example = result.tasteExample as TasteExample;
      setTasteUrl(""); setTasteNote("");
      await refresh();
      setNotice(`${example.brand} ${example.name}을(를) 저장했어요. 다음 글을 쓸 때 이 상품을 꼭 참고할게요.`);
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }

  async function savePost(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (!editingId) throw new Error("수정할 초안을 선택해 주세요.");
      await studioAction("post.update", { id: editingId, title, body, status: "draft" });
      await refresh();
      setEditingId(null); setTitle(""); setBody("");
      setNotice("초안을 저장했어요.");
      setSection("archive");
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }

  function editPost(post: Post) {
    setEditingId(post.id); setTitle(post.title); setBody(post.body);
    setSection("edit"); setNotice(""); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function markDone(post: Post) {
    setBusy(true); setError("");
    try { await studioAction("post.update", { id: post.id, title: post.title, body: post.body, status: "done" }); await refresh(); setNotice("사용 완료로 표시했어요."); }
    catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }

  async function savePreferences() {
    setBusy(true); setError("");
    try { await studioAction("preferences.update", { styleNotes, favoriteNotes, avoidedNotes }); await refresh(); setNotice("취향과 말투 기준을 저장했어요."); }
    catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }

  return <StudioShell active="posts">
    <div className="eyebrow">WRITE / WISHLIST SERIES</div>
    <div className="page-head"><div><h1>블로그 위시리스트</h1><p>{data?.canEdit ? "제가 고른 상품으로 작성한 글을 여기서 확인하고, 수정하거나 복사해 네이버 블로그에 올려주세요." : "29CM와 무신사에서 고른 위시리스트 글을 읽어보세요."}</p></div><div className="schedule-pill">작성 목표 · 월 · 수 · 금 <strong>08:00</strong></div></div>
    <div className="tab-row" role="tablist" aria-label="블로그 작업">
      <button className={section === "archive" ? "selected" : ""} onClick={() => setSection("archive")}>초안 확인 <span>{data?.posts.length ?? 0}</span></button>
      {data?.canEdit && <button className={section === "products" ? "selected" : ""} onClick={() => setSection("products")}>취향 알려주기</button>}
      {data?.canEdit && editingId && <button className={section === "edit" ? "selected" : ""} onClick={() => setSection("edit")}>초안 수정</button>}
    </div>
    {error && <div className="flash error" role="alert">{error}</div>}
    {notice && <div className="flash success" role="status">{notice}</div>}
    {!data && !error && <div className="loading-state">작업실 자료를 불러오는 중이에요…</div>}

    {data?.canEdit && section === "edit" && editingId && <div className="edit-draft-wrap">
      <section className="panel writing-panel">
        <div className="panel-heading"><div><span className="eyebrow">DRAFT EDIT</span><h2>초안 수정하기</h2></div><PenLine size={22}/></div>
        <p className="hint">제목과 본문을 수정할 수 있어요. 상품 구성은 그대로 유지됩니다.</p>
        <form onSubmit={savePost}>
          <label className="field-label" htmlFor="post-title">제목</label>
          <input id="post-title" className="text-field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 10월에 눈여겨보는 아우터 위시리스트" required/>
          <label className="field-label" htmlFor="post-body">본문</label>
          <textarea id="post-body" className="text-area post-body" value={body} onChange={(event) => setBody(event.target.value)} required/>
          <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setSection("archive")}>보관함으로</button><button className="primary-button" disabled={busy || !title.trim() || !body.trim()}><Save size={16}/> 수정 내용 저장</button></div>
          <p className="hint">구매하거나 사용하지 않은 상품은 실제 후기처럼 쓰지 않도록 확인해 주세요.</p>
        </form>
      </section>
    </div>}

    {data?.canEdit && section === "products" && <div className="work-grid">
      <section className="panel"><div className="panel-heading"><div><span className="eyebrow">MY TASTE</span><h2>좋아하는 상품 링크</h2></div><Plus size={22}/></div>
        <p className="hint">29CM나 무신사 상품 링크만 넣어주세요. 브랜드·상품명·색상과 대표 사진을 자동으로 읽어와요. 공유 링크도 원래 주소 그대로 보관합니다.</p>
        <form onSubmit={addTaste} className="stacked-form">
          <label className="field-label">상품 링크<input type="url" className="text-field" value={tasteUrl} onChange={(event) => setTasteUrl(event.target.value)} placeholder="https://www.29cm.co.kr/products/..." required/></label>
          <label className="field-label">특히 마음에 든 점 <span className="optional-label">선택</span><textarea className="text-area" value={tasteNote} onChange={(event) => setTasteNote(event.target.value)} placeholder="예: 소매가 넉넉하고 어깨가 자연스럽게 내려오는 핏"/></label>
          <button className="primary-button" disabled={busy || !tasteUrl.trim()}><Plus size={16}/>{busy ? "상품 정보 확인 중…" : "취향으로 저장"}</button>
        </form>
      </section>
      <section className="panel"><div className="panel-heading"><div><span className="eyebrow">SAVED TASTE</span><h2>저장한 취향</h2></div><span className="count-chip">{data.tasteExamples.length}개</span></div>
        {data.tasteExamples.length ? <div className="taste-list">{data.tasteExamples.map((example) => <article className="taste-item" key={example.id}>
          {example.imageUrl ? <img src={example.imageUrl} alt={`${example.brand} ${example.name} 상품 사진`} loading="lazy"/> : <div className="taste-image-empty">사진 없음</div>}
          <div className="taste-item-copy"><span className="mini-store">{example.store}</span><strong>{example.brand}</strong><p>{example.name}</p><small>{example.color ? `색상 · ${example.color}` : "색상 정보 없음"} · 모델 {example.model}</small>{example.note && <p className="taste-note">{example.note}</p>}<span className="taste-status">{example.firstUsedInPostId ? "글 작성에 반영됨 · 이후에도 참고" : "다음 글에 반영 예정"}</span></div>
          <a href={example.url} target="_blank" rel="noopener noreferrer" aria-label={`${example.name} 상품 페이지 열기`}><ArrowUpRight size={17}/></a>
        </article>)}</div> : <div className="empty-inline">좋아하는 상품 링크를 저장하면 다음 글의 취향 기준으로 사용해요.</div>}
      </section>
      {data.products.length > 0 && <section className="panel full"><div className="panel-heading"><div><span className="eyebrow">EARLIER PIECES</span><h2>이전에 저장한 상품</h2></div><span className="count-chip">{data.products.length}개</span></div><div className="saved-list">{data.products.map((product) => <div className="saved-item" key={product.id}><div><span className="mini-store">{product.store}</span> <strong>{product.brand}</strong><p>{product.name}{product.color ? ` · ${product.color}` : ""}</p><small>{product.usedInPostId ? "글에 사용함" : "기존 참고 상품"}</small></div><a href={originalProductUrl(product.url)} target="_blank" rel="noopener noreferrer" aria-label="상품 페이지 열기"><ArrowUpRight size={17}/></a></div>)}</div></section>}
      <section className="panel full"><div className="panel-heading"><div><span className="eyebrow">VOICE GUIDE</span><h2>말투와 취향 기준</h2></div></div>
        <p className="hint">보내주신 블로그 글 3편을 바탕으로 초안에 참고할 기준입니다. 원하는 표현과 피하고 싶은 표현을 덧붙여 주세요.</p>
        <label className="field-label">말투 기준<textarea className="text-area" value={styleNotes} onChange={(event) => setStyleNotes(event.target.value)}/></label>
        <div className="two-fields"><label className="field-label">좋아하는 스타일<textarea className="text-area" value={favoriteNotes} onChange={(event) => setFavoriteNotes(event.target.value)} placeholder="브랜드, 색감, 실루엣 등"/></label><label className="field-label">피하고 싶은 스타일·표현<textarea className="text-area" value={avoidedNotes} onChange={(event) => setAvoidedNotes(event.target.value)} placeholder="원하지 않는 추천이나 말투"/></label></div>
        <button className="secondary-button" onClick={savePreferences} disabled={busy}><Save size={15}/> 기준 저장</button>
      </section>
    </div>}

    {data && section === "archive" && <section className="panel archive-panel">
      <div className="panel-heading"><div><span className="eyebrow">WISHLIST LIBRARY</span><h2>위시리스트 보관함</h2></div><span className="count-chip">{data.posts.length}편</span></div>
        {data.posts.length ? <div className="archive-list">{data.posts.map((post) => <article className="archive-card" key={post.id}><div className="archive-meta"><span>{post.store}</span><span>{post.status === "done" ? "사용 완료" : "검토 전"}</span><time>{post.createdAt.slice(0,10)}</time></div><h3><a href={`/posts/${post.id}`}>{post.title}</a></h3><p>{post.body.slice(0,150)}{post.body.length > 150 ? "…" : ""}</p><div className="archive-actions"><a className="archive-read-link" href={`/posts/${post.id}`}>전체 글 보기 <ArrowUpRight size={15}/></a>{data.canEdit && <button onClick={() => editPost(post)}>수정하기</button>}{data.canEdit && post.status !== "done" && <button onClick={() => markDone(post)} disabled={busy}><Check size={15}/> 사용 완료</button>}</div></article>)}</div> : <div className="empty-inline">아직 저장된 초안이 없어요. 자동 작성 일정은 현재 연결 전입니다. 취향 정보는 ‘취향 알려주기’에 남길 수 있어요.</div>}
    </section>}
  </StudioShell>;
}
