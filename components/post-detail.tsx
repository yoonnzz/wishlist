"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Clipboard, Download } from "lucide-react";
import { StudioShell } from "./studio-shell";
import { getPostPhotoSets, photoArchiveFor, PhotoSetView, type PhotoSet } from "./post-photo-gallery";
import { loadStudio, type Post, type Product, type StudioData } from "../lib/studio-types";
import { canonicalProductUrl, originalProductUrl } from "../lib/original-share-links";

type ArticleItem = { heading: string; price?: string; comment: string; url: string; source?: string; photos?: PhotoSet };
type ArticleSections = { intro: string; items: ArticleItem[]; ending: string };
const blogDivider = "────────────────";

function isShopProductUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const is29cm = url.hostname === "29cm.co.kr" || url.hostname.endsWith(".29cm.co.kr");
    const is29cmShare = url.hostname === "29cm.onelink.me";
    const isMusinsa = url.hostname === "musinsa.com" || url.hostname.endsWith(".musinsa.com");
    return (is29cm && url.pathname.startsWith("/products/")) || is29cmShare || isMusinsa;
  } catch { return false; }
}

function readArticleSections(post: Post, products: Product[]): ArticleSections {
  const bySource = new Map(getPostPhotoSets(post, products).map((set) => [set.source, set]));
  const sources = new Map<string, string>();
  let currentUrl = "";
  for (const line of post.body.split("\n")) {
    const value = line.trim();
    if (isShopProductUrl(value)) currentUrl = value;
    else if (currentUrl && /^사진 (?:2장 )?출처:/.test(value)) sources.set(currentUrl, value.replace(/^사진 (?:2장 )?출처:\s*/, ""));
  }
  const body = post.body.replace(/^사진 (?:2장 )?출처:[^\n]*(?:\n|$)/gm, "");
  const matches = [...body.matchAll(/^https:\/\/[^\s]+$/gm)].filter((match) => isShopProductUrl(match[0]));
  if (!matches.length) return { intro: body.trim(), items: [], ending: "" };

  let intro = "";
  let position = 0;
  const items = matches.map((match, index) => {
    const chunk = body.slice(position, match.index);
    const price = [...chunk.matchAll(/^가격:\s*(.+)$/gm)].map((match) => match[1]).join("\n") || undefined;
    const paragraphs = chunk.replace(/^가격:[^\n]*(?:\n|$)/gm, "").trim().split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    position = (match.index ?? 0) + match[0].length;
    if (index === 0) {
      intro = paragraphs.slice(0, -2).join("\n\n");
      return { heading: paragraphs.at(-2) ?? "", price, comment: paragraphs.at(-1) ?? "", url: originalProductUrl(match[0]), source: sources.get(match[0]), photos: bySource.get(canonicalProductUrl(match[0])) };
    }
    return { heading: paragraphs[0] ?? "", price, comment: paragraphs.slice(1).join("\n\n"), url: originalProductUrl(match[0]), source: sources.get(match[0]), photos: bySource.get(canonicalProductUrl(match[0])) };
  });
  return { intro, items, ending: body.slice(position).trim() };
}

