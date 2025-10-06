import Type from 'typebox';
import { defineTool, defineTools, PromptTools } from '~/lib/prompts/tools';
import { DbMessage, dbMessageToOpenAi } from '~/lib/services/conversation-db/base';
import os from 'os';

const [tools, parser] = defineTools([
  defineTool({
    name: 'ls',
    description: 'Standard BSD ls command',
    parameters: Type.Object({
      description: Type.String(),
      arguments: Type.Array(Type.String()),
    }),
  }),
  defineTool({
    name: 'find',
    description: 'Standard find command',
    parameters: Type.Object({
      description: Type.String(),
      arguments: Type.Array(Type.String()),
    }),
  }),
  // defineTool({
  //   name: 'pwd',
  //   description: 'Prints the current working directory',
  //   parameters: Type.Object({
  //     description: Type.String(),
  //     arguments: {}
  //   }),
  // }),
  defineTool({
    name: 'headAndTail',
    description: 'Runs `head` piped to `tail`. Bytes (-b) is required and passed to each',
    parameters: Type.Object({
      description: Type.String(),
      file: Type.String(),
      headBytes: Type.Integer(),
      tailBytes: Type.Integer(),
    }),
  }),
]);

export const PromptFileFinder = new PromptTools(tools, parser, (messages: DbMessage[]) => [
  {
    role: 'system',
    content: `You are an agentic system for helping the user to find files or directories on their computer based on a conversation with them. Please try and minimize the amount of data you pull into your context. For any command you want to run, you should add a brief description of what you're doing, and why.

${JSON.stringify({
  os: {
    type: os.type(), // e.g. 'Linux', 'Darwin', 'Windows_NT'
    platform: os.platform(), // e.g. 'linux', 'darwin', 'win32'
    arch: os.arch(), // e.g. 'x64'
    release: os.release(), // e.g. '5.15.0-1067-azure'
  },
  cwd: process.cwd(),
  homeDir: os.homedir(),
})}
`,
  },
  ...dbMessageToOpenAi(messages),
]);
