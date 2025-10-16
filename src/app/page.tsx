"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  // messages will be a simple array of objects with role and text
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "Upstream error");
      }

      const { output } = await res.json();
      setMessages((m) => [...m, { role: "assistant", text: output || "(no response)" }]);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="w-full max-w-2xl bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-2xl shadow-lg p-8">
        <header className="mb-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-[#14a1ff] via-[#963bff] to-[#ff40ef]">
            Gemini Chatbot
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Ask your questions here — our assistant will reply promptly and
            professionally.
          </p>
        </header>

        <main>
          <div className="space-y-4 mb-6">
            {messages.length === 0 ? (
              <div className="px-4 py-6 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                No messages yet. Start by asking a question below.
              </div>
            ) : (
              <ul className="space-y-3 max-h-60 overflow-auto">
                {messages.map((m, i) => (
                  <li key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`px-4 py-3 rounded-lg max-w-[80%] ${
                        m.role === "user"
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                          : "bg-white/80 dark:bg-black/60 text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      {m.text}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={send} className="flex gap-3 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your questions here"
              className="flex-1 px-5 py-3 rounded-full border border-gray-200 dark:border-gray-700 focus:outline-none transition"
              aria-label="Ask your questions here"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black hover:bg-gray-100 border border-gray-200 dark:bg-white dark:text-black dark:border-gray-200 transition-shadow shadow-sm disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}
        </main>
      </div>
    </div>
  );
}
