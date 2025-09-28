import Type from 'typebox';
import { defineTool, defineTools, PromptTools } from '~/lib/prompts/tools';
import { DbMessage, dbMessageToOpenAi } from '~/lib/services/conversation-db/base';

const [tools, parser] = defineTools([
  defineTool({
    name: 'askClarifyingQuestion',
    description: 'Return a message to the user, asking for more information',
    parameters: Type.Object({
      content: Type.String(),
    }),
  }),
  defineTool({
    name: 'makeLunchBooking',
    description: 'Enter the lunch order into the system and terminate the conversation',
    parameters: Type.Object({
      wantsLunch: Type.Boolean(),
      notes: Type.String(),
    }),
  }),
]);

export const PromptLunchBotTool = new PromptTools(tools, parser, (messages: DbMessage[]) => [
  {
    role: 'system',
    content: `You are a helpful bot in conversation with a user, trying to determine their preference for lunch today. You have two actions availble to you; you can ask the user a clarifying question, or you can make their lunch booking, taking into account any notes that should be passed through to the catering team. Setting the lunch booking will automatically terminate the conversation.

You have no further information to offer the user, and can't provide any help; all you can do is make the lunch booking and attach notes.`,
  },
  ...dbMessageToOpenAi(messages),
]);
