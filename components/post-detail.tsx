"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Clipboard, Download } from "lucide-react";
import { StudioShell } from "./studio-shell";
import { embeddedPhoto, getPostPhotoSets, PhotoSetView, type PhotoSet } from "./post-photo-gallery";
import { loadStudio, type Post, type Product, type StudioData } from "../lib/studio-types";
import { canonicalProductUrl, originalProductUrl } from "../lib/original-share-links";

type ArticleItem = { heading: string; price?: string; comment: string; url: string; source?: string; photos?: PhotoSet };
type ArticleSections = { intro: string; items: ArticleItem[]; ending: string };
const blogDivider = "────────────────";
const blogFontStyle = "font-family:'NanumSquare','나눔스퀘어',sans-serif;font-size:11pt";

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

function formatForBlogHtml(post: Post, sections: ArticleSections, photoData?: Map<string, string>) {
  const paragraph = (content: string, extraStyle = "") => `<p style="${blogFontStyle}${extraStyle}">${content}</p>`;
  if (!sections.items.length) return `<div style="${blogFontStyle}">${paragraph(`<strong>${escapeHtml(post.title)}</strong>`)}${paragraph(htmlLines(post.body))}</div>`;
  const blocks = [
    paragraph(`<strong>${escapeHtml(post.title)}</strong>`),
    sections.intro && paragraph(htmlLines(sections.intro)),
    ...sections.items.flatMap((item) => [
      paragraph(blogDivider, ";text-align:center;color:#aeb9a2"),
      paragraph(`<strong>${htmlLines(item.heading)}</strong>`),
      item.price && paragraph(htmlLines(item.price)),
      ...(item.photos ? item.photos.photos.map((photo, index) => photoData?.get(photo.file)
        ? paragraph(`<img src="${photoData.get(photo.file)}" alt="${escapeHtml(item.photos!.brand)} ${index + 1}" style="display:block;max-width:100%;height:auto;margin:0 auto">`)
        : paragraph(`[사진 ${index + 1} 삽입]`)) : [paragraph("[사진 1 삽입]<br>[사진 2 삽입]")]),
      item.comment && paragraph(htmlLines(item.comment)),
      paragraph(`<a style="${blogFontStyle}" href="${escapeHtml(item.url)}">${escapeHtml(item.url)}</a>`),
      paragraph(`사진 출처: ${escapeHtml(item.source || (item.photos ? `29CM ${item.photos.brand} 상품 페이지` : "[실제 사진 원출처 입력]"))}`),
    ]),
    sections.ending && paragraph(htmlLines(sections.ending)),
  ];
  return `<div style="${blogFontStyle}">${blocks.filter(Boolean).join("")}</div>`;
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
  const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "rich-images" | "rich" | "plain">("idle");

  useEffect(() => { loadStudio().then(setData).catch((cause) => setError((cause as Error).message)); }, []);
  const post = useMemo(() => data?.posts.find((item) => item.id === postId), [data, postId]);
  const sections = useMemo(() => post && data ? readArticleSections(post, data.products) : null, [post, data]);
  const hasPhotoArchive = sections?.items.some((item) => canonicalProductUrl(item.url) === "https://www.29cm.co.kr/products/4121482") && getPostPhotoSets(post!, data?.products ?? []).length === 5;

  async function copyArticle() {
    if (!post || !sections) return;
    setCopyStatus("copying");
    const plain = formatForBlog(post, sections);
    try {
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard.write) throw new Error("서식 복사를 지원하지 않습니다.");
      const hasPhotos = sections.items.some((item) => item.photos);
      const html = (async () => {
        const photos = sections.items.flatMap((item) => item.photos?.photos ?? []);
        const entries = await Promise.all(photos.map(async (photo) => [photo.file, await embeddedPhoto(photo.file)] as const));
        return formatForBlogHtml(post, sections, new Map(entries));
      })();
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": html.then((value) => new Blob([value], { type: "text/html" })),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      })]);
      setCopyStatus(hasPhotos ? "rich-images" : "rich");
    } catch {
      try {
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
  }

  return <StudioShell active="posts">
    <div className="post-detail-top"><a href="/posts"><ArrowLeft size={16}/> 초안 보관함으로</a></div>
    {error && <div className="flash error" role="alert">{error}</div>}
    {!data && !error && <div className="loading-state">초안을 불러오는 중이에요…</div>}
    {data && !post && <div className="panel post-detail-empty">초안을 찾지 못했어요. <a href="/posts">초안 보관함으로 돌아가기</a></div>}
    {data && post && <article className="panel post-detail-article">
      <div className="post-detail-meta"><span>{post.store} 위시리스트</span><span>{post.status === "done" ? "사용 완료" : "검토 전"}</span><time>{post.createdAt.slice(0, 10)}</time></div>
      <h1>{post.title}</h1>
      <div className="post-detail-actions">
        <button className="secondary-button" onClick={copyArticle} disabled={copyStatus === "copying"}><Clipboard size={16}/>{copyStatus === "copying" ? "사진 포함 복사 중…" : copyStatus === "rich-images" ? "사진·서식 포함 복사됨" : copyStatus === "rich" ? "서식만 복사됨" : copyStatus === "plain" ? "텍스트만 복사됨" : "사진 포함 전체 글 복사"}</button>
        {hasPhotoArchive && <a className="secondary-button" href="/draft-images/2026-10-06-29cm/29cm-wishlist-photos-v2.zip" download="29cm-wishlist-photos.zip"><Download size={16}/> 사진 10장 받기</a>}
      </div>
      {copyStatus === "plain" && <p className="post-detail-hint" role="status">이 브라우저에서는 굵은 글씨가 복사되지 않았어요. 크롬에서 다시 복사해 주세요.</p>}
      {copyStatus === "rich" && <p className="post-detail-hint" role="status">사진을 클립보드에 넣지 못해 글 서식만 복사됐어요. 아래 ‘사진 저장’으로 내려받아 네이버 사진 첨부로 넣어주세요.</p>}
      {hasPhotoArchive && <p className="post-detail-hint">네이버에서 붙여넣은 사진이 보이지 않거나 저장되지 않으면 ‘사진 10장 받기’로 내려받아 네이버 사진 첨부로 올려주세요.</p>}
      {sections && <ArticleBody sections={sections} store={post.store}/>}
      <div className="post-detail-bottom"><a href="/posts"><ArrowLeft size={16}/> 초안 보관함으로</a></div>
    </article>}
  </StudioShell>;
}
