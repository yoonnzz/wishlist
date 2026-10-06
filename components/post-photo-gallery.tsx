"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Post, Product } from "../lib/studio-types";
import { canonicalProductUrl, originalProductUrl } from "../lib/original-share-links";

type Photo = { file: string; label: string; detail: string };
export type PhotoSet = { source: string; brand: string; product: string; photos: [Photo, Photo] };

const imageRoot = "/draft-images/2026-10-06-29cm";

function CopyPhotoButton({ photo, product }: { photo: Photo; product: string }) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "error">("idle");

  async function copyPhoto() {
    setState("copying");
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") throw new Error("Clipboard unavailable");
      const png = (async () => {
        const response = await fetch(`${imageRoot}/${photo.file}`);
        if (!response.ok) throw new Error("Photo unavailable");
        const bitmap = await createImageBitmap(await response.blob());
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Image conversion unavailable");
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
        return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image conversion failed")), "image/png"));
      })();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      setState("copied");
    } catch {
      setState("error");
    }
  }

  return <button type="button" className="post-photo-copy-button" onClick={copyPhoto} disabled={state === "copying"} aria-label={`${product} ${photo.label} 사진 복사`}>
    {state === "copied" ? <Check size={14}/> : <Copy size={14}/>}
    {state === "copying" ? "복사 중…" : state === "copied" ? "복사됨" : state === "error" ? "복사 실패 · 사진 저장" : "사진 복사"}
  </button>;
}

const photosByProduct: Record<string, Omit<PhotoSet, "source">> = {
  "3453926": {
    brand: "EAAH", product: "데님",
    photos: [
      { file: "eaah-fit.webp", label: "전체 핏", detail: "길이와 자연스럽게 떨어지는 실루엣" },
      { file: "eaah-detail.webp", label: "포인트", detail: "허리부터 밑단까지 이어지는 바지 라인" },
    ],
  },
  "4136488": {
    brand: "LAMEREI", product: "하이넥 하프 트렌치",
    photos: [
      { file: "lamerei-mood.webp", label: "착용 분위기", detail: "열어 입었을 때의 가벼운 가을 분위기" },
      { file: "lamerei-collar.webp", label: "포인트", detail: "하이넥 칼라와 비대칭 여밈" },
    ],
  },
  "4121482": {
    brand: "THE KNIT COMPANY", product: "캐시미어 니트",
    photos: [
      { file: "cashmere-oatmeal-mood.jpg", label: "착용 분위기 · 오트밀", detail: "브랜드 모델의 오트밀 착용 컷과 자연스러운 소재감" },
      { file: "cashmere-oatmeal-front.jpg", label: "앞면 핏 · 오트밀", detail: "브랜드 모델 착용 컷에서 보이는 목선과 몸판의 핏" },
    ],
  },
  "3085362": {
    brand: "CORE DE", product: "코튼 슬랙스",
    photos: [
      { file: "corede-slacks-front.jpg", label: "앞모습", detail: "앞턱과 전체 실루엣" },
      { file: "corede-slacks-back.jpg", label: "뒷모습", detail: "옆선과 여유 있는 바지 폭" },
    ],
  },
  "4154917": {
    brand: "CORE DE", product: "헨리넥 니트",
    photos: [
      { file: "corede-henley-full.jpg", label: "전체 코디", detail: "데님과 함께 입은 편안한 분위기" },
      { file: "corede-henley-neck.jpg", label: "포인트", detail: "헨리넥 단추와 목선" },
    ],
  },
};

export function getPostPhotoSets(post: Post, products: Product[]): PhotoSet[] {
  let selectedIds: string[] = [];
  try { selectedIds = JSON.parse(post.productIds) as string[]; } catch { return []; }
  return selectedIds.flatMap((id) => {
    const product = products.find((item) => item.id === id);
    if (!product) return [];
    const match = canonicalProductUrl(product.url).match(/29cm\.co\.kr\/products\/(\d+)/);
    const set = match && photosByProduct[match[1]];
    return set ? [{ source: `https://www.29cm.co.kr/products/${match[1]}`, ...set }] : [];
  }).sort((left, right) => {
    const position = (source: string) => {
      const direct = post.body.indexOf(source);
      if (direct >= 0) return direct;
      const product = products.find((item) => canonicalProductUrl(item.url) === source);
      return product ? post.body.indexOf(originalProductUrl(product.url)) : -1;
    };
    return position(left.source) - position(right.source);
  });
}

export function PhotoSetView({ set, showHeading = true, showSource = true }: { set: PhotoSet; showHeading?: boolean; showSource?: boolean }) {
  return <section className="post-photo-set">
    {showHeading && <h4>{set.brand} <span>{set.product}</span></h4>}
    <div className="post-photo-grid">{set.photos.map((photo) => <figure key={photo.file}>
      <a href={`${imageRoot}/${photo.file}`} download={photo.file} aria-label={`${set.brand} ${set.product} ${photo.label} 사진 저장`}>
        <img src={`${imageRoot}/${photo.file}`} alt={`${set.brand} ${set.product} — ${photo.detail}`} loading="lazy" />
      </a>
      <CopyPhotoButton photo={photo} product={`${set.brand} ${set.product}`}/>
    </figure>)}</div>
    {showSource && <p className="post-photo-source">사진 출처 · <a href={set.source} target="_blank" rel="noopener noreferrer">29CM {set.brand} 상품 페이지 <span aria-hidden="true">↗</span></a></p>}
  </section>;
}

export function PostPhotoGallery({ post, products }: { post: Post; products: Product[] }) {
  const sets = getPostPhotoSets(post, products);
  if (!sets.length) return null;

  return <details className="post-photo-gallery" open>
    <summary>사진 포함 초안 · {sets.length}개 상품, {sets.length * 2}장</summary>
    <div className="post-photo-intro">사진을 눌러 한 장씩 저장하거나, <a href={`${imageRoot}/29cm-wishlist-photos-v2.zip`} download="29cm-wishlist-photos.zip">사진 10장과 출처 한 번에 받기 ↓</a></div>
    {sets.map((set) => <PhotoSetView set={set} key={set.source}/>) }
  </details>;
}
