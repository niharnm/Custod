import { afterEach, describe, expect, it, vi } from "vitest";
import { applyOptionalAiWording } from "@/lib/ai";
import { analyzeWithRules } from "@/lib/scoring";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("AI wording is opt-in", () => {
  it("sends nothing to any provider when no key is configured", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const input = { tabs: [{ title: "Docs", url: "https://example.com/a" }] } as never;
    const rules = analyzeWithRules(input);
    const out = await applyOptionalAiWording(input, rules);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(out).toEqual(rules);
  });
});
