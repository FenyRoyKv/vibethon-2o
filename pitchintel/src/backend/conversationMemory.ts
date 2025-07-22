interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
  tokens?: number;
}

interface Conversation {
  id: string;
  messages: ConversationMessage[];
  createdAt: number;
  lastActive: number;
  systemPrompt?: string;
  totalTokens: number;
}

export class ConversationMemory {
  private conversations = new Map<string, Conversation>();
  private readonly MAX_CONVERSATIONS = 100;
  private readonly CONVERSATION_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_MESSAGES_PER_CONVERSATION = 50;
  private readonly MAX_TOKENS_PER_CONVERSATION = 8000; // Keep under context limit

  constructor() {
    this.startCleanup();
  }

  createConversation(systemPrompt?: string): string {
    const id = this.generateId();
    const now = Date.now();
    
    const conversation: Conversation = {
      id,
      messages: systemPrompt ? [{
        role: 'system',
        content: systemPrompt,
        timestamp: now,
        tokens: this.estimateTokens(systemPrompt)
      }] : [],
      createdAt: now,
      lastActive: now,
      systemPrompt,
      totalTokens: systemPrompt ? this.estimateTokens(systemPrompt) : 0
    };

    this.conversations.set(id, conversation);
    this.cleanup();
    
    return id;
  }

  addMessage(conversationId: string, role: 'user' | 'assistant', content: string, tokens?: number): boolean {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    const estimatedTokens = tokens || this.estimateTokens(content);
    const message: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
      tokens: estimatedTokens
    };

    // Check token limits
    if (conversation.totalTokens + estimatedTokens > this.MAX_TOKENS_PER_CONVERSATION) {
      this.trimConversation(conversation);
    }

    conversation.messages.push(message);
    conversation.lastActive = Date.now();
    conversation.totalTokens += estimatedTokens;

    // Limit message count
    if (conversation.messages.length > this.MAX_MESSAGES_PER_CONVERSATION) {
      this.trimMessages(conversation);
    }

    return true;
  }

  getConversation(conversationId: string): ConversationMessage[] | null {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    // Update last active
    conversation.lastActive = Date.now();
    
    return [...conversation.messages];
  }

  getFormattedMessages(conversationId: string): Array<{role: string; content: string}> | null {
    const messages = this.getConversation(conversationId);
    if (!messages) return null;

    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  clearAllConversations(): void {
    this.conversations.clear();
  }

  getStats(): {
    activeConversations: number;
    totalMessages: number;
    totalTokens: number;
    averageMessagesPerConversation: number;
  } {
    const activeConversations = this.conversations.size;
    let totalMessages = 0;
    let totalTokens = 0;

    for (const conv of this.conversations.values()) {
      totalMessages += conv.messages.length;
      totalTokens += conv.totalTokens;
    }

    return {
      activeConversations,
      totalMessages,
      totalTokens,
      averageMessagesPerConversation: activeConversations > 0 ? totalMessages / activeConversations : 0
    };
  }

  private trimConversation(conversation: Conversation): void {
    // Keep system message and recent messages
    const systemMessages = conversation.messages.filter(m => m.role === 'system');
    const nonSystemMessages = conversation.messages.filter(m => m.role !== 'system');
    
    // Remove oldest messages until under token limit
    while (conversation.totalTokens > this.MAX_TOKENS_PER_CONVERSATION * 0.8 && nonSystemMessages.length > 2) {
      const removedMessage = nonSystemMessages.shift();
      if (removedMessage) {
        conversation.totalTokens -= removedMessage.tokens || 0;
      }
    }

    conversation.messages = [...systemMessages, ...nonSystemMessages];
  }

  private trimMessages(conversation: Conversation): void {
    const systemMessages = conversation.messages.filter(m => m.role === 'system');
    const nonSystemMessages = conversation.messages.filter(m => m.role !== 'system');
    
    // Keep only recent non-system messages
    const keepCount = this.MAX_MESSAGES_PER_CONVERSATION - systemMessages.length;
    const keptMessages = nonSystemMessages.slice(-keepCount);
    
    // Update token count
    const removedMessages = nonSystemMessages.slice(0, -keepCount);
    const removedTokens = removedMessages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);
    conversation.totalTokens -= removedTokens;
    
    conversation.messages = [...systemMessages, ...keptMessages];
  }

  private cleanup(): void {
    if (this.conversations.size <= this.MAX_CONVERSATIONS) return;

    // Remove oldest conversations
    const sortedConversations = Array.from(this.conversations.entries())
      .sort(([, a], [, b]) => a.lastActive - b.lastActive);
    
    const toRemove = sortedConversations.slice(0, this.conversations.size - this.MAX_CONVERSATIONS);
    toRemove.forEach(([id]) => this.conversations.delete(id));
  }

  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredIds: string[] = [];
      
      for (const [id, conversation] of this.conversations.entries()) {
        if (now - conversation.lastActive > this.CONVERSATION_TTL) {
          expiredIds.push(id);
        }
      }
      
      expiredIds.forEach(id => this.conversations.delete(id));
    }, 30 * 60 * 1000); // Clean up every 30 minutes
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}