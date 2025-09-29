import { Prompt } from '~/lib/prompts/base';
import { ConversationDb, ConversationId, DbMessage } from '~/lib/services/conversation-db/base';
import { LlmClient } from '~/lib/services/llm/client';

type MainLoopConstructorArgs<
  LlmResponse,
  Messages = DbMessage[],
  DispatcherResponse = string | null,
> = {
  conversationDb: ConversationDb;
  client: LlmClient;
  prompt: Prompt<[Messages], any, any, LlmResponse, any>;
  dispatcher: (
    loop: MainLoop<LlmResponse>,
    conversationId: string,
    messages: Messages,
    response: LlmResponse,
  ) => Promise<DispatcherResponse>;
};

type ProcessArgs = {
  conversationId: ConversationId;
};

export class MainLoop<Response> {
  p: Required<MainLoopConstructorArgs<Response>>;

  constructor(params: MainLoopConstructorArgs<Response>) {
    this.p = params;
  }

  async process(args: ProcessArgs) {
    // Get the conversation
    const messages = await this.p.conversationDb.getMessages(args.conversationId);

    // Complete the prompt using it
    const response = await this.p.client.completePrompt(this.p.prompt, 'gpt-5-mini', messages);

    const responseAsText = typeof response === 'string' ? response : JSON.stringify(response);
    await this.p.conversationDb.addBotMessage(args.conversationId, responseAsText);

    // Determine what to do next
    return await this.p.dispatcher(this, args.conversationId, messages, response);
  }
}
