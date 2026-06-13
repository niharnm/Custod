import type { AnalyzeBurnoutRequest, AnalyzeBurnoutResponse } from "@/lib/types";
import { z } from "zod";

const wordingSchema = z.object({
  oneSentenceExplanation: z.string().min(20).max(300),
  patternExplanation: z.string().min(40).max(800),
  shareSummary: z.string().min(20).max(500),
  aiReasoning: z.array(z.string().min(5).max(160)).max(5).default([]),
});

type WordingResult = z.infer<typeof wordingSchema>;

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
  if (process.env.OPENAI_API_KEY) return callOpenAI(input, rules);
  if (process.env.GEMINI_API_KEY) return callGemini(input, rules);
  return null;
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
        temperature: 0.2,
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
            temperature: 0.2,
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

function safePayload(input: AnalyzeBurnoutRequest, rules: AnalyzeBurnoutResponse) {
  return {
    tabs: input.tabs.map((tab) => ({ title: tab.title, url: tab.url, active: tab.active })),
    goal: input.goal,
    moodCheckIn: input.moodCheckIn,
    timeRemaining: input.timeRemaining,
    deterministicResult: {
      status: rules.status,
      score: rules.score,
      statusLabel: rules.statusLabel,
      mainPattern: rules.mainPattern,
      riskBreakdown: rules.riskBreakdown,
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
    "You rewrite Custod browser-pattern analysis as strict JSON only.",
    "Do not change score, status, riskBreakdown, reset plan, or tab grouping.",
    "Use browser-pattern framing, not medical, therapy, diagnostic, certainty, panic, or shame language.",
    "Return JSON with oneSentenceExplanation, patternExplanation, shareSummary, aiReasoning.",
    "aiReasoning must be short evidence notes, not chain-of-thought.",
  ].join(" ");
}
