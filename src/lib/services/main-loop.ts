import { ConversationDb, ConversationId } from '~/lib/services/conversation-db/base';

type ConversationDbConstructor = {
  conversationDb: ConversationDb;
};

type ProcessArgs = {
  conversationId: ConversationId;
};

export class MainLoop {
  p: Required<ConversationDbConstructor>;

  constructor(params: ConversationDbConstructor) {
    this.p = params;
  }

  process(args: ProcessArgs) {
    // Get the conversation
    const _messages = this.p.conversationDb.getMessages(args.conversationId);

    // Complete the prompt using it
    // Determine what to do next
    // Log it
  }
}
