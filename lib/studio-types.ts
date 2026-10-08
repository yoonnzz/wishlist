export type Store = "29CM" | "무신사";
export type Product = {
  id: string; store: Store; brand: string; name: string; modelKey: string; color: string;
  url: string; note: string; reuseAllowed: boolean; usedInPostId: string | null; createdAt: string;
};
export type Post = {
  id: string; store: Store; title: string; body: string; status: "draft" | "done";
  productIds: string; createdAt: string; updatedAt: string;
};
export type Letter = {
  id: string; title: string; kicker: string; summary: string; body: string;
  sourceUrls: string; createdAt: string;
};
export type Preferences = { styleNotes: string; favoriteNotes: string; avoidedNotes: string };
export type StudioData = { products: Product[]; posts: Post[]; letters: Letter[]; preferences: Preferences | null; canEdit: boolean };

export async function loadStudio(): Promise<StudioData> {
  const response = await fetch("/api/studio", { cache: "no-store" });
  const value = await response.json() as StudioData & { error?: string };
  if (!response.ok) throw new Error(value.error || "자료를 불러오지 못했습니다.");
  return value;
}

export async function studioAction(action: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/studio", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const value = await response.json() as { error?: string; [key: string]: unknown };
  if (!response.ok) throw new Error(value.error || "저장하지 못했습니다.");
  return value;
}
