import { ConversationDbBase, ConversationId, DbMessage, MessageId, UserId } from './base';

type Metadata = Record<string, unknown> | null;

interface Conversation {
  id: ConversationId;
  userId: UserId;
  metadata: Metadata;
  createdAt: number;
  updatedAt: number;
}

interface Message extends DbMessage {
  conversationId: ConversationId;
}

export class ConversationDbInMemory extends ConversationDbBase<null> {
  private conversations: Map<ConversationId, Conversation> = new Map();
  private messages: Map<MessageId, Message> = new Map();
  private userConversations: Map<UserId, ConversationId[]> = new Map();
  private nextConversationId = 1;
  private nextMessageId = 1;

  constructor() {
    super(null);
  }

  static async fromEnv(): Promise<ConversationDbInMemory> {
    const db = new ConversationDbInMemory();
    await db.safeInit();
    return db;
  }

  async safeInit(): Promise<void> {
    // No initialization needed for in-memory implementation
  }

  async createConversation(userId: UserId, metadata?: Metadata): Promise<ConversationId> {
    const conversationId = `conv_${this.nextConversationId++}` as ConversationId;
    const now = Date.now();

    const conversation: Conversation = {
      id: conversationId,
      userId,
      metadata: metadata ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.conversations.set(conversationId, conversation);

    // Track user conversations
    const userConvs = this.userConversations.get(userId) ?? [];
    userConvs.push(conversationId);
    this.userConversations.set(userId, userConvs);

    return conversationId;
  }

  async getAllConversationsByUserId(): Promise<
    {
      conversationId: ConversationId;
      metadata: Metadata;
      updatedAt: number;
      messageTotal: number;
      messagesUser: number;
      messagesBot: number;
    }[]
  > {
    const result: {
      conversationId: ConversationId;
      metadata: Metadata;
      updatedAt: number;
      messageTotal: number;
      messagesUser: number;
      messagesBot: number;
    }[] = [];

    for (const conversation of this.conversations.values()) {
      const messages = Array.from(this.messages.values()).filter(
        (m) => m.conversationId === conversation.id,
      );

      const messagesUser = messages.filter((m) => m.from === 'user').length;
      const messagesBot = messages.filter((m) => m.from === 'bot').length;

      // Get the most recent message timestamp or conversation creation time
      const lastMessageTime =
        messages.length > 0
          ? Math.max(...messages.map((m) => m.createdAt))
          : conversation.createdAt;

      result.push({
        conversationId: conversation.id,
        metadata: conversation.metadata,
        updatedAt: lastMessageTime,
        messageTotal: messages.length,
        messagesUser,
        messagesBot,
      });
    }

    return result;
  }

  async addUserMessage(
    conversationId: ConversationId,
    message: string,
    metadata?: Metadata,
  ): Promise<MessageId> {
    return this.addMessage(conversationId, message, 'user', metadata);
  }

  async addBotMessage(
    conversationId: ConversationId,
    message: string,
    metadata?: Metadata,
  ): Promise<MessageId> {
    return this.addMessage(conversationId, message, 'bot', metadata);
  }

  async addToolMessage(
    conversationId: ConversationId,
    toolName: string,
    message: string,
    toolCallId?: string,
    metadata?: Metadata,
  ): Promise<MessageId> {
    const writeMetadata: Metadata = metadata ?? {};
    writeMetadata['toolName'] = toolName;
    if (toolCallId) writeMetadata['toolCallId'] = toolCallId;

    return this.addMessage(conversationId, message, 'tool', writeMetadata);
  }

  private async addMessage(
    conversationId: ConversationId,
    message: string,
    from: 'user' | 'bot' | 'tool',
    metadata?: Metadata,
  ): Promise<MessageId> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const messageId = this.nextMessageId++ as MessageId;
    const now = Date.now();

    const messageObj: Message = {
      id: messageId,
      conversationId,
      from,
      metadata: metadata ?? null,
      message,
      createdAt: now,
    };

    this.messages.set(messageId, messageObj);

    // Update conversation's updatedAt
    conversation.updatedAt = now;

    return messageId;
  }

  async updateMessageMetadata(
    messageId: MessageId,
    merge: boolean,
    metadata: Metadata,
  ): Promise<void> {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    if (merge && message.metadata && metadata) {
      // Merge metadata
      message.metadata = { ...message.metadata, ...metadata };
    } else {
      // Replace metadata
      message.metadata = metadata;
    }
  }

  async getMessages(conversationId: ConversationId, max?: number): Promise<DbMessage[]> {
    const messages = Array.from(this.messages.values())
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt);

    const limitedMessages = max ? messages.slice(0, max) : messages;

    return limitedMessages.map((m) => ({
      id: m.id,
      from: m.from,
      metadata: m.metadata,
      message: m.message,
      createdAt: m.createdAt,
    }));
  }
}
