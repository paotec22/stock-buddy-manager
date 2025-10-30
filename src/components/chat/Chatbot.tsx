import React, { useEffect, useMemo, useState } from "react";
import siteContent from "../../data/siteContent.json";

type Message = {
  id: string;
  from: "user" | "bot";
  text: string;
};

function scoreContent(query: string, text: string) {
  if (!query) return 0;
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const t of tokens) {
    if (text.toLowerCase().includes(t)) score += 1;
  }
  return score;
}

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const contentIndex = useMemo(() => siteContent as Array<any>, []);

  useEffect(() => {
    // welcome message
    setMessages([
      {
        id: "welcome",
        from: "bot",
        text: "Hi — ask me about the app (inventory, bulk upload, invoices, totals) and I'll answer with snippets from the app."
      }
    ]);
  }, []);

  const appendMessage = (m: Message) => setMessages(prev => [...prev, m]);

  const retrieve = (query: string) => {
    // simple keyword match ranking
    const scored = contentIndex
      .map(item => ({ item, score: scoreContent(query, (item.title || "") + " " + (item.content || "")) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return scored.map(s => ({ title: s.item.title, source: s.item.source, snippet: s.item.content }));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    appendMessage({ id: Date.now().toString(), from: "user", text });
    setInput("");
    setLoading(true);

    // retrieve relevant snippets
    const results = retrieve(text);

    let reply = "";
    if (results.length === 0) {
      reply = "I couldn't find an exact match in the app content. Try asking about inventory, bulk upload, invoices or totals.";
    } else {
      reply = results
        .map((r, i) => `Source: ${r.title} (${r.source})\n${r.snippet}`)
        .join("\n\n---\n\n");
    }

    // small delay to mimic thinking
    await new Promise(res => setTimeout(res, 250));
    appendMessage({ id: Date.now().toString() + "-bot", from: "bot", text: reply });
    setLoading(false);
    // keep open on send
    setOpen(true);
  };

  return (
    <div>
      {/* Floating placeholder button - bottom-right on desktop, centered on small screens */}
      <div className="fixed z-50 right-4 bottom-4 md:bottom-6 md:right-6 left-0 md:left-auto flex justify-center md:justify-end pointer-events-none">
        <div className="pointer-events-auto">
          {!open ? (
            <button
              aria-label="Open assistant"
              onClick={() => setOpen(true)}
              className="bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg focus:outline-none"
            >
              <span className="text-xl">💬</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed z-50 right-4 bottom-20 md:bottom-6 md:right-6 left-4 md:left-auto flex justify-center md:justify-end">
          <div className="w-[92vw] md:w-96 max-w-md">
            <div className="flex flex-col bg-white border rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
                <strong>Assistant</strong>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Local app knowledge</span>
                  <button aria-label="Close assistant" onClick={() => setOpen(false)} className="ml-2 text-gray-500 hover:text-gray-800">
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-3 h-64 overflow-y-auto" aria-live="polite">
                {messages.map(m => (
                  <div key={m.id} className={`mb-3 ${m.from === "user" ? "text-right" : "text-left"}`}>
                    <div className={`inline-block p-2 rounded ${m.from === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}>
                      <pre className="whitespace-pre-wrap text-sm">{m.text}</pre>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                    placeholder="Ask about the app..."
                    className="flex-1 border rounded px-2 py-1 text-sm"
                  />
                  <button onClick={handleSend} disabled={loading} className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-50">
                    {loading ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
