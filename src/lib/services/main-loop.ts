import { nextTick } from 'process';
import { Prompt } from '../prompts/base.js';
import { ConversationDb, ConversationId, DbMessage } from './conversation-db/base.js';
import { LlmClient } from './llm/client.js';
import type { LlmConfig } from './llm/models.js';

export type DefaultDispatcherResponses = {
  name: string;
  content: string;
  toolCallId?: string;
  metaData?: Record<string, any>;
}[];

type MainLoopConstructorArgs<
  ParseOutput,
  Config extends LlmConfig = LlmConfig,
  Messages = DbMessage[],
  DispatcherResponses = DefaultDispatcherResponses,
> = {
  conversationDb: ConversationDb;
  client: LlmClient<Config>;
  prompt: Prompt<[Messages], any, any, ParseOutput, any>;
  dispatcher: (
    loop: MainLoop<ParseOutput, Config>,
    messages: Messages,
    response: Exclude<ParseOutput, string>,
  ) => Promise<DispatcherResponses>;
  askUser: (what: string) => Promise<string>;
};

type ProcessArgs = {
  conversationId: ConversationId;
};

export class MainLoop<ParseOutput, Config extends LlmConfig = LlmConfig> {
  p: Required<MainLoopConstructorArgs<ParseOutput, Config>>;

  constructor(params: MainLoopConstructorArgs<ParseOutput, Config>) {
    this.p = params;
  }

  async process(args: ProcessArgs) {
    // Get the conversation
    const messages = await this.p.conversationDb.getMessages(args.conversationId);

    // Complete the prompt using it - uses the client's default model
    const [response, rawResponse] = await this.p.client.completePrompt(this.p.prompt, [messages]);

    // This is where we either prompt the user or call the dispatcher for the
    // tools
    if (typeof response === 'string') {
      await this.p.conversationDb.addBotMessage(args.conversationId, rawResponse);

      const userResponse = await this.p.askUser(response);
      await this.p.conversationDb.addUserMessage(args.conversationId, userResponse);
    } else {
      await this.p.conversationDb.addToolsRequest(args.conversationId, rawResponse);

      // Get all the tool response messages to write
      const toolResponses = await this.p.dispatcher(
        this,
        messages,
        response as Exclude<ParseOutput, string>,
      );

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