function formatForBlog(post: Post, sections: ArticleSections) {
  if (!sections.items.length) return `${post.title}\n\n${post.body}`;
  return [post.title, sections.intro, ...sections.items.map((item) => [
    blogDivider,
    item.heading,
    item.price || "",
    "[사진 1 삽입]\n[사진 2 삽입]",
    item.comment,
    item.url,
    `사진 출처: ${item.source || (item.photos ? `29CM ${item.photos.brand} 상품 페이지` : "[실제 사진 원출처 입력]")}`,
  ].filter(Boolean).join("\n\n")), sections.ending].filter(Boolean).join("\n\n");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function htmlLines(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function formatForBlogHtml(post: Post, sections: ArticleSections) {
  const paragraph = (content: string, extraStyle = "", bold = false) => `<p style="font-weight:400${extraStyle}"><span style="font-weight:${bold ? 700 : 400}">${content}</span></p>`;
  if (!sections.items.length) return `<div>${paragraph(escapeHtml(post.title), "", true)}${paragraph(htmlLines(post.body))}</div>`;
  const blocks = [
    paragraph(escapeHtml(post.title), "", true),
    sections.intro && paragraph(htmlLines(sections.intro)),
    ...sections.items.flatMap((item) => [
      paragraph(blogDivider, ";text-align:center;color:#aeb9a2"),
      paragraph(htmlLines(item.heading), "", true),
      item.price && paragraph(htmlLines(item.price)),
      paragraph("[사진 1 삽입]<br>[사진 2 삽입]"),
      item.comment && paragraph(htmlLines(item.comment)),
      paragraph(`<a style="font-weight:400" href="${escapeHtml(item.url)}">${escapeHtml(item.url)}</a>`),
      paragraph(`사진 출처: ${escapeHtml(item.source || (item.photos ? `29CM ${item.photos.brand} 상품 페이지` : "[실제 사진 원출처 입력]"))}`),
    ]),
    sections.ending && paragraph(htmlLines(sections.ending)),
  ];
  return `<div>${blocks.filter(Boolean).join("")}</div>`;
}

function ArticleBody({ sections, store }: { sections: ArticleSections; store: Post["store"] }) {
  return <div className="post-article-body">
    {sections.intro && <div className="post-article-intro">{sections.intro}</div>}
    {sections.items.map((item, index) => <section className="post-article-product" key={`${item.url}-${index}`}>
      <div className="post-article-divider" aria-hidden="true"/>
      <h2>{item.heading}</h2>
      {item.price && <p className="post-article-price">{item.price}</p>}
      {item.photos && <PhotoSetView set={item.photos} showHeading={false} showSource={false}/>} 
      <div className="post-article-comment">{item.comment}</div>
      <a className="post-article-product-link" href={item.url} target="_blank" rel="noopener noreferrer">{store} 상품 보러가기 <ArrowUpRight size={15}/></a>
      {(item.source || item.photos) && <p className="post-article-source">사진 출처 · {item.source || `29CM ${item.photos?.brand} 상품 페이지`}</p>}
    </section>)}
    {sections.ending && <div className="post-article-ending">{sections.ending}</div>}
  </div>;
}

export function PostDetail({ postId }: { postId: string }) {
  const [data, setData] = useState<StudioData | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "rich" | "plain">("idle");

  useEffect(() => { loadStudio().then(setData).catch((cause) => setError((cause as Error).message)); }, []);
  const post = useMemo(() => data?.posts.find((item) => item.id === postId), [data, postId]);
  const sections = useMemo(() => post && data ? readArticleSections(post, data.products) : null, [post, data]);
  const photoArchive = post && data ? photoArchiveFor(getPostPhotoSets(post, data.products)) : null;

  async function copyArticle() {
    if (!post || !sections) return;
    const plain = formatForBlog(post, sections);
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard.write) throw new Error("서식 복사를 지원하지 않습니다.");
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([formatForBlogHtml(post, sections)], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      })]);
      setCopyStatus("rich");
    } catch {
      await navigator.clipboard.writeText(plain);
      setCopyStatus("plain");
    }
  }

  return <StudioShell active="posts">
    <div className="post-detail-top"><a href="/posts"><ArrowLeft size={16}/> 위시리스트 보관함으로</a></div>
    {error && <div className="flash error" role="alert">{error}</div>}
    {!data && !error && <div className="loading-state">초안을 불러오는 중이에요…</div>}
    {data && !post && <div className="panel post-detail-empty">초안을 찾지 못했어요. <a href="/posts">위시리스트 보관함으로 돌아가기</a></div>}
    {data && post && <article className="panel post-detail-article">
      <div className="post-detail-meta"><span>{post.store} 위시리스트</span><span>{post.status === "done" ? "사용 완료" : "검토 전"}</span><time>{post.createdAt.slice(0, 10)}</time></div>
      <h1>{post.title}</h1>
      <div className="post-detail-actions">
        <button className="secondary-button" onClick={copyArticle}><Clipboard size={16}/>{copyStatus === "rich" ? "글 서식 복사됨" : copyStatus === "plain" ? "텍스트만 복사됨" : "네이버용 글 복사"}</button>
        {photoArchive && <a className="secondary-button" href={photoArchive} download><Download size={16}/> 순서대로 사진 10장 받기</a>}
      </div>
      {copyStatus === "plain" && <p className="post-detail-hint" role="status">이 브라우저에서는 글자 서식이 복사되지 않았어요. 크롬에서 다시 복사해 주세요.</p>}
      <p className="post-detail-hint">나눔스퀘어 11로 붙여넣으려면 네이버 블로그 관리 → 기본 설정 → 기본 서체 설정에서 글꼴과 크기를 지정해 주세요. 복사한 글은 네이버의 기본 서체를 따릅니다.</p>
      {photoArchive && <p className="post-detail-hint">글을 붙여넣은 뒤 압축을 풀고, 본문의 [사진 1 삽입]·[사진 2 삽입] 자리에 네이버 에디터의 ‘사진’ 버튼으로 번호순 파일을 첨부해 주세요. 붙여넣기만으로는 네이버에 사진이 안정적으로 등록되지 않습니다.</p>}
      {sections && <ArticleBody sections={sections} store={post.store}/>}
      <div className="post-detail-bottom"><a href="/posts"><ArrowLeft size={16}/> 위시리스트 보관함으로</a></div>
    </article>}
  </StudioShell>;
}
