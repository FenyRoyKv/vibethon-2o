interface StoredConversation {
  id: string;
  vcName: string;
  messages: Array<{ role: 'user' | 'vc'; content: string }>;
  lastActive: number;
  systemPrompt: string;
}

export class ConversationStorage {
  private readonly STORAGE_KEY = 'pitchintel_conversations';
  private readonly MAX_STORED_CONVERSATIONS = 10;

  saveConversation(
    conversationId: string, 
    vcName: string, 
    messages: Array<{ role: 'user' | 'vc'; content: string }>,
    systemPrompt: string
  ): void {
    try {
      const stored = this.getStoredConversations();
      const conversation: StoredConversation = {
        id: conversationId,
        vcName,
        messages: [...messages],
        lastActive: Date.now(),
        systemPrompt
      };

      // Remove existing conversation with same ID
      const filtered = stored.filter(c => c.id !== conversationId);
      
      // Add new conversation at the beginning
      const updated = [conversation, ...filtered];
      
      // Keep only the most recent conversations
      const trimmed = updated.slice(0, this.MAX_STORED_CONVERSATIONS);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  loadConversation(conversationId: string): StoredConversation | null {
    try {
      const stored = this.getStoredConversations();
      const conversation = stored.find(c => c.id === conversationId);
      
      if (conversation) {
        // Update last active time
        conversation.lastActive = Date.now();
        this.saveConversationMetadata(stored);
      }
      
      return conversation || null;
    } catch (error) {
      console.error('Failed to load conversation:', error);
      return null;
    }
  }

  getAllConversations(): StoredConversation[] {
    return this.getStoredConversations();
  }

  deleteConversation(conversationId: string): boolean {
    try {
      const stored = this.getStoredConversations();
      const filtered = stored.filter(c => c.id !== conversationId);
      
      if (filtered.length !== stored.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      return false;
    }
  }

  clearAllConversations(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear conversations:', error);
    }
  }

  getConversationSummary(conversationId: string): string {
    const conversation = this.loadConversation(conversationId);
    if (!conversation || conversation.messages.length === 0) {
      return 'New conversation';
    }

    const firstUserMessage = conversation.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 50) + '...';
    }

    return `Chat with ${conversation.vcName}`;
  }

  cleanupExpiredConversations(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    try {
      const stored = this.getStoredConversations();
      const cutoff = Date.now() - maxAge;
      const active = stored.filter(c => c.lastActive > cutoff);
      
      if (active.length !== stored.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(active));
      }
    } catch (error) {
      console.error('Failed to cleanup conversations:', error);
    }
  }

  private getStoredConversations(): StoredConversation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse stored conversations:', error);
      return [];
    }
  }

  private saveConversationMetadata(conversations: StoredConversation[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversation metadata:', error);
    }
  }

  getStorageStats(): {
    totalConversations: number;
    totalMessages: number;
    storageSize: number;
    oldestConversation?: Date;
    newestConversation?: Date;
  } {
    const conversations = this.getStoredConversations();
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    
    const storageSize = new Blob([localStorage.getItem(this.STORAGE_KEY) || '']).size;
    
    let oldestConversation: Date | undefined;
    let newestConversation: Date | undefined;
    
    if (conversations.length > 0) {
      const times = conversations.map(c => c.lastActive);
      oldestConversation = new Date(Math.min(...times));
      newestConversation = new Date(Math.max(...times));
    }

    return {
      totalConversations: conversations.length,
      totalMessages,
      storageSize,
      oldestConversation,
      newestConversation
    };
  }
}

export const conversationStorage = new ConversationStorage();