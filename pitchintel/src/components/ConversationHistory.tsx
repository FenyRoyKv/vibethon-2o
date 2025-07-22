import { useState, useEffect } from "react";
import { conversationStorage } from "../utils/conversationStorage";
import { apiClient } from "../utils/apiClient";

interface ConversationStats {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  memoryUsage: number;
}

interface StorageStats {
  totalConversations: number;
  totalMessages: number;
  storageSize: number;
}

interface ConversationHistoryProps {
  onSelectConversation?: (
    conversationId: string,
    messages: Array<{ role: "user" | "vc"; content: string }>
  ) => void;
}

export function ConversationHistory({
  onSelectConversation,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<
    Array<{
      id: string;
      vcName: string;
      messages: Array<{ role: "user" | "vc"; content: string }>;
      lastActive: number;
      systemPrompt: string;
    }>
  >([]);
  const [conversationStats, setConversationStats] =
    useState<ConversationStats | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  useEffect(() => {
    loadConversations();
    loadStats();
  }, []);

  const loadConversations = () => {
    const stored = conversationStorage.getAllConversations();
    setConversations(stored);
  };

  const loadStats = async () => {
    const convStatsResult = await apiClient.getConversationStats();
    if (!convStatsResult.error) {
      setConversationStats(convStatsResult.data as ConversationStats);
    }

    const storage = conversationStorage.getStorageStats();
    setStorageStats(storage);
  };

  const handleDeleteConversation = async (
    conversationId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (confirm("Delete this conversation?")) {
      // Delete from localStorage
      conversationStorage.deleteConversation(conversationId);

      // Delete from backend
      await apiClient.deleteConversation(conversationId);

      loadConversations();
      loadStats();
    }
  };

  const handleClearAll = async () => {
    if (confirm("Clear all conversation history? This cannot be undone.")) {
      conversationStorage.clearAllConversations();
      await apiClient.clearConversations();
      loadConversations();
      loadStats();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationPreview = (
    messages: Array<{ role: "user" | "vc"; content: string }>
  ) => {
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 60) + "...";
    }
    return "New conversation";
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Conversation History</h2>
        <button
          onClick={handleClearAll}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
        >
          Clear All
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-semibold text-blue-800">Stored Conversations</h3>
          <p className="text-2xl font-bold text-blue-600">
            {storageStats?.totalConversations || 0}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <h3 className="font-semibold text-green-800">Total Messages</h3>
          <p className="text-2xl font-bold text-green-600">
            {storageStats?.totalMessages || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <h3 className="font-semibold text-purple-800">Active Sessions</h3>
          <p className="text-2xl font-bold text-purple-600">
            {conversationStats?.totalConversations || 0}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded">
          <h3 className="font-semibold text-orange-800">Storage Used</h3>
          <p className="text-2xl font-bold text-orange-600">
            {storageStats
              ? `${Math.round(storageStats.storageSize / 1024)}KB`
              : "0KB"}
          </p>
        </div>
      </div>

      {/* Conversation List */}
      <div className="space-y-3">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No conversations yet. Start chatting with a VC to see your history
            here.
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectConversation?.(conv.id, conv.messages)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{conv.vcName}</h3>
                    <span className="text-sm text-gray-500">
                      {formatDate(conv.lastActive)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {getConversationPreview(conv.messages)}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{conv.messages.length} messages</span>
                    <span>ID: {conv.id.substring(0, 8)}...</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete conversation"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => {
            loadConversations();
            loadStats();
          }}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
