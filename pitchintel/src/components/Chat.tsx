import { useEffect, useState } from "react";

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

  useEffect(() => {
    // Ask first question when chat initializes
    if (messages.length === 0) {
      askNextQuestion([]);
    }
  }, []);

  const askNextQuestion = async (history: Message[]) => {
    setLoading(true);

    // Create context-aware system prompt
    const contextualSystemPrompt = slideAnalysis
      ? `${vc.systemPrompt}\n\nBased on the pitch deck analysis:\n${slideAnalysis}\n\nAsk tough, specific questions about the weaknesses and red flags identified in the analysis.`
      : vc.systemPrompt;

    const prompt = [
      { role: "system", content: contextualSystemPrompt },
      ...history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ];

    // If this is the first question and we have slide analysis, ask a specific question about the deck
    if (history.length === 0 && slideAnalysis) {
      prompt.push({
        role: "user",
        content:
          "I just presented my pitch deck. Based on your analysis, what's your biggest concern about my business?",
      });
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: prompt,
          temperature: 0.8,
        }),
      });

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        setMessages([...history, { role: "vc", content }]);
      }
    } catch (error) {
      console.error("Error fetching VC response:", error);
      setMessages([
        ...history,
        {
          role: "vc",
          content: "I'm having trouble responding right now. Please try again.",
        },
      ]);
    }
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
    ];
    setMessages(newMessages);
    setInput("");
    askNextQuestion(newMessages);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white p-6">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6">
        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              🤖
            </div>
            <p className="text-gray-500 text-sm">
              I've analyzed the document. How can I assist you?
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className="space-y-2">
            {/* Message Label */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                {msg.role === "user" ? "Sophia" : "System"}
              </span>
            </div>

            {/* Message Content */}
            <div
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              } items-start space-x-3`}
            >
              {msg.role === "vc" && (
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">🤖</span>
                </div>
              )}

              <div
                className={`max-w-[70%] ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3"
                    : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md px-4 py-3"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>

              {msg.role === "user" && (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading State */}
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">System</span>
            </div>
            <div className="flex justify-start items-start space-x-3">
              <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">🤖</span>
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Input Field */}
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-4 py-3 bg-gray-100 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={loading}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
