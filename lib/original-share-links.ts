// The user supplied these 29CM share URLs. Keep them in published drafts and
// outbound product links; canonical product URLs are only for internal matching.
const original29cmLinks: Record<string, string> = {
  "3453926": "https://29cm.onelink.me/1080201211/vdqsne0n",
  "4136488": "https://29cm.onelink.me/1080201211/qa5mx00j",
  "4121482": "https://29cm.onelink.me/1080201211/2fc36tv4",
  "3085362": "https://29cm.onelink.me/1080201211/fzbo36xt",
  "4154917": "https://29cm.onelink.me/1080201211/ic789ikg",
};

const productIdByShortCode = new Map(
  Object.entries(original29cmLinks).map(([productId, link]) => [link.split("/").at(-1), productId]),
);

export function canonicalProductUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "29cm.onelink.me") {
      const id = productIdByShortCode.get(url.pathname.split("/").at(-1));
      if (id) return `https://www.29cm.co.kr/products/${id}`;
    }
  } catch { /* Leave unknown links unchanged. */ }
  return value;
}

export function originalProductUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.hostname === "29cm.onelink.me") return value;
    if (url.hostname === "29cm.co.kr" || url.hostname.endsWith(".29cm.co.kr")) {
      const id = url.pathname.match(/^\/products\/(\d+)/)?.[1];
      if (id && original29cmLinks[id]) return original29cmLinks[id];
    }
  } catch { /* Leave unknown links unchanged. */ }
  return value;
}
