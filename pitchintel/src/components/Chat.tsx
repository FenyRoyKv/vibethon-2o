import { useEffect, useState } from "react";

type Message = { role: "user" | "vc"; content: string };

type VC = {
  avatar: string;
  name: string;
  systemPrompt: string;
};

export function Chat({ vc }: { vc: VC }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ask first question
    if (messages.length === 0) {
      askNextQuestion([]);
    }
  }, []);

  const askNextQuestion = async (history: Message[]) => {
    setLoading(true);
    const prompt = [
      { role: "system", content: vc.systemPrompt },
      ...history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ];

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
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-black text-white px-4 py-2 text-sm rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
