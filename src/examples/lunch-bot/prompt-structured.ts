import Type from 'typebox';
import { PromptSchema } from '~/lib/prompts/schema';
import { DbMessage, dbMessageToOpenAi } from '~/lib/services/conversation-db/base';

const toolSchema = Type.Object({
  result: Type.Union([
    Type.Object({
      tool: Type.Literal('askClarifyingQuestion'),
      content: Type.String(),
    }),
    Type.Object({
      tool: Type.Literal('makeLunchBooking'),
      wantsLunch: Type.Boolean(),
      notes: Type.Optional(Type.String()),
    }),
  ]),
});

export const PromptLunchBotStructured = new PromptSchema(toolSchema, (messages: DbMessage[]) => [
  {
    role: 'system',
    content: `You are a helpful bot in conversation with a user, trying to determine their preference for lunch today. You have two actions availble to you; you can ask the user a clarifying question, or you can make their lunch booking, taking into account any notes that should be passed through to the catering team. Setting the lunch booking will automatically terminate the conversation.

You have no further information to offer the user, and can't provide any help; all you can do is make the lunch booking and attach notes.`,
  },
  ...dbMessageToOpenAi(messages),
]);
