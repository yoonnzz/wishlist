import type { Store } from "./studio-types";

export type TasteProductInfo = {
  store: Store;
  brand: string;
  name: string;
  model: string;
  color: string;
  productUrl: string;
  imageUrl: string;
};

function storeForUrl(url: URL): Store | null {
  if (url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase();
  if (host === "29cm.co.kr" || host.endsWith(".29cm.co.kr") || host === "29cm.onelink.me") return "29CM";
  if (host === "musinsa.com" || host.endsWith(".musinsa.com") || host === "musinsa.onelink.me") return "무신사";
  return null;
}

function decodeHtml(value: string) {
  return value.replace(/&(#(?:x[0-9a-f]+|[0-9]+)|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity: string) => {
    const key = entity.toLowerCase();
    if (key.startsWith("#")) {
      const code = key.startsWith("#x") ? Number.parseInt(key.slice(2), 16) : Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return ({ amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " } as Record<string, string>)[key] ?? match;
  }).replace(/\s+/g, " ").trim();
}

function attributes(tag: string) {
  const values: Record<string, string> = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    values[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return values;
}

function metadata(html: string) {
  const values: Record<string, string> = {};
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const key = (attrs.property || attrs.name || "").toLowerCase();
    if (key && attrs.content) values[key] = attrs.content;
  }
  return values;
}

function jsonLdProduct(html: string): Record<string, unknown> | null {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attributes(match[1]).type !== "application/ld+json") continue;
    try {
      const parsed: unknown = JSON.parse(match[2]);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== "object") continue;
        const graph = "@graph" in candidate && Array.isArray(candidate["@graph"]) ? candidate["@graph"] : [candidate];
        const product = graph.find((item: unknown) => item && typeof item === "object" && "@type" in item && (item["@type"] === "Product" || (Array.isArray(item["@type"]) && item["@type"].includes("Product"))));
        if (product) return product as Record<string, unknown>;
      }
    } catch { /* Invalid merchant data is ignored. */ }
  }
  return null;
}

function string(value: unknown) { return typeof value === "string" ? decodeHtml(value) : ""; }
function imageFromProduct(value: unknown) {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first === "string") return first;
  if (first && typeof first === "object") return string("contentUrl" in first ? first.contentUrl : "url" in first ? first.url : "");
  return "";
}
function safeImageUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase();
    return host === "img.29cm.co.kr" || host.endsWith(".29cm.co.kr") || host === "image.msscdn.net" || host.endsWith(".msscdn.net") || host.endsWith(".musinsa.com") ? url.toString() : "";
  } catch { return ""; }
}

export function extractTasteFromHtml(html: string, productUrl: string): TasteProductInfo {
  const url = new URL(productUrl);
  const store = storeForUrl(url);
  if (!store || !/^\/(?:products|app\/goods)\/\d+/.test(url.pathname)) throw new Error("29CM 또는 무신사 상품 링크를 넣어 주세요.");
  const meta = metadata(html);
  const ld = jsonLdProduct(html);
  const id = url.pathname.match(/\/(\d+)(?:\/|$)/)?.[1] ?? "";
  let brand = "";
  let name = "";
  let model = "";
  let color = "";
  if (store === "29CM") {
    const ldBrand = ld?.brand;
    brand = string(ldBrand && typeof ldBrand === "object" && "name" in ldBrand ? ldBrand.name : ldBrand) || (meta["og:description"] || meta.description || "").match(/^([^()]{1,80})\([^)]+\)\s/)?.[1]?.trim() || "";
    name = string(ld?.name) || (meta["og:title"] || "").replace(/\s+-\s+감도 깊은.*$/, "").trim();
    model = string(ld?.sku) || id;
    color = name.match(/\(([^()]{2,50})\)\s*$/)?.[1]?.trim() ?? "";
  } else {
    const description = meta["og:description"] || meta.description || "";
    const title = (meta["og:title"] || meta["twitter:title"] || "").replace(/\s+-\s+(?:사이즈|무신사).*$/, "").trim();
    const brandFromDescription = description.match(/브랜드\s*:\s*([^\s]+(?:\([^)]*\))?)/)?.[1] ?? "";
    brand = (brandFromDescription || title.match(/^([^\s]+\([^)]*\))/)?.[1] || "").replace(/\([^)]*\)$/, "").trim();
    const rawName = brandFromDescription && title.startsWith(brandFromDescription) ? title.slice(brandFromDescription.length).trim() : title.replace(/^[^\s]+\([^)]*\)\s*/, "").trim();
    model = rawName.match(/\[([^\]]+)\]/)?.[1] || description.match(/제품번호\s*:\s*([^\s]+)/)?.[1] || id;
    color = rawName.match(/\]-\s*([^\[\]]+)$/)?.[1]?.trim() || rawName.match(/\(([^()]{2,50})\)\s*$/)?.[1]?.trim() || "";
    name = rawName.replace(/\[[^\]]+\](?:-\s*[^\[\]]+)?$/, "").trim();
  }
  if (!brand || !name || !model) throw new Error("상품 정보를 확인하지 못했어요. 다른 상품 링크로 다시 시도해 주세요.");
  const imageUrl = safeImageUrl(imageFromProduct(ld?.image) || meta["og:image"] || "");
  return { store, brand: brand.slice(0, 120), name: name.slice(0, 200), model: model.slice(0, 200), color: color.slice(0, 80), productUrl: `${url.origin}${url.pathname}`, imageUrl };
}

async function readLimitedHtml(response: Response) {
  if (!(response.headers.get("content-type") || "").toLowerCase().includes("text/html")) throw new Error("상품 페이지를 읽을 수 없어요.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("상품 페이지를 읽을 수 없어요.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.byteLength;
    if (size > 1_200_000) { await reader.cancel(); throw new Error("상품 페이지가 너무 커서 읽을 수 없어요."); }
    chunks.push(result.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

export async function inspectTasteProduct(rawUrl: string, fetchPage: typeof fetch = fetch) {
  let current: URL;
  try { current = new URL(rawUrl); } catch { throw new Error("상품 링크를 확인해 주세요."); }
  const expectedStore = storeForUrl(current);
  if (!expectedStore) throw new Error("29CM 또는 무신사 상품 링크를 넣어 주세요.");
  for (let attempt = 0; attempt < 5; attempt++) {
    if (storeForUrl(current) !== expectedStore) throw new Error("상품 링크가 다른 사이트로 이동했어요.");
    let response: Response;
    try {
      response = await fetchPage(current.toString(), { redirect: "manual", signal: AbortSignal.timeout(9000), headers: { Accept: "text/html,application/xhtml+xml", "Accept-Language": "ko-KR,ko;q=0.9" } });
    } catch { throw new Error("상품 페이지에 연결하지 못했어요. 잠시 후 다시 시도해 주세요."); }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("상품 링크의 이동 경로를 확인하지 못했어요.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error("상품 페이지를 열 수 없어요. 공개된 상품 링크인지 확인해 주세요.");
    return extractTasteFromHtml(await readLimitedHtml(response), current.toString());
  }
  throw new Error("상품 링크가 여러 번 이동해 정보를 확인하지 못했어요.");
}
