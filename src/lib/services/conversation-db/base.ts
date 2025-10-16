import { OpenAiMessages } from '../../prompts/base.js';

export type MessageId = number;
export type ConversationId = string;
export type UserId = number;

type Metadata = Record<string, unknown> | null;

export type DbMessage = {
  id: number;
  from: 'user' | 'bot' | 'tool';
  metadata: Metadata;
  message: string;
  createdAt: number;
};

const dbFromToRole = { user: 'user', bot: 'assistant', tool: 'tool' } as const;
export function dbMessageToOpenAi(msgs: DbMessage[]): OpenAiMessages {
  return msgs.map((m) => {
    if (m.from === 'tool') {
      return {
        role: 'tool',
        content: m.message,
        name: String(m.metadata?.toolName ?? '[unknown tool name]'),
        tool_call_id: String(m.metadata?.toolCallId ?? '[unknown tool call id]'),
      };
    } else {
      return {
        role: dbFromToRole[m.from],
        content: m.message,
        ...(m.metadata?.toolCalls
          ? { tool_calls: JSON.parse(m.metadata.toolCalls as string) }
          : {}),
      };
    }
  });
}

export interface ConversationDb {
  createConversation(userId: UserId, metadata?: Metadata): Promise<ConversationId>;
  getAllConversationsByUserId(): Promise<
    {
      conversationId: ConversationId;
      metadata: Metadata;
      updatedAt: number; // the most recent createdAt
      messageTotal: number;
      messagesUser: number;
      messagesBot: number;
    }[]
  >;

  addUserMessage(
    conversationId: ConversationId,
    message: string,
    metadata?: Metadata,
  ): Promise<MessageId>;
  addBotMessage(
    conversationId: ConversationId,
    message: string,
    metadata?: Metadata,
  ): Promise<MessageId>;
  addToolsRequest(
    conversationId: ConversationId,
    message: string,
    metadata?: Metadata,
  ): Promise<MessageId>;
  addToolResponse(
    conversationId: ConversationId,
    toolName: string,
    message: string,
    toolCallId?: string,
    metadata?: Metadata,
  ): Promise<MessageId>;
  updateMessageMetadata(messageId: MessageId, merge: boolean, metadata: Metadata): Promise<void>;
  getMessages(conversationId: ConversationId, max?: number): Promise<DbMessage[]>;
}

export abstract class ConversationDbBase<X> implements ConversationDb {
  _client: null | X;
  constructor(client: null | X = null) {
    this._client = client;
  }

  static fromEnv(): Promise<ConversationDbBase<any>> {
    throw new Error("Can't call on ConversationDbBase directly");
    return false as any;
  }

  abstract safeInit(): Promise<void>;

  assertClient(): asserts this is { _client: X } {
    if (!this._client) throw new Error('Client is not set');
  }

  get client(): X {
    return (this.assertClient(), this._client);
  }

  // Conversations
  abstract createConversation(userId: UserId, metadata: Metadata): Promise<ConversationId>;
  abstract getAllConversationsByUserId(): Promise<
    {
      conversationId: ConversationId;
      metadata: Metadata;
      updatedAt: number; // the most recent createdAt
      messageTotal: number;
      messagesUser: number;
      messagesBot: number;
    }[]
  >;

  // Messages
  abstract addUserMessage(
    conversationId: ConversationId,
    message: string,
    metadata?: Metadata,
  ): Promise<MessageId>;
  abstract addBotMessage(
    conversationId: ConversationId,
    message: string,
    metadata?: Metadata,
  ): Promise<MessageId>;
  abstract addToolsRequest(
    conversationId: ConversationId,
    message: string,
    metadata?: Metadata,
  ): Promise<MessageId>;
  abstract addToolResponse(
    conversationId: ConversationId,
    toolName: string,
    message: string,
    toolCallId?: string,
    metadata?: Metadata,
  ): Promise<MessageId>;
  abstract updateMessageMetadata(
    messageId: MessageId,
    merge: boolean,
    metadata: Metadata,
  ): Promise<void>;
  abstract getMessages(conversationId: ConversationId, max?: number): Promise<DbMessage[]>;

  protected dateToSql(date: Date): string {
    return date.toISOString().replace('T', ' ').replace('Z', '');
  }

  protected sqlToDate(_dateString: string): Date {
    throw new Error('sqlToDate must be implemented by subclass');
  }
}
