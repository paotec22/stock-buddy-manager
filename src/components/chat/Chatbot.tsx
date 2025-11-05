import React, { useEffect, useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  id: string;
  from: "user" | "bot";
  text: string;
};

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Draggable state for mobile
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        from: "bot",
        text: "Hi! I'm your SI Manager assistant. Ask me anything about inventory, sales, expenses, invoices, or reports."
      }
    ]);
  }, []);

  const streamChat = async (userMessage: string) => {
    const allMessages = [...messages, { id: Date.now().toString(), from: "user" as const, text: userMessage }];
    
    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("You must be logged in to use the assistant");
      }

      const CHAT_URL = `https://itycbazttpidqlgmmrot.supabase.co/functions/v1/chat-agent`;
      
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: allMessages.map(m => ({ 
            role: m.from === "user" ? "user" : "assistant", 
            content: m.text 
          }))
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Failed to start stream: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantText = "";

      // Add empty assistant message
      const assistantId = Date.now().toString() + "-bot";
      setMessages(prev => [...prev, { id: assistantId, from: "bot", text: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantText += content;
              setMessages(prev => 
                prev.map(m => m.id === assistantId ? { ...m, text: assistantText } : m)
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString() + "-error", 
        from: "bot", 
        text: "Sorry, I encountered an error. Please try again." 
      }]);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    
    const userMsg = { id: Date.now().toString(), from: "user" as const, text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await streamChat(text);
    setLoading(false);
  };

  // Dragging handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    e.preventDefault();
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 64;
    
    setPosition({
      x: Math.max(-window.innerWidth / 2 + 32, Math.min(newX, maxX - window.innerWidth / 2 + 32)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div>
      {/* Floating button - draggable on mobile */}
      <div 
        ref={buttonRef}
        className="fixed z-50 pointer-events-none"
        style={isMobile ? {
          left: '50%',
          bottom: '1rem',
          transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        } : {
          right: '1.5rem',
          bottom: '1.5rem'
        }}
      >
        <div className="pointer-events-auto">
          {!open ? (
            <button
              aria-label="Open assistant"
              onClick={() => setOpen(true)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-elegant hover:shadow-glow transition-all active:scale-95"
              style={{ touchAction: 'none' }}
            >
              <span className="text-2xl">💬</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed z-50 right-4 bottom-20 md:bottom-6 md:right-6 left-4 md:left-auto flex justify-center md:justify-end">
          <div className="w-[92vw] md:w-96 max-w-md">
            <div className="flex flex-col bg-card border border-border rounded-lg shadow-elegant overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <strong className="text-foreground">SI Manager Assistant</strong>
                </div>
                <button 
                  aria-label="Close assistant" 
                  onClick={() => setOpen(false)} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 h-80 overflow-y-auto bg-background/50" aria-live="polite">
                {messages.map(m => (
                  <div key={m.id} className={`mb-3 ${m.from === "user" ? "text-right" : "text-left"}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-[85%] ${
                      m.from === "user" 
                        ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground" 
                        : "bg-muted text-foreground"
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">{m.text}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="text-left mb-3">
                    <div className="inline-block p-3 rounded-lg bg-muted">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-border bg-card">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                    placeholder="Ask about inventory, sales, expenses..."
                    className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={loading}
                  />
                  <button 
                    onClick={handleSend} 
                    disabled={loading || !input.trim()} 
                    className="px-4 py-2 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-glow transition-all"
                  >
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
