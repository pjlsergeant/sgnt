import { LlmClient } from '~/lib/services/llm/client';
import promptSync from 'prompt-sync';
import { PromptLunchBotTool } from '~/lib/prompts/lunch-bot-tool';
import { ConversationDbInMemory } from '~/lib/services/conversation-db/in-memory';
import { MainLoop } from '~/lib/services/main-loop';

async function main() {
  const db = new ConversationDbInMemory();
  const client = new LlmClient();
  const userPrompt = promptSync();

  const loop = new MainLoop({
    conversationDb: db,
    client,
    prompt: PromptLunchBotTool,
    dispatcher: async (_loop, conversationId, _messages, responseArray) => {
      const [response] = responseArray;

      if (!response) throw new Error('No response');

      if (typeof response !== 'string' && response.name === 'makeLunchBooking') {
        console.log(`Wants lunch`, response.parameters);
        return null;
      } else {
        const followup = typeof response === 'string' ? response : response.parameters.content;
        await db.addBotMessage(conversationId, followup);
        return followup;
      }
    },
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
