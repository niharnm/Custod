import type { AnalyzeBurnoutRequest, AnalyzeBurnoutResponse } from "@/lib/types";
import { z } from "zod";

// Shared Groq key bundled with Custod so AI reasoning works out of the box on
// every install — no one has to bring their own key. `GROQ_API_KEY` in the
// environment (e.g. a Vercel project var) always takes precedence and is the
// right place to override or rotate this without a code change.
//
// SECURITY: this is a real secret living in source control. It is exposed to
// anyone with repo access and to GitHub secret scanning, which may auto-revoke
// it. Rotate it (here + macOS AIConfig + Vercel) before any public launch, and
// prefer moving it to a server-only env var when you can. The key is only ever
// used server-side in these route handlers — it is never sent to the browser,
// extension, or native clients.
const DEFAULT_GROQ_API_KEY = "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";

/** Resolved Groq key: environment override first, then the bundled default. */
export const GROQ_API_KEY = process.env.GROQ_API_KEY || DEFAULT_GROQ_API_KEY;

const wordingSchema = z.object({
  oneSentenceExplanation: z.string().min(20).max(300),
  patternExplanation: z.string().min(40).max(800),
  shareSummary: z.string().min(20).max(500),
  aiReasoning: z.array(z.string().min(5).max(200)).max(6).default([]),
});

type WordingResult = z.infer<typeof wordingSchema>;

/**
 * Layer a real reasoning pass on top of the deterministic rules result.
 *
 * The numbers (score, status, riskBreakdown, reset plan, tab grouping) stay
 * exactly as the rules engine computed them — that keeps the verdict
 * transparent and reproducible. What the model adds is *judgement*: it weighs
 * the factors against each other and explains, in plain language, why this
 * particular mix of tabs, mood, and time pressure reads as strained (or not),
 * rather than assuming "lots of tabs = stressed". If no provider is configured
 * or the call fails, we fall back to the rules wording untouched.
 */
export async function applyOptionalAiWording(
  input: AnalyzeBurnoutRequest,
  rules: AnalyzeBurnoutResponse
): Promise<AnalyzeBurnoutResponse> {
  const wording = await analyzeWithAI(input, rules);
  if (!wording || !isSafeWording(wording)) return rules;

  return {
    ...rules,
    oneSentenceExplanation: wording.oneSentenceExplanation,
    patternExplanation: wording.patternExplanation,
    shareSummary: wording.shareSummary,
    aiReasoning: wording.aiReasoning,
  };
}

async function analyzeWithAI(
  input: AnalyzeBurnoutRequest,
  rules: AnalyzeBurnoutResponse
): Promise<WordingResult | null> {
  if (GROQ_API_KEY) return callGroq(input, rules);
  if (process.env.OPENAI_API_KEY) return callOpenAI(input, rules);
  if (process.env.GEMINI_API_KEY) return callGemini(input, rules);
  return null;
}

/**
 * Groq exposes an OpenAI-compatible chat-completions API, so the request shape
 * mirrors callOpenAI. Llama 3.3 70B is fast and supports JSON-object mode.
 */
async function callGroq(input: AnalyzeBurnoutRequest, rules: AnalyzeBurnoutResponse) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: JSON.stringify(safePayload(input, rules)) },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return parseWording(data.choices?.[0]?.message?.content);
  } catch {
    return null;
  }
}

async function callOpenAI(input: AnalyzeBurnoutRequest, rules: AnalyzeBurnoutResponse) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: JSON.stringify(safePayload(input, rules)) },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return parseWording(data.choices?.[0]?.message?.content);
  } catch {
    return null;
  }
}

async function callGemini(input: AnalyzeBurnoutRequest, rules: AnalyzeBurnoutResponse) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt()}\n\n${JSON.stringify(safePayload(input, rules))}` }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return parseWording(data.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch {
    return null;
  }
}

/**
 * Everything the model is allowed to see. Titles and URLs only — never page
 * contents — plus the optional check-in and the full deterministic breakdown so
 * the model reasons *about* the factors instead of inventing its own numbers.
 */
function safePayload(input: AnalyzeBurnoutRequest, rules: AnalyzeBurnoutResponse) {
  return {
    tabs: input.tabs.map((tab) => ({ title: tab.title, url: tab.url, active: tab.active })),
    tabCount: input.tabs.length,
    goal: input.goal,
    moodCheckIn: input.moodCheckIn,
    timeRemaining: input.timeRemaining,
    deterministicResult: {
      status: rules.status,
      score: rules.score,
      statusLabel: rules.statusLabel,
      mainPattern: rules.mainPattern,
      riskBreakdown: rules.riskBreakdown,
      tabGroups: rules.tabGroups?.map((group) => ({ name: group.name, count: group.tabs.length })),
      currentExplanation: rules.oneSentenceExplanation,
    },
  };
}

function parseWording(raw?: string): WordingResult | null {
  if (!raw) return null;
  try {
    const parsed = wordingSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function isSafeWording(wording: WordingResult): boolean {
  const text = [
    wording.oneSentenceExplanation,
    wording.patternExplanation,
    wording.shareSummary,
    ...wording.aiReasoning,
  ]
    .join(" ")
    .toLowerCase();
  return ![
    "diagnose",
    "diagnosis",
    "clinical",
    "therapy",
    "therapist",
    "depression",
    "anxiety",
    "adhd",
    "danger",
    "crisis",
    "emergency",
    "you are burned out",
    "mental health score",
  ].some((term) => text.includes(term));
}

function systemPrompt(): string {
  return [
    "You are Custod's reasoning layer. You receive a deterministic browser-pattern",
    "analysis (score, status, per-factor risk breakdown) plus the raw tabs, the",
    "user's optional mood check-in, goal, and time remaining. Your job is to think",
    "through WHY this specific combination of signals reads the way it does — not to",
    "assume 'many tabs = stressed'. Weigh the factors against each other: a focused",
    "30-tab research session with calm mood is different from 12 tabs split across",
    "distractions with high time pressure. Look for what actually drives the status:",
    "the mix of categories, deadline + distraction overlap, mood vs. load mismatch,",
    "and any recovery signals that pull it down.",
    "",
    "Return STRICT JSON only with these keys:",
    "- oneSentenceExplanation: the single clearest reason for this status, grounded",
    "  in the actual tabs/mood, written to the user as 'you'.",
    "- patternExplanation: 2-4 sentences explaining the reasoning across multiple",
    "  factors and what would change the picture.",
    "- shareSummary: a neutral one-line summary safe to share.",
    "- aiReasoning: 2-5 short evidence-based reasons (each its own factor, e.g.",
    "  'High time pressure with 4 deadline tabs open at once'). Concrete observations,",
    "  not chain-of-thought.",
    "",
    "Rules: Do NOT change the score, status, riskBreakdown, reset plan, or tab",
    "grouping — explain them, don't override them. If the deterministic status is",
    "green, your reasoning must reflect that it looks bounded, not strained. Use",
    "browser-pattern and focus framing, never medical, therapy, diagnostic, panic,",
    "certainty, or shame language. Never read or reference page contents.",
  ].join("\n");
}
