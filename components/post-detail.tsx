"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Clipboard, Download } from "lucide-react";
import { StudioShell } from "./studio-shell";
import { getPostPhotoSets, PhotoSetView, type PhotoSet } from "./post-photo-gallery";
import { loadStudio, type Post, type Product, type StudioData } from "../lib/studio-types";

type ArticleItem = { heading: string; comment: string; url: string; source?: string; photos?: PhotoSet };
type ArticleSections = { intro: string; items: ArticleItem[]; ending: string };

function isShopProductUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const is29cm = url.hostname === "29cm.co.kr" || url.hostname.endsWith(".29cm.co.kr");
    const isMusinsa = url.hostname === "musinsa.com" || url.hostname.endsWith(".musinsa.com");
    return (is29cm && url.pathname.startsWith("/products/")) || isMusinsa;
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
    const paragraphs = body.slice(position, match.index).trim().split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    position = (match.index ?? 0) + match[0].length;
    if (index === 0) {
      intro = paragraphs.slice(0, -2).join("\n\n");
      return { heading: paragraphs.at(-2) ?? "", comment: paragraphs.at(-1) ?? "", url: match[0], source: sources.get(match[0]), photos: bySource.get(match[0]) };
    }
    return { heading: paragraphs[0] ?? "", comment: paragraphs.slice(1).join("\n\n"), url: match[0], source: sources.get(match[0]), photos: bySource.get(match[0]) };
  });
  return { intro, items, ending: body.slice(position).trim() };
}

function formatForBlog(post: Post, sections: ArticleSections) {
  if (!sections.items.length) return `${post.title}\n\n${post.body}`;
  return [post.title, sections.intro, ...sections.items.map((item) => [
    item.heading,
    "[사진 1 삽입]\n[사진 2 삽입]",
    item.comment,
    item.url,
    `사진 출처: ${item.source || (item.photos ? `29CM ${item.photos.brand} 상품 페이지` : "[실제 사진 원출처 입력]")}`,
  ].filter(Boolean).join("\n\n")), sections.ending].filter(Boolean).join("\n\n");
}

function ArticleBody({ sections, store }: { sections: ArticleSections; store: Post["store"] }) {
  return <div className="post-article-body">
    {sections.intro && <div className="post-article-intro">{sections.intro}</div>}
    {sections.items.map((item, index) => <section className="post-article-product" key={`${item.url}-${index}`}>
      <div className="post-article-divider" aria-hidden="true"/>
      <h2>{item.heading}</h2>
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
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadStudio().then(setData).catch((cause) => setError((cause as Error).message)); }, []);
  const post = useMemo(() => data?.posts.find((item) => item.id === postId), [data, postId]);
  const sections = useMemo(() => post && data ? readArticleSections(post, data.products) : null, [post, data]);
  const hasPhotoArchive = post?.body.includes("https://www.29cm.co.kr/products/4121482") && getPostPhotoSets(post, data?.products ?? []).length === 5;

  return <StudioShell active="posts">
    <div className="post-detail-top"><a href="/posts"><ArrowLeft size={16}/> 초안 보관함으로</a></div>
    {error && <div className="flash error" role="alert">{error}</div>}
    {!data && !error && <div className="loading-state">초안을 불러오는 중이에요…</div>}
    {data && !post && <div className="panel post-detail-empty">초안을 찾지 못했어요. <a href="/posts">초안 보관함으로 돌아가기</a></div>}
    {data && post && <article className="panel post-detail-article">
      <div className="post-detail-meta"><span>{post.store} 위시리스트</span><span>{post.status === "done" ? "사용 완료" : "검토 전"}</span><time>{post.createdAt.slice(0, 10)}</time></div>
      <h1>{post.title}</h1>
      <div className="post-detail-actions">
        <button className="secondary-button" onClick={async () => { await navigator.clipboard.writeText(formatForBlog(post, sections!)); setCopied(true); }}><Clipboard size={16}/>{copied ? "글 양식 복사됨" : "글 양식 복사하기"}</button>
        {hasPhotoArchive && <a className="secondary-button" href="/draft-images/2026-10-06-29cm/29cm-wishlist-photos.zip" download="29cm-wishlist-photos.zip"><Download size={16}/> 사진 10장 받기</a>}
      </div>
      {hasPhotoArchive && <p className="post-detail-hint">글 양식을 복사한 뒤 각 사진의 ‘사진 복사’로 한 장씩 붙여넣거나, 사진 10장을 내려받아 표시된 위치에 넣어주세요.</p>}
      {sections && <ArticleBody sections={sections} store={post.store}/>}
      <div className="post-detail-bottom"><a href="/posts"><ArrowLeft size={16}/> 초안 보관함으로</a></div>
    </article>}
  </StudioShell>;
}
