// Copy this file and mock-child-executor.ts into tests/unit/coding-tool/.
// Override CODING_EXECUTOR_MOCK_PATH if the skill lives elsewhere.
// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';

import { registerExecutor } from '../../../resources/claw-plugin/coding-tool/src/executor/factory';
import { codingQuestionBroker } from '../../../resources/claw-plugin/coding-tool/src/question-broker';
import { createCodingTool } from '../../../resources/claw-plugin/coding-tool/src/tool';
import { MockChildExecutor } from './mock-child-executor';

const MOCK_SCRIPT = process.env.CODING_EXECUTOR_MOCK_PATH;

if (!MOCK_SCRIPT) {
  throw new Error('Set CODING_EXECUTOR_MOCK_PATH to the installed coding-executor mock script');
}

async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), 2_000);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

describe('coding executor subprocess contract', () => {
  let executor: MockChildExecutor | undefined;

  afterEach(() => {
    executor?.abort();
    executor = undefined;
  });

  function createTool(scenario: string, sessionKey: string) {
    registerExecutor({
      // Use an executor name already recognized by the Coding Tool routing path.
      type: 'remote-codeagentcc',
      create: () => {
        executor = new MockChildExecutor(MOCK_SCRIPT, scenario);
        return executor;
      },
    });
    return createCodingTool(
      { defaultTimeout: 5, keepaliveInterval: 60 },
      undefined,
      sessionKey,
      process.cwd(),
    );
  }

  it('handles a normal text result', async () => {
    const tool = createTool('normal', 'mock-normal-session');
    const result = await tool.execute(
      'call-normal',
      { prompt: 'hello', executor: 'remote-codeagentcc' },
      undefined,
      undefined,
    );

    expect(executor?.launches).toBe(1);
    expect(result).toEqual(expect.objectContaining({
      content: [{ type: 'text', text: 'normal response' }],
      details: expect.objectContaining({ status: 'completed', output: 'normal response' }),
    }));
  });

  it('forwards tool-call views before the final result', async () => {
    const tool = createTool('tool-call', 'mock-tool-session');
    const views: unknown[] = [];
    const result = await tool.execute(
      'call-tool',
      { prompt: 'read a file', executor: 'remote-codeagentcc' },
      undefined,
      (update) => views.push(...(update.views ?? [])),
    );

    expect(views).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'tool',
        tool: expect.objectContaining({
          call_id: 'call-1',
          tool_name: 'read_file',
          status: 'completed',
          tool_output: 'fixture output',
        }),
      }),
    ]));
    expect(result.content).toEqual([{ type: 'text', text: 'tool finished' }]);
  });

  it('continues the same child process after AskQuestion is answered', async () => {
    const sessionKey = 'mock-question-session';
    const tool = createTool('ask-question', sessionKey);
    let markQuestionSeen: (() => void) | undefined;
    const questionSeen = new Promise<void>((resolve) => {
      markQuestionSeen = resolve;
    });

    const resultPromise = tool.execute(
      'call-question',
      { prompt: 'choose a mode', executor: 'remote-codeagentcc' },
      undefined,
      (update) => {
        if (update.details?.status === 'question') markQuestionSeen?.();
      },
    );

    await withTimeout(questionSeen, 'Timed out waiting for AskQuestion');
    expect(executor?.child?.exitCode).toBeNull();
    await expect(codingQuestionBroker.answerPending(sessionKey, 'Safe')).resolves.toBe(true);
    const result = await resultPromise;

    const pids = new Set(executor?.envelopes.map((entry) => entry.pid));
    expect(executor?.launches).toBe(1);
    expect(pids.size).toBe(1);
    expect(result.content).toEqual([{ type: 'text', text: 'continued:Safe' }]);
    await expect(codingQuestionBroker.answerPending(sessionKey, 'Safe')).resolves.toBe(false);
  });
});
