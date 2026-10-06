import { GET as getStudio, POST as postStudio } from "../api/studio/route";

const tools = [
  {
    name: "read_wishlist_workspace",
    description: "Read this owner's saved 29CM/Musinsa products, prior wishlist drafts, trend letters, and voice preferences. Use before drafting to avoid repeating a model or inventing personal experience.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "save_wishlist_product",
    description: "Save one independently researched 29CM or Musinsa product before drafting. Check the live product page and brand/model identity first; prior models are rejected across stores unless the owner explicitly allowed reuse.",
    inputSchema: {
      type: "object",
      properties: {
        store: { type: "string", enum: ["29CM", "무신사"] },
        brand: { type: "string" },
        name: { type: "string" },
        model: { type: "string" },
        color: { type: "string" },
        url: { type: "string" },
        note: { type: "string" },
      },
      required: ["store", "brand", "name", "model", "url"],
      additionalProperties: false,
    },
  },
  {
    name: "save_wishlist_draft",
    description: "Save one researched wishlist draft for the selected store, using product IDs returned by read_wishlist_workspace or save_wishlist_product. Duplicate models are rejected.",
    inputSchema: {
      type: "object",
      properties: {
        store: { type: "string", enum: ["29CM", "무신사"] },
        title: { type: "string" },
        body: { type: "string" },
        productIds: { type: "array", items: { type: "string" }, minItems: 1 },
      },
      required: ["store", "title", "body", "productIds"],
      additionalProperties: false,
    },
  },
  {
    name: "save_trend_letter",
    description: "Save a source-backed fashion trend letter for the owner. Include working source URLs and distinguish reporting from your own editorial inference.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        kicker: { type: "string" },
        summary: { type: "string" },
        body: { type: "string" },
        sourceUrls: { type: "array", items: { type: "string" }, minItems: 1 },
      },
      required: ["title", "summary", "body", "sourceUrls"],
      additionalProperties: false,
    },
  },
];

export async function POST(request: Request) {
  let input: { id?: string | number; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };
  try { input = await request.json(); } catch { return Response.json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }, { status: 400 }); }
  if (input.method === "notifications/initialized") return new Response(null, { status: 202 });
  if (input.method === "initialize") return Response.json({
    jsonrpc: "2.0", id: input.id ?? null,
    result: { protocolVersion: "2025-03-26", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "my-picks-wishlist-studio", version: "1.0.0" } },
  });
  if (input.method === "tools/list") return Response.json({ jsonrpc: "2.0", id: input.id ?? null, result: { tools } });
  if (input.method !== "tools/call") return Response.json({ jsonrpc: "2.0", id: input.id ?? null, error: { code: -32601, message: "Method not found" } }, { status: 404 });

  const name = input.params?.name;
  const args = input.params?.arguments ?? {};
  let response: Response;
  if (name === "read_wishlist_workspace") response = await getStudio();
  else if (name === "save_wishlist_product") response = await postStudio(new Request(request.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "product.add", ...args, allowReuse: false }) }));
  else if (name === "save_wishlist_draft") response = await postStudio(new Request(request.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "post.create", ...args }) }));
  else if (name === "save_trend_letter") response = await postStudio(new Request(request.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "letter.add", ...args }) }));
  else return Response.json({ jsonrpc: "2.0", id: input.id ?? null, error: { code: -32602, message: "Unknown tool" } }, { status: 400 });
  const value = await response.json();
  if (response.status === 401 || response.status === 403) {
    return Response.json({ jsonrpc: "2.0", id: input.id ?? null, error: { code: -32001, message: "Unauthorized" } }, { status: response.status });
  }
  return Response.json({
    jsonrpc: "2.0", id: input.id ?? null,
    result: { content: [{ type: "text", text: JSON.stringify(value) }], isError: !response.ok },
  });
}
