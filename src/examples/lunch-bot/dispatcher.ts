import { PromptLunchBotTool } from '~/examples/lunch-bot/prompt-tool';
import { PromptOutput } from '~/lib/prompts/base';
import { ConversationDb, ConversationId, DbMessage } from '~/lib/services/conversation-db/base';
import { MainLoop } from '~/lib/services/main-loop';

export function makeDispatcher<Responses extends PromptOutput<typeof PromptLunchBotTool>>(
  db: ConversationDb,
) {
  return async function dispatcher(
    _loop: MainLoop<Responses>,
    conversationId: ConversationId,
    _messages: DbMessage[],
    responses: Responses,
  ) {
    const [response] = responses;
    if (!response) throw new Error('No response');

    if (typeof response !== 'string' && response.name === 'makeLunchBooking') {
      console.log(`Wants lunch`, response.parameters);
      return null;
    } else {
      const followup = typeof response === 'string' ? response : response.parameters.content;
      await db.addBotMessage(conversationId, followup);
      return followup;
    }
  };
}
