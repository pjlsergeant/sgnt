import { LlmClient } from '~/lib/services/llm/client';
import promptSync from 'prompt-sync';
import { PromptLunchBotTool } from '~/lib/prompts/lunch-bot-tool';
import { ConversationDbInMemory } from '~/lib/services/conversation-db/in-memory';

async function main() {
  const db = new ConversationDbInMemory();
  const client = new LlmClient();
  const userPrompt = promptSync();

  const conversationId = await db.createConversation(1);
  const opener = 'Want some lunch today?';
  await db.addBotMessage(conversationId, opener);
  console.log(opener);

  while (true) {
    const userInput = userPrompt('Your input: ');
    await db.addUserMessage(conversationId, userInput);

    const [response] = await client.completePrompt(
      PromptLunchBotTool,
      'gpt-5-mini',
      await db.getMessages(conversationId),
    );

    if (response?.name === 'makeLunchBooking') {
      console.log(`Wants lunch`);
      break;
    } else if (response?.name === 'askClarifyingQuestion') {
      const responseText = response?.parameters.content;
      await db.addBotMessage(conversationId, responseText);
      console.log(responseText);
    }
  }
}

main();
