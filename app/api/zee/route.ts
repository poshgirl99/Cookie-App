import { NextRequest, NextResponse } from "next/server";

const SYSTEM = `You are Coco, the built-in personal assistant for Cookie, a youthful social app. Your personality adapts naturally: warm, funny, playful and slightly cheeky in casual moments; calm and supportive when needed; smart and polished for serious questions. Be concise and natural. Help with questions, brainstorming and everyday needs. You may discuss how to use Cookie, but never pretend you performed an in-app action unless the app explicitly supplied a tool result saying it happened. Respect privacy. For sensitive or consequential actions, say that Coco will ask for confirmation before acting. If asked about current information and no web result is supplied, be transparent that live web search is not connected in this version yet.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();
    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ reply: "I’m awake, but my AI connection hasn’t been switched on yet. Once it is, you’ll be able to talk to me properly right here." });
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.ZEE_AI_MODEL || "gpt-5-mini", instructions: SYSTEM, input: [...history.map((m: {role:string;text:string}) => ({ role: m.role === "zee" || m.role === "coco" ? "assistant" : "user", content: m.text })), { role: "user", content: String(message || "") }], max_output_tokens: 500 })
    });
    if (!response.ok) return NextResponse.json({ reply: "My connection stumbled for a second. Try me again?" }, { status: 200 });
    const data = await response.json();
    const reply = data.output_text || data.output?.flatMap((o: {content?: {text?: string}[]}) => o.content || []).map((c: {text?:string}) => c.text || "").join("") || "I’m here.";
    return NextResponse.json({ reply });
  } catch { return NextResponse.json({ reply: "Something went sideways for a second. Try me again?" }); }
}
