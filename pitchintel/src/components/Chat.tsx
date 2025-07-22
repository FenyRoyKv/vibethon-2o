import { useEffect, useState } from "react";
import { conversationStorage } from "../utils/conversationStorage";

type Message = { role: "user" | "vc"; content: string };

type VC = {
  avatar: string;
  name: string;
  systemPrompt: string;
};

interface ChatProps {
  vc: VC;
  slideAnalysis?: string;
}

export function Chat({ vc, slideAnalysis }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    // Ask first question when chat initializes
    if (messages.length === 0) {
      askNextQuestion([]);
    }
  }, []);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      conversationStorage.saveConversation(
        conversationId,
        vc.name,
        messages,
        vc.systemPrompt
      );
    }
  }, [conversationId, messages, vc.name, vc.systemPrompt]);

  const askNextQuestion = async (history: Message[]) => {
    setLoading(true);

    // Create context-aware system prompt that includes slide analysis if available
    const contextualSystemPrompt = slideAnalysis
      ? `${vc.systemPrompt}\n\nBased on the pitch deck analysis:\n${slideAnalysis}\n\nAsk tough, specific questions about the weaknesses and red flags identified in the analysis.`
      : vc.systemPrompt;

    // For the first message, we don't need to send user messages since there are none yet
    const messagesToSend =
      history.length === 0
        ? []
        : [
            ...history.map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
            })),
          ];

    // If this is the first question and we have slide analysis, add initial context
    const initialPrompt =
      history.length === 0 && slideAnalysis
        ? "I just presented my pitch deck. Based on your analysis, what's your biggest concern about my business?"
        : undefined;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesToSend,
          temperature: 0.8,
          conversationId,
          systemPrompt: contextualSystemPrompt,
          initialPrompt,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat failed: ${res.statusText}`);
      }

      const data = await res.json();
      const content = data.content;
      const newConversationId = data.conversationId;

      // Set conversation ID if this is a new conversation
      if (!conversationId && newConversationId) {
        setConversationId(newConversationId);
      }

      if (content) {
        setMessages([...history, { role: "vc", content }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([
        ...history,
        {
          role: "vc",
          content: "Sorry, I'm having trouble responding right now.",
        },
      ]);
    }
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);
    setInput("");
    askNextQuestion(newMessages);
  };

  return (
    <div className="bg-white p-4 rounded shadow max-w-xl mx-auto mt-6">
      <h2 className="text-lg font-bold mb-2">
        {vc.avatar} {vc.name}
      </h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm p-2 rounded ${
              msg.role === "vc"
                ? "bg-gray-100 text-left"
                : "bg-blue-100 text-right"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="text-gray-400 text-sm animate-pulse">
            VC typing...
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border rounded p-2 flex-1 text-sm"
          placeholder="Type your response..."
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-black text-white px-4 py-2 text-sm rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
