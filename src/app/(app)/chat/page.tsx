"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { MessageSquare, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setIsPro(data.subscriptionTier === "pro");
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isPro) return;
    async function loadConversations() {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    }
    loadConversations();
  }, [isPro]);

  async function createConversation() {
    const res = await fetch("/api/conversations", { method: "POST" });
    if (res.ok) {
      const convo = await res.json();
      setConversations((prev) => [convo, ...prev]);
      setActiveConvoId(convo.id);
    }
  }

  async function startNewChat() {
    if (isPro) {
      await createConversation();
    } else {
      setActiveConvoId(null);
      // Force re-render by using a key change — handled via state
      window.location.reload();
    }
  }

  return (
    <div className="flex h-full -m-4 lg:-m-6">
      {/* Conversation sidebar (pro users) */}
      {isPro && (
        <div
          className={cn(
            "w-64 border-r bg-white flex-col",
            showHistory ? "flex" : "hidden lg:flex"
          )}
        >
          <div className="flex items-center justify-between border-b p-3">
            <h2 className="text-sm font-semibold text-slate-900">History</h2>
            <Button size="icon-xs" variant="ghost" onClick={startNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setActiveConvoId(convo.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  activeConvoId === convo.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{convo.title}</span>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="p-3 text-xs text-slate-400">No conversations yet</p>
            )}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile history toggle + new chat */}
        <div className="flex items-center justify-between border-b bg-white px-4 py-2 lg:hidden">
          {isPro && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHistory(!showHistory)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              History
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={startNewChat}>
            <Plus className="h-4 w-4 mr-1" />
            New Chat
          </Button>
        </div>

        {/* Free tier upgrade banner */}
        {!isPro && (
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-800 border-b border-amber-200">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              Chat history is not saved.{" "}
              <button className="font-medium underline hover:no-underline">
                Upgrade to Pro
              </button>{" "}
              to keep your conversations.
            </span>
          </div>
        )}

        <ChatInterface conversationId={activeConvoId} />
      </div>
    </div>
  );
}
