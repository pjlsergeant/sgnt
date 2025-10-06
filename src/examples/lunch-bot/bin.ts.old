import { LlmClient } from '~/lib/services/llm/client';
import promptSync from 'prompt-sync';
import { PromptLunchBotTool } from '~/examples/lunch-bot/prompt-tool';
import { ConversationDbInMemory } from '~/lib/services/conversation-db/in-memory';
import { MainLoop } from '~/lib/services/main-loop';
import { makeDispatcher } from '~/examples/lunch-bot/dispatcher';

async function main() {
  const db = new ConversationDbInMemory();
  const client = new LlmClient();
  const userPrompt = promptSync();

  const loop = new MainLoop({
    conversationDb: db,
    client,
    prompt: PromptLunchBotTool,
    dispatcher: makeDispatcher(db),
  });

  const conversationId = await db.createConversation(1);
  const opener = 'Want some lunch today?';
  await db.addBotMessage(conversationId, opener);
  console.log(opener);

  while (true) {
    const userMessage = userPrompt('Your input> ');
    await db.addUserMessage(conversationId, userMessage);

    const display = await loop.process({ conversationId });
    if (!display) break;

    console.log(display);
  }
}

main();
