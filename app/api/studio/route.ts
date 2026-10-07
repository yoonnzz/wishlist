import { and, desc, eq, inArray } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { posts, preferences, products, trendLetters } from "../../../db/schema";

type Payload = Record<string, unknown>;
const clean = (value: unknown, max = 5000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const error = (message: string, status = 400) => Response.json({ error: message }, { status });
const storeName = (value: unknown) => value === "29CM" || value === "무신사" ? value : null;
const parseIds = (value: unknown) => Array.isArray(value) ? value.filter((id): id is string => typeof id === "string").slice(0, 12) : [];
const defaultPreferences = {
  styleNotes: "도입·상품 감상·맺음말은 한 줄에 문장 하나씩. 아주 짧은 문장 두 개만 자연스러울 때 한 줄에 함께 쓰기. 첫 번째 위시리스트 글처럼 친근한 존댓말과 짧은 구어체로 쓰기. 감탄(!, ?!), 말줄임표(...), ,,ㅎㅎ와 작은 이모지를 문맥에 맞게 자연스럽게 섞되 같은 표현을 반복하지 않기. 상품에 관심이 생긴 이유를 구체적으로 쓰기. 실제 구매·착용 경험은 제공된 사실만 사용하기.",
  favoriteNotes: "",
  avoidedNotes: "구매하거나 착용하지 않은 상품을 직접 써본 것처럼 말하지 않기. 확인되지 않은 가격이나 품절 여부를 단정하지 않기.",
};

function validShopUrl(value: string, store: "29CM" | "무신사") {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    return store === "29CM"
      ? hostname === "29cm.co.kr" || hostname.endsWith(".29cm.co.kr") || hostname === "29cm.onelink.me"
      : hostname === "musinsa.com" || hostname.endsWith(".musinsa.com");
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return error("로그인이 필요합니다.", 401);
  try {
    const db = getDb();
    const [productRows, postRows, letterRows, preferenceRows] = await Promise.all([
      db.select().from(products).where(eq(products.ownerId, user.userId)).orderBy(desc(products.createdAt)).limit(200),
      db.select().from(posts).where(eq(posts.ownerId, user.userId)).orderBy(desc(posts.createdAt)).limit(100),
      db.select().from(trendLetters).where(eq(trendLetters.ownerId, user.userId)).orderBy(desc(trendLetters.createdAt)).limit(50),
      db.select().from(preferences).where(eq(preferences.ownerId, user.userId)).limit(1),
    ]);
    return Response.json({ products: productRows, posts: postRows, letters: letterRows, preferences: preferenceRows[0] ?? defaultPreferences });
  } catch (cause) {
    console.error("studio load failed", cause);
    return error("자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return error("로그인이 필요합니다.", 401);
  let payload: Payload;
  try { payload = await request.json() as Payload; } catch { return error("요청 내용을 읽을 수 없습니다."); }
  const action = clean(payload.action, 40);
  const db = getDb();
  try {
    if (action === "product.add") {
      const store = storeName(payload.store);
      const brand = clean(payload.brand, 120);
      const name = clean(payload.name, 200);
      const model = clean(payload.model, 200);
      const color = clean(payload.color, 80);
      const url = clean(payload.url, 1000);
      const note = clean(payload.note, 1000);
      if (!store || !brand || !name || !model || !validShopUrl(url, store)) return error("쇼핑몰, 브랜드, 상품명, 모델명, 상품 링크를 확인해 주세요.");
      const modelKey = `${brand} ${model}`.normalize("NFKC").toLocaleLowerCase("ko-KR").replace(/[^\p{L}\p{N}]/gu, "");
      const prior = await db.select().from(products).where(and(eq(products.ownerId, user.userId), eq(products.modelKey, modelKey))).limit(10);
      if (prior.some((p) => p.usedInPostId) && payload.allowReuse !== true) return error("이미 위시리스트에 사용한 모델이에요. 다른 상품을 골라 주세요.", 409);
      if (prior.some((p) => p.store === store && p.url === url)) return error("이미 저장한 상품 링크예요.", 409);
      const [product] = await db.insert(products).values({ id: crypto.randomUUID(), ownerId: user.userId, store, brand, name, modelKey, color, url, note, reuseAllowed: payload.allowReuse === true }).returning();
      return Response.json({ product }, { status: 201 });
    }
    if (action === "post.create") {
      const store = storeName(payload.store);
      const title = clean(payload.title, 200);
      const body = clean(payload.body, 20000);
      const ids = [...new Set(parseIds(payload.productIds))];
      if (!store || !title || !body || !ids.length) return error("쇼핑몰, 제목, 본문, 상품을 입력해 주세요.");
      const selected = await db.select().from(products).where(and(eq(products.ownerId, user.userId), inArray(products.id, ids)));
      if (selected.length !== ids.length || selected.some((p) => p.store !== store)) return error("선택한 상품을 다시 확인해 주세요.");
      if (new Set(selected.map((p) => p.modelKey)).size !== selected.length) return error("같은 모델이 한 글에 여러 번 선택됐어요.", 409);
      const all = await db.select().from(products).where(eq(products.ownerId, user.userId));
      if (selected.some((p) => !p.reuseAllowed && all.some((old) => old.modelKey === p.modelKey && old.usedInPostId))) return error("이전에 사용한 모델이 포함되어 있습니다.", 409);
      const id = crypto.randomUUID();
      const statements = [
        env.DB!.prepare("INSERT INTO posts (id, owner_id, store, title, body, status, product_ids) VALUES (?, ?, ?, ?, ?, 'draft', ?)").bind(id, user.userId, store, title, body, JSON.stringify(ids)),
        ...selected.filter((p) => !all.some((old) => old.modelKey === p.modelKey && old.usedInPostId)).map((p) =>
          env.DB!.prepare("INSERT INTO used_models (owner_id, model_key, post_id) VALUES (?, ?, ?)").bind(user.userId, p.modelKey, id)),
        ...selected.map((p) => env.DB!.prepare("UPDATE products SET used_in_post_id = ? WHERE id = ? AND owner_id = ? AND used_in_post_id IS NULL").bind(id, p.id, user.userId)),
      ];
      await env.DB!.batch(statements);
      const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
      return Response.json({ post }, { status: 201 });
    }
    if (action === "post.update") {
      const id = clean(payload.id, 100);
      const title = clean(payload.title, 200);
      const body = clean(payload.body, 20000);
      const status = payload.status === "done" ? "done" : "draft";
      if (!id || !title || !body) return error("제목과 본문을 입력해 주세요.");
      const [post] = await db.update(posts).set({ title, body, status, updatedAt: new Date().toISOString() }).where(and(eq(posts.id, id), eq(posts.ownerId, user.userId))).returning();
      return post ? Response.json({ post }) : error("글을 찾을 수 없습니다.", 404);
    }
    if (action === "letter.add") {
      const title = clean(payload.title, 200);
      const kicker = clean(payload.kicker, 80) || "TREND NOTE";
      const summary = clean(payload.summary, 500);
      const body = clean(payload.body, 12000);
      const sourceUrls = Array.isArray(payload.sourceUrls) ? payload.sourceUrls.filter((item): item is string => typeof item === "string" && /^https:\/\//.test(item)).slice(0, 8) : [];
      if (!title || !summary || !body || !sourceUrls.length) return error("제목, 요약, 본문, 출처 링크를 입력해 주세요.");
      const [letter] = await db.insert(trendLetters).values({ id: crypto.randomUUID(), ownerId: user.userId, title, kicker, summary, body, sourceUrls: JSON.stringify(sourceUrls) }).returning();
      return Response.json({ letter }, { status: 201 });
    }
    if (action === "preferences.update") {
      const value = { styleNotes: clean(payload.styleNotes, 5000), favoriteNotes: clean(payload.favoriteNotes, 5000), avoidedNotes: clean(payload.avoidedNotes, 5000) };
      const [row] = await db.insert(preferences).values({ ownerId: user.userId, ...value }).onConflictDoUpdate({ target: preferences.ownerId, set: value }).returning();
      return Response.json({ preferences: row });
    }
    return error("지원하지 않는 작업입니다.");
  } catch (cause) {
    console.error("studio action failed", cause);
    return error("저장하지 못했습니다. 입력 내용을 보존한 채 다시 시도해 주세요.", 500);
  }
}
