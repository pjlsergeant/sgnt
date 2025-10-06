import { LlmClient } from '~/lib/services/llm/client';
import promptSync from 'prompt-sync';
import { ConversationDbInMemory } from '~/lib/services/conversation-db/in-memory';
import { MainLoop } from '~/lib/services/main-loop';
import { makeDispatcher } from '~/examples/file-finder/dispatcher';
import { PromptFileFinder } from '~/examples/file-finder/prompt';

async function main() {
  const db = new ConversationDbInMemory();
  const client = new LlmClient();
  const userPrompt = promptSync();

  const loop = new MainLoop({
    conversationDb: db,
    client,
    prompt: PromptFileFinder as any,
    askUser: async (msg: string) => userPrompt(msg + '\n> '),
    dispatcher: makeDispatcher(db, userPrompt) as any,
  });

  const conversationId = await db.createConversation(1);
  const opener = 'What can I help you find?';
  await db.addBotMessage(conversationId, opener);
  console.log(opener);

  const userResponse = await userPrompt('> ');
  await db.addUserMessage(conversationId, userResponse);

  loop.process({ conversationId });
}

main();
