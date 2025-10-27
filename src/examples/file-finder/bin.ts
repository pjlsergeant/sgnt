import { defaultLlmClient } from '../../lib/services/llm/client.js';
import promptSync from 'prompt-sync';
import { ConversationDbInMemory } from '../../lib/services/conversation-db/in-memory.js';
import { MainLoop } from '../../lib/services/main-loop.js';
import { makeDispatcher } from './dispatcher.js';
import { PromptFileFinder } from './prompt.js';

async function main() {
  const db = new ConversationDbInMemory();
  const client = defaultLlmClient;
  const userPrompt = promptSync();

  const loop = new MainLoop({
    conversationDb: db,
    client,
    prompt: PromptFileFinder,
    askUser: async (msg: string) => userPrompt(msg + '\n> '),
    dispatcher: makeDispatcher(db, userPrompt),
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
