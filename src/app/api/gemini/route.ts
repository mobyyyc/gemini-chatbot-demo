import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

type ReqBody = {
  prompt: string;
  model?: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set in environment" }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const { prompt, model } = (await request.json()) as ReqBody;

    const modelName = model || process.env.GEMINI_MODEL || "text-bison-001";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { temperature: 0.2, maxOutputTokens: 512 },
    });

    // Extract text safely
    let output = "";
    if (typeof response?.text === "string") output = response.text;
    else if (Array.isArray(response?.candidates) && response.candidates.length > 0) {
      const first = response.candidates[0];
      if (Array.isArray(first.content) && first.content.length > 0 && typeof first.content[0].text === "string") {
        output = first.content[0].text;
      }
    } else {
      try {
        output = JSON.stringify(response);
      } catch {
        output = String(response);
      }
    }

    return NextResponse.json({ output, raw: response });
  } catch (err: any) {
    // Enhanced debug: log error details server-side (local only)
    try {
      console.error("Gemini SDK error:", {
        name: err?.name,
        message: err?.message,
        status: err?.status,
        stack: err?.stack,
        response: err?.response,
      });
    } catch (logErr) {
      console.error("Error logging Gemini error:", String(logErr));
    }

    // Build a compact details message without leaking secrets
    let details = "";
    if (err?.status) details += `status=${err.status}; `;
    if (err?.message) details += `message=${err.message}; `;
    if (err?.response) {
      try {
        details += `response=${JSON.stringify(err.response)}; `;
      } catch {
        details += `response=${String(err.response)}; `;
      }
    }

    const status = err?.status || 500;

    // If model not found, give a helpful hint (SDK may expose a listModels or models.list method depending on version)
    if (status === 404) {
      details +=
        "Hint: models/text-bison-001 is not available for your API version. Call the SDK's model-listing API (e.g. ai.models.list or ai.models.listModels) or check the Google AI Studio/Vertex console to see available models and methods.; ";
    }

    if (!details) details = String(err);
    return NextResponse.json({ error: "upstream error", details }, { status });
  }
}
