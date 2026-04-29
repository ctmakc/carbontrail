"use client";
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, Loader2, TreePine, User, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Who are the top 5 climate funding recipients?",
  "Show me the biggest lobby-funding loops",
  "Which provinces get the most climate grants?",
  "What are the top climate programs?",
  "Tell me about NextStar Energy",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that request. Please try again.", timestamp: new Date() }]);
    }
    setLoading(false);
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-3rem)] max-w-[900px] mx-auto">
        {/* Header */}
        <div className="p-6 pb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-emerald-50">Climate Data Chat</h1>
            <p className="text-xs text-emerald-400/60">Ask questions about $321B+ in Canadian climate spending</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <TreePine className="h-16 w-16 mx-auto mb-4 text-emerald-800" />
                <p className="text-emerald-400/50 text-sm">Ask me anything about Canadian climate spending</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-3 py-2 rounded-xl border border-emerald-800/30 text-xs text-emerald-500/60 hover:text-emerald-400 hover:border-emerald-600/30 hover:bg-emerald-500/5 transition-all text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <Card className={`max-w-[80%] ${msg.role === "user" ? "bg-emerald-900/30 border-emerald-700/30" : "bg-[#0a1210] border-emerald-900/20"}`}>
                <CardContent className="p-3">
                  <div className="text-sm text-emerald-100/90 leading-relaxed whitespace-pre-wrap prose-sm prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-300">$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                  <p className="text-[9px] text-emerald-700 mt-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800/30 text-emerald-500">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <Card className="bg-[#0a1210] border-emerald-900/20">
                <CardContent className="p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-bounce" style={{animationDelay: "0ms"}} />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-bounce" style={{animationDelay: "150ms"}} />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-bounce" style={{animationDelay: "300ms"}} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-emerald-900/20">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about climate spending, recipients, lobby patterns..."
              className="flex-1 rounded-xl border border-emerald-800/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100 placeholder:text-emerald-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-500 disabled:opacity-30 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
