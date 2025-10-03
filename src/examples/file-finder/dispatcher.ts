import { PromptFileFinder } from '~/examples/file-finder/prompt';
import { PromptOutput } from '~/lib/prompts/base';
import { ConversationDb, ConversationId, DbMessage } from '~/lib/services/conversation-db/base';
import { DefaultDispatcherResponses, MainLoop } from '~/lib/services/main-loop';
import promptSync from 'prompt-sync';
import { execa } from 'execa';

// export class PromptTools<
//   Args extends unknown[],
//   ParseInput extends ToolCallWire[],
//   ParseOutput extends ToolResponses<Tools>,
//   Tools extends ToolDefinitions,
//   ToolDescription extends PromptToolsStructure<Tools>,
//   ClientResponse extends OpenAiChatCompletion = OpenAiChatCompletion,
// > implements
//     Prompt<Args, ClientResponse, ParseInput | string, ParseOutput | string, ToolDescription>
// {

export function makeDispatcher<ParseOutput extends PromptOutput<typeof PromptFileFinder>>(
  db: ConversationDb,
  prompt: promptSync.Prompt,
) {
  return async function dispatcher(
    _loop: MainLoop<ParseOutput>,
    conversationId: ConversationId,
    _messages: DbMessage[],
    toolCallsRequested: Exclude<ParseOutput, string>,
  ): Promise<DefaultDispatcherResponses> {
    if (!toolCallsRequested) throw new Error('No response');

    const toolCallsOutput: DefaultDispatcherResponses = [];

    for (const toolCall of toolCallsRequested) {
      let proposedCmd = '';

      if (toolCall.name === 'headAndTail') {
        proposedCmd = `head -b ${toolCall.parameters.headBytes} ${toolCall.parameters.file} | tail -b ${toolCall.parameters.tailBytes}`;
      } else {
        proposedCmd = `${toolCall.name} ${toolCall.parameters.arguments.join(' ')}`;
      }

      console.log(
        `---\nGoal: ${toolCall.parameters.description}\nProposed command: ${proposedCmd}\n---`,
      );
      let userResponse = '';
      while (userResponse !== 'Y' && userResponse !== 'N') {
        userResponse = prompt('Run? Y/N: ');
      }

      if (userResponse === 'N') {
        toolCallsOutput.push({
          name: toolCall.name,
          content: `[user declined to run command: \`${proposedCmd}\`]`,
          toolCallId: toolCall.id,
        });

        console.log(`Skipping ${proposedCmd}`);
        continue;
      }

      let toolOutput = '';
      let toolSuccess = false;
      let toolExitCode: number | undefined = undefined;

      console.log(`Running ${proposedCmd}\n\n`);

      try {
        const { all, exitCode } = await execa(proposedCmd, { shell: true, all: true });
        toolOutput = all;
        toolSuccess = !exitCode;
        toolExitCode = exitCode;
      } catch (err) {
        toolSuccess = false;
        toolOutput = 'Failed to spawn: ' + (err as Error).name;
        toolOutput += '\n' + (err as Error).stack;
      }

      let summary = '';
      if (!toolSuccess) {
        summary += 'FAILED';
        if (toolExitCode !== undefined) {
          summary += ` with exit code ${toolExitCode}\n`;
        } else {
          summary += ` to spawn command\n`;
        }

        console.error(summary);
      } else {
        console.log(toolOutput.substring(0, 256) + (toolOutput.length > 256 ? '...' : ''));
      }

      toolCallsOutput.push({
        name: toolCall.name,
        content: summary + toolOutput,
        toolCallId: toolCall.id,
      });
    }

    return toolCallsOutput;
  };
}
