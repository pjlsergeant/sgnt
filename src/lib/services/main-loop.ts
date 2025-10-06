import { nextTick } from 'process';
import { Prompt } from '~/lib/prompts/base';
import { ConversationDb, ConversationId, DbMessage } from '~/lib/services/conversation-db/base';
import { LlmClient } from '~/lib/services/llm/client';
import { defaultCompletion } from '~/lib/services/llm/models';

export type DefaultDispatcherResponses = {
  name: string;
  content: string;
  toolCallId?: string;
  metaData?: Record<string, any>;
}[];

type MainLoopConstructorArgs<
  ParseOutput,
  Messages = DbMessage[],
  DispatcherResponses = DefaultDispatcherResponses,
> = {
  conversationDb: ConversationDb;
  client: LlmClient;
  prompt: Prompt<[Messages], any, any, ParseOutput, any>;
  dispatcher: (
    loop: MainLoop<ParseOutput>,
    messages: Messages,
    response: ParseOutput,
  ) => Promise<DispatcherResponses>;
  askUser: (what: string) => Promise<string>;
};

type ProcessArgs = {
  conversationId: ConversationId;
};

export class MainLoop<ParseOutput> {
  p: Required<MainLoopConstructorArgs<ParseOutput>>;

  constructor(params: MainLoopConstructorArgs<ParseOutput>) {
    this.p = params;
  }

  async process(args: ProcessArgs) {
    // Get the conversation
    const messages = await this.p.conversationDb.getMessages(args.conversationId);

    // Complete the prompt using it
    const [response, rawResponse] = await this.p.client.completePrompt(
      this.p.prompt,
      defaultCompletion,
      messages,
    );

    // This is where we either prompt the user or call the dispatcher for the
    // tools
    if (typeof response === 'string') {
      await this.p.conversationDb.addBotMessage(args.conversationId, rawResponse);

      const userResponse = await this.p.askUser(response);
      await this.p.conversationDb.addUserMessage(args.conversationId, userResponse);
    } else {
      await this.p.conversationDb.addToolsRequest(args.conversationId, rawResponse);

      // Get all the tool response messages to write
      const toolResponses = await this.p.dispatcher(this, messages, response);

      for (const toolResponse of toolResponses) {
        await this.p.conversationDb.addToolResponse(
          args.conversationId,
          toolResponse.name,
          toolResponse.content,
          toolResponse.toolCallId,
          toolResponse.metaData,
        );
      }
    }

    const fn = this.process.bind(this);

    nextTick(() => fn(args));
  }
}
