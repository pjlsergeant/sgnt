// import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConversationDb2 } from '~/lib/services/conversation-db/base';
import { ConversationDbInMemory } from '~/lib/services/conversation-db/in-memory';

function conversationDbFromEnv() {
  return ConversationDbInMemory.fromEnv();
}

// Test variables
let conversationDb: ConversationDb2;
// const dateDiff = (then: Date) => Date.now() - then.getTime();

function newUsername() {
  return Math.floor(Math.random() * 1_000_000);
}

beforeEach(async () => {
  conversationDb = await conversationDbFromEnv();
});

describe('ConversationDb Integration Tests', () => {
  it('should create a new conversation and add messages', async () => {
    // Step 1: Create a new conversation
    const username = newUsername();
    const conversationId = await conversationDb.createConversation(username);
    expect(conversationId).toBeDefined();
    expect(typeof conversationId).toBe('string');

    // Step 2: Add user message
    const userMessage = 'Hello, how are you?';
    const userMessageId = await conversationDb.addUserMessage(conversationId, userMessage);
    expect(userMessageId).toBeDefined();
    expect(typeof userMessageId).toBe('number');

    // Step 3: Add bot message
    const botMessage = 'I am fine, thank you!';
    const botMessageId = await conversationDb.addBotMessage(conversationId, botMessage);
    expect(botMessageId).toBeDefined();
    expect(typeof botMessageId).toBe('number');

    // Step 4: Retrieve messages and verify order
    const messages = await conversationDb.getMessages(conversationId, 10);
    expect(messages).toBeDefined();
    expect(Array.isArray(messages)).toBe(true);
    expect(messages.length).toBe(2);
    expect(messages[0]?.message).toBe(userMessage);
    expect(messages[1]?.message).toBe(botMessage);
  });

  it('various timezone-related tests', async () => {
    const username = newUsername();
    const conversationId = await conversationDb.createConversation(username);

    await conversationDb.addUserMessage(conversationId, 'hey u');
    const [message] = await conversationDb.getMessages(conversationId, 10);

    expect(Date.now() - message!.createdAt).toBeLessThan(1_000);
  });

  it('should get all conversations with aggregated data', async () => {
    const username = newUsername();
    const conv1 = await conversationDb.createConversation(username, { channel: 'web' });
    await conversationDb.addUserMessage(conv1, 'Hello');
    await conversationDb.addBotMessage(conv1, 'Hi');

    const conversations = await conversationDb.getAllConversationsByUserId();
    const conv = conversations.find((c) => c.conversationId === conv1);

    expect(conv).toBeDefined();
    expect(conv?.metadata).toEqual({ channel: 'web' });
    expect(conv?.messageTotal).toBe(2);
    expect(conv?.messagesUser).toBe(1);
    expect(conv?.messagesBot).toBe(1);
  });

  it('should update message metadata with merge', async () => {
    const username = newUsername();
    const conversationId = await conversationDb.createConversation(username);
    const messageId = await conversationDb.addUserMessage(conversationId, 'Test', {
      status: 'pending',
    });

    await conversationDb.updateMessageMetadata(messageId, true, { rating: 5 });

    const [message] = await conversationDb.getMessages(conversationId);
    expect(message?.metadata).toEqual({ status: 'pending', rating: 5 });
  });

  it('should update message metadata with replace', async () => {
    const username = newUsername();
    const conversationId = await conversationDb.createConversation(username);
    const messageId = await conversationDb.addUserMessage(conversationId, 'Test', {
      status: 'pending',
    });

    await conversationDb.updateMessageMetadata(messageId, false, { rating: 5 });

    const [message] = await conversationDb.getMessages(conversationId);
    expect(message?.metadata).toEqual({ rating: 5 });
  });

  it('should create conversation with metadata', async () => {
    const username = newUsername();
    const metadata = { source: 'mobile', version: '2.0' };
    const conversationId = await conversationDb.createConversation(username, metadata);

    const conversations = await conversationDb.getAllConversationsByUserId();
    const conv = conversations.find((c) => c.conversationId === conversationId);

    expect(conv?.metadata).toEqual(metadata);
  });

  it('should add messages with metadata', async () => {
    const username = newUsername();
    const conversationId = await conversationDb.createConversation(username);
    await conversationDb.addUserMessage(conversationId, 'Hello', { timestamp: 123 });

    const [message] = await conversationDb.getMessages(conversationId);
    expect(message?.metadata).toEqual({ timestamp: 123 });
    expect(message?.from).toBe('user');
  });

  it('should limit messages with max parameter', async () => {
    const username = newUsername();
    const conversationId = await conversationDb.createConversation(username);

    for (let i = 1; i <= 5; i++) {
      await conversationDb.addUserMessage(conversationId, `Message ${i}`);
    }

    const messages = await conversationDb.getMessages(conversationId, 3);
    expect(messages.length).toBe(3);
    expect(messages[0]?.message).toBe('Message 1');
    expect(messages[2]?.message).toBe('Message 3');
  });

  it('should handle multiple conversations per user', async () => {
    const username = newUsername();
    const conv1 = await conversationDb.createConversation(username, { session: 1 });
    const conv2 = await conversationDb.createConversation(username, { session: 2 });

    await conversationDb.addUserMessage(conv1, 'Conv1 message');
    await conversationDb.addUserMessage(conv2, 'Conv2 message');

    const messages1 = await conversationDb.getMessages(conv1);
    const messages2 = await conversationDb.getMessages(conv2);

    expect(messages1[0]?.message).toBe('Conv1 message');
    expect(messages2[0]?.message).toBe('Conv2 message');
    expect(conv1).not.toBe(conv2);
  });
});
