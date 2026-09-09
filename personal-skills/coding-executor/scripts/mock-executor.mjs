#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const BUILTIN_SCENARIOS = {
  normal: {
    name: 'normal',
    onExecute: [
      { type: 'message', message: { type: 'delta', text: 'normal response' } },
      {
        type: 'message',
        message: {
          type: 'result',
          status: 'completed',
          text: 'normal response',
          output: 'normal response',
          sessionid: 'mock-normal-session',
        },
      },
      { type: 'complete' },
    ],
  },
  'tool-call': {
    name: 'tool-call',
    onExecute: [
      {
        type: 'message',
        message: {
          type: 'event',
          status: 'running',
          views: [{
            type: 'tool',
            tool: {
              call_id: 'call-1',
              task_id: 'task-1',
              tool_name: 'read_file',
              session_id: 'mock-tool-session',
              tool_use_result: '',
              tool_input: { path: 'README.md' },
              status: 'running',
            },
          }],
        },
      },
      {
        type: 'message',
        message: {
          type: 'event',
          status: 'running',
          views: [{
            type: 'tool',
            tool: {
              call_id: 'call-1',
              task_id: 'task-1',
              tool_name: 'read_file',
              session_id: 'mock-tool-session',
              tool_use_result: 'fixture output',
              tool_input: { path: 'README.md' },
              tool_output: 'fixture output',
              status: 'completed',
            },
          }],
        },
      },
      {
        type: 'message',
        message: {
          type: 'result',
          status: 'completed',
          text: 'tool finished',
          output: 'tool finished',
          sessionid: 'mock-tool-session',
        },
      },
      { type: 'complete' },
    ],
  },
  'ask-question': {
    name: 'ask-question',
    onExecute: [
      {
        type: 'message',
        message: {
          type: 'event',
          status: 'question',
          questionId: 'question-1',
          questions: [{
            header: 'Mode',
            question: 'Choose a mode',
            options: [{ label: 'Safe', description: 'Prefer safety' }],
          }],
        },
      },
    ],
    onAnswer: [
      {
        type: 'message',
        message: {
          type: 'result',
          status: 'completed',
          text: 'continued:${answer}',
          output: 'continued:${answer}',
          sessionid: 'mock-question-session',
        },
      },
      { type: 'complete' },
    ],
  },
};

function parseArguments(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid argument list: ${argv.join(' ')}`);
    }
    args.set(key, value);
  }
  return args;
}

function loadScenario(args) {
  const scenarioFile = args.get('--scenario-file');
  if (scenarioFile) {
    return JSON.parse(readFileSync(scenarioFile, 'utf8'));
  }
  const name = args.get('--scenario') ?? 'normal';
  const scenario = BUILTIN_SCENARIOS[name];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}`);
  }
  return scenario;
}

function substitute(value, variables) {
  if (typeof value === 'string') {
    return value.replace(/\$\{(pid|prompt|answer|questionId)\}/g, (_, key) => (
      String(variables[key] ?? '')
    ));
  }
  if (Array.isArray(value)) {
    return value.map((entry) => substitute(entry, variables));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, substitute(entry, variables)]),
    );
  }
  return value;
}

function emit(entry, variables) {
  const rendered = substitute(entry, variables);
  process.stdout.write(`${JSON.stringify({ ...rendered, pid: process.pid })}\n`);
}

const args = parseArguments(process.argv.slice(2));
const scenario = loadScenario(args);
let buffer = '';

emit({ type: 'ready', scenario: scenario.name ?? 'custom' }, { pid: process.pid });
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let newline = buffer.indexOf('\n');
  while (newline >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (line) {
      const input = JSON.parse(line);
      if (input.type === 'abort') {
        process.exit(0);
      }
      const entries = input.type === 'execute'
        ? scenario.onExecute
        : input.type === 'answer'
          ? scenario.onAnswer
          : undefined;
      if (!entries) {
        emit({ type: 'protocol-error', error: `Unexpected input type: ${input.type}` }, input);
      } else {
        const variables = { pid: process.pid, ...input };
        for (const entry of entries) {
          emit(entry, variables);
        }
      }
    }
    newline = buffer.indexOf('\n');
  }
});
