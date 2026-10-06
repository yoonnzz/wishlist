type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => Promise<unknown>;
};
type Context = { registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void> };

export function registerWebMcpTool(tool: Tool) {
  const context = (document as Document & { modelContext?: Context }).modelContext;
  if (!context?.registerTool) return () => {};
  const controller = new AbortController();
  try { void Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(console.error); }
  catch (error) { console.error("WebMCP registration failed", error); }
  return () => controller.abort();
}
