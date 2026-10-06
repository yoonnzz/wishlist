"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, PenLine, Plus, Save, ShoppingBag } from "lucide-react";
import { StudioShell } from "../../components/studio-shell";
import { loadStudio, studioAction, type Post, type Product, type Store, type StudioData } from "../../lib/studio-types";
import { makeWishlistDraft, WISHLIST_TEMPLATE_STEPS } from "../../lib/wishlist-template";
import { registerWebMcpTool } from "../../lib/register-webmcp";

const emptyProduct = { store: "29CM" as Store, brand: "", name: "", model: "", color: "", url: "", note: "", allowReuse: false };
const defaultStyle = "짧은 문단과 잦은 줄바꿈. 친근한 존댓말과 짧은 구어체를 자연스럽게 섞기. 관심을 가진 이유를 구체적으로 쓰기. 실제 구매·착용 경험은 제공된 사실만 사용하기.";

export default function PostsPage() {
  const [data, setData] = useState<StudioData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<"write" | "products" | "archive">("archive");
  const [productForm, setProductForm] = useState(emptyProduct);
  const [store, setStore] = useState<Store>("29CM");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  useEffect(() => registerWebMcpTool({
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
  }), []);

  const candidates = useMemo(() => {
    if (!data) return [];
    const usedKeys = new Set(data.products.filter((p) => p.usedInPostId).map((p) => p.modelKey));
    return data.products.filter((p) => p.store === store && !p.usedInPostId && (!usedKeys.has(p.modelKey) || p.reuseAllowed));
  }, [data, store]);
  const selected = candidates.filter((p) => selectedIds.includes(p.id));

  async function addProduct(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await studioAction("product.add", productForm);
      setProductForm({ ...emptyProduct, store: productForm.store });
      await refresh();
      setNotice("상품을 보관함에 추가했어요.");
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }

  function fillOutline() {
    if (!selected.length) return setError("본문에 넣을 상품을 먼저 선택해 주세요.");
    const draft = makeWishlistDraft(store, selected);
    setTitle(draft.title);
    setBody(draft.body);
    setNotice("위시리스트 기본 템플릿을 채웠어요. 사진과 감상을 확인하고 다듬어 주세요.");
    setError("");
  }

  async function savePost(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (editingId) await studioAction("post.update", { id: editingId, title, body, status: "draft" });
      else await studioAction("post.create", { store, title, body, productIds: selectedIds });
      await refresh();
      setEditingId(null); setTitle(""); setBody(""); setSelectedIds([]);
      setNotice("초안을 저장했어요.");
      setSection("archive");
    } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); }
  }

  function editPost(post: Post) {
    setEditingId(post.id); setStore(post.store); setTitle(post.title); setBody(post.body);
    setSelectedIds(JSON.parse(post.productIds));
    setSection("write"); setNotice(""); setError("");
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
    <div className="page-head"><div><h1>블로그 초안</h1><p>제가 고른 상품으로 작성한 글을 여기서 확인하고, 수정하거나 복사해 네이버 블로그에 올려주세요.</p></div><div className="schedule-pill">작성 목표 · 월 · 수 · 금 <strong>08:00</strong></div></div>
    <div className="tab-row" role="tablist" aria-label="블로그 작업">
      <button className={section === "archive" ? "selected" : ""} onClick={() => setSection("archive")}>초안 확인 <span>{data?.posts.length ?? 0}</span></button>
      <button className={section === "products" ? "selected" : ""} onClick={() => setSection("products")}>취향 알려주기</button>
      <button className={section === "write" ? "selected" : ""} onClick={() => setSection("write")}>직접 작성</button>
    </div>
    {error && <div className="flash error" role="alert">{error}</div>}
    {notice && <div className="flash success" role="status">{notice}</div>}
    {!data && !error && <div className="loading-state">작업실 자료를 불러오는 중이에요…</div>}

    {data && section === "write" && <div className="work-grid">
      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">STEP 01</span><h2>이번 글의 상품</h2></div><ShoppingBag size={22}/></div>
        <div className="store-switch" aria-label="쇼핑몰 선택">
          {(["29CM", "무신사"] as Store[]).map((item) => <button key={item} disabled={Boolean(editingId)} className={store === item ? "active" : ""} onClick={() => { setStore(item); setSelectedIds([]); }}>{item}</button>)}
        </div>
        {editingId && <p className="hint">저장된 초안을 수정하고 있어요. 상품 구성은 그대로 유지됩니다.</p>}
        {!editingId && <p className="hint">직접 글을 쓰고 싶을 때만 사용하세요. 제가 작성하는 글의 상품은 따로 조사해 고릅니다.</p>}
        <div className="candidate-list">
          {candidates.length ? candidates.map((product) => <label className="candidate" key={product.id}>
            <input type="checkbox" disabled={Boolean(editingId)} checked={selectedIds.includes(product.id)} onChange={() => setSelectedIds((ids) => ids.includes(product.id) ? ids.filter((id) => id !== product.id) : [...ids, product.id])}/>
            <span><strong>{product.brand}</strong><small>{product.name}{product.color ? ` · ${product.color}` : ""}</small></span>
            <a href={product.url} target="_blank" rel="noopener noreferrer" aria-label={`${product.name} 상품 링크`} onClick={(event) => event.stopPropagation()}><ArrowUpRight size={16}/></a>
          </label>) : <div className="empty-inline">직접 작성에 사용할 {store} 상품이 없어요. 이 화면은 선택 사항입니다.<button onClick={() => setSection("products")}>참고 상품 남기기 <ArrowUpRight size={14}/></button></div>}
        </div>
      </section>
      <section className="panel writing-panel">
        <div className="panel-heading"><div><span className="eyebrow">STEP 02</span><h2>나의 글로 완성하기</h2></div><PenLine size={22}/></div>
        <div className="wishlist-template-note"><strong>위시리스트 기본 템플릿</strong><p>{WISHLIST_TEMPLATE_STEPS.join(" · ")}</p></div>
        <form onSubmit={savePost}>
          <label className="field-label" htmlFor="post-title">제목</label>
          <input id="post-title" className="text-field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 10월에 눈여겨보는 아우터 위시리스트" required/>
          <label className="field-label" htmlFor="post-body">본문</label>
          <textarea id="post-body" className="text-area post-body" value={body} onChange={(event) => setBody(event.target.value)} placeholder="상품을 선택한 뒤 본문 틀을 만들거나, 여기서 바로 글을 써보세요." required/>
          <div className="form-actions"><button type="button" className="secondary-button" onClick={fillOutline} disabled={busy || Boolean(editingId)}>위시리스트 템플릿 적용</button><button className="primary-button" disabled={busy || !title.trim() || !body.trim() || (!editingId && !selectedIds.length)}><Save size={16}/> 초안 저장</button></div>
          <p className="hint">구매하거나 사용하지 않은 상품은 실제 후기처럼 쓰지 않도록 확인해 주세요.</p>
        </form>
      </section>
    </div>}

    {data && section === "products" && <div className="work-grid">
      <section className="panel"><div className="panel-heading"><div><span className="eyebrow">MY TASTE</span><h2>좋아하는 상품 예시</h2></div><Plus size={22}/></div>
        <p className="hint">취향을 알려주고 싶을 때만 남겨주세요. 매번 상품을 추가할 필요는 없어요.</p>
        <form onSubmit={addProduct} className="stacked-form">
          <label className="field-label">쇼핑몰<select className="text-field" value={productForm.store} onChange={(event) => setProductForm({ ...productForm, store: event.target.value as Store })}><option>29CM</option><option>무신사</option></select></label>
          <div className="two-fields"><label className="field-label">브랜드<input className="text-field" value={productForm.brand} onChange={(event) => setProductForm({ ...productForm, brand: event.target.value })} required/></label><label className="field-label">모델명 / 품번<input className="text-field" value={productForm.model} onChange={(event) => setProductForm({ ...productForm, model: event.target.value })} required/></label></div>
          <label className="field-label">상품명<input className="text-field" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required/></label>
          <label className="field-label">색상<input className="text-field" value={productForm.color} onChange={(event) => setProductForm({ ...productForm, color: event.target.value })} placeholder="선택 사항"/></label>
          <label className="field-label">상품 링크<input type="url" className="text-field" value={productForm.url} onChange={(event) => setProductForm({ ...productForm, url: event.target.value })} placeholder="https://" required/></label>
          <label className="field-label">마음에 든 이유<textarea className="text-area" value={productForm.note} onChange={(event) => setProductForm({ ...productForm, note: event.target.value })} placeholder="색감, 핏, 코디 아이디어 등 짧게 적어두세요."/></label>
          <label className="check-row"><input type="checkbox" checked={productForm.allowReuse} onChange={(event) => setProductForm({ ...productForm, allowReuse: event.target.checked })}/> 이미 소개한 모델의 다른 색상을 직접 선택해 다시 다루기</label>
          <button className="primary-button" disabled={busy}><Plus size={16}/> 상품 저장</button>
        </form>
      </section>
      <section className="panel"><div className="panel-heading"><div><span className="eyebrow">SAVED PIECES</span><h2>참고 상품</h2></div><span className="count-chip">{data.products.length}개</span></div>
        {data.products.length ? <div className="saved-list">{data.products.map((product) => <div className="saved-item" key={product.id}><div><span className="mini-store">{product.store}</span> <strong>{product.brand}</strong><p>{product.name}{product.color ? ` · ${product.color}` : ""}</p><small>{product.usedInPostId ? "이미 글에 사용함" : "취향 참고용"}</small></div><a href={product.url} target="_blank" rel="noopener noreferrer" aria-label="상품 페이지 열기"><ArrowUpRight size={17}/></a></div>)}</div> : <div className="empty-inline">좋아하는 상품 예시가 있다면 남겨주세요. 없어도 됩니다.</div>}
      </section>
      <section className="panel full"><div className="panel-heading"><div><span className="eyebrow">VOICE GUIDE</span><h2>말투와 취향 기준</h2></div></div>
        <p className="hint">보내주신 블로그 글 3편을 바탕으로 초안에 참고할 기준입니다. 원하는 표현과 피하고 싶은 표현을 덧붙여 주세요.</p>
        <label className="field-label">말투 기준<textarea className="text-area" value={styleNotes} onChange={(event) => setStyleNotes(event.target.value)}/></label>
        <div className="two-fields"><label className="field-label">좋아하는 스타일<textarea className="text-area" value={favoriteNotes} onChange={(event) => setFavoriteNotes(event.target.value)} placeholder="브랜드, 색감, 실루엣 등"/></label><label className="field-label">피하고 싶은 스타일·표현<textarea className="text-area" value={avoidedNotes} onChange={(event) => setAvoidedNotes(event.target.value)} placeholder="원하지 않는 추천이나 말투"/></label></div>
        <button className="secondary-button" onClick={savePreferences} disabled={busy}><Save size={15}/> 기준 저장</button>
      </section>
    </div>}

    {data && section === "archive" && <section className="panel archive-panel">
      <div className="panel-heading"><div><span className="eyebrow">DRAFT LIBRARY</span><h2>초안 보관함</h2></div><span className="count-chip">{data.posts.length}편</span></div>
      {data.posts.length ? <div className="archive-list">{data.posts.map((post) => <article className="archive-card" key={post.id}><div className="archive-meta"><span>{post.store}</span><span>{post.status === "done" ? "사용 완료" : "검토 전"}</span><time>{post.createdAt.slice(0,10)}</time></div><h3><a href={`/posts/${post.id}`}>{post.title}</a></h3><p>{post.body.slice(0,150)}{post.body.length > 150 ? "…" : ""}</p><div className="archive-actions"><a className="archive-read-link" href={`/posts/${post.id}`}>전체 글 보기 <ArrowUpRight size={15}/></a><button onClick={() => editPost(post)}>수정하기</button>{post.status !== "done" && <button onClick={() => markDone(post)} disabled={busy}><Check size={15}/> 사용 완료</button>}</div></article>)}</div> : <div className="empty-inline">아직 저장된 초안이 없어요. 자동 작성 일정은 현재 연결 전입니다. 취향 정보는 ‘취향 알려주기’에 남길 수 있어요.</div>}
    </section>}
  </StudioShell>;
}
