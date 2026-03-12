"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { Shield, Sparkles } from "lucide-react";

interface ChatInterfaceProps {
  conversationId?: string | null;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId },
    }),
  });

  const isLoading = status !== "ready";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function getMessageText(message: typeof messages[number]): string {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("");
  }

  function handleSend(text: string) {
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              How can I help with your claim?
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Ask me anything about insurance claims, coverage questions,
              documentation, or next steps.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                "What should I document after property damage?",
                "How do I file a homeowner's insurance claim?",
                "What does 'actual cash value' mean?",
                "When should I hire a public adjuster?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Sparkles className="h-3 w-3 shrink-0 text-blue-500" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role as "user" | "assistant"}
              content={getMessageText(msg)}
            />
          ))
        )}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
            <div className="rounded-xl bg-slate-100 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t bg-white p-4">
        <ChatInput onSend={handleSend} disabled={isLoading} />
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Claim Sage provides informational guidance, not legal advice.
        </p>
      </div>
    </div>
  );
}
