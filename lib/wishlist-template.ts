import type { Product, Store } from "./studio-types";

export const WISHLIST_TEMPLATE_STEPS = [
  "짧은 인사와 이번 위시리스트의 주제",
  "상품마다 브랜드·상품명 → 사진 2장 → 짧은 감상 → 상품 링크·사진 출처",
  "가벼운 맺음말과 관련 태그",
] as const;

export function makeWishlistDraft(store: Store, products: Product[]) {
  return {
    title: `${store}에서 찾은 요즘 위시리스트🤍`,
    body: [
      "안녕하세요",
      `오늘은 ${store}에서 눈여겨보고 있는 아이템들을 모아봤어요.`,
      "",
      ...products.flatMap((item) => [
        item.brand,
        `${item.name}${item.color ? ` (${item.color})` : ""}`,
        "",
        item.note || "[색·핏·디테일 중 마음에 든 이유와 입고 싶은 장면을 자연스럽게 적어주세요]",
        item.url,
        "",
      ]),
      "이번 위시리스트에서 가장 마음에 드는 아이템은 어떤 건가요? 🤍",
    ].join("\n"),
  };
}
