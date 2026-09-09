import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';

const SCRIPT_PATH = new URL('./mock-executor.mjs', import.meta.url);

function startMockExecutor(args) {
  const child = spawn(process.execPath, [SCRIPT_PATH.pathname, ...args], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const messages = [];
  const waiters = [];
  let stdout = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    let newline = stdout.indexOf('\n');
    while (newline >= 0) {
      const line = stdout.slice(0, newline).trim();
      stdout = stdout.slice(newline + 1);
      if (line) {
        const message = JSON.parse(line);
        messages.push(message);
        for (const waiter of [...waiters]) {
          if (waiter.predicate(message)) {
            clearTimeout(waiter.timeout);
            waiters.splice(waiters.indexOf(waiter), 1);
            waiter.resolve(message);
          }
        }
      }
      newline = stdout.indexOf('\n');
    }
  });

  function waitFor(predicate, timeoutMs = 2_000) {
    const existing = messages.find(predicate);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        timeout: setTimeout(() => {
          waiters.splice(waiters.indexOf(waiter), 1);
          reject(new Error(`Timed out waiting for mock executor message. stderr: ${stderr}`));
        }, timeoutMs),
      };
      waiters.push(waiter);
    });
  }

  function send(message) {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  async function stop() {
    if (child.exitCode === null) {
      send({ type: 'abort' });
      await new Promise((resolve) => child.once('close', resolve));
    }
  }

  return { child, messages, send, stop, waitFor };
}

test('normal scenario emits text and a completed result', async (t) => {
  const mock = startMockExecutor(['--scenario', 'normal']);
  t.after(() => mock.stop());

  const ready = await mock.waitFor((entry) => entry.type === 'ready');
  mock.send({ type: 'execute', prompt: 'hello' });
  const result = await mock.waitFor(
    (entry) => entry.type === 'message' && entry.message.type === 'result',
  );
  const complete = await mock.waitFor((entry) => entry.type === 'complete');

  assert.equal(result.message.status, 'completed');
  assert.equal(result.message.text, 'normal response');
  assert.equal(ready.pid, result.pid);
  assert.equal(result.pid, complete.pid);
});

test('tool-call scenario emits running and completed tool views', async (t) => {
  const mock = startMockExecutor(['--scenario', 'tool-call']);
  t.after(() => mock.stop());

  await mock.waitFor((entry) => entry.type === 'ready');
  mock.send({ type: 'execute', prompt: 'read a file' });
  await mock.waitFor((entry) => entry.type === 'complete');

  const toolViews = mock.messages
    .filter((entry) => entry.type === 'message')
    .flatMap((entry) => entry.message.views ?? [])
    .filter((view) => view.type === 'tool');
  assert.deepEqual(toolViews.map((view) => view.tool.status), ['running', 'completed']);
  assert.equal(toolViews[0].tool.call_id, 'call-1');
  assert.equal(toolViews[1].tool.tool_output, 'fixture output');
});

test('ask-question scenario waits for an answer and continues in the same process', async (t) => {
  const mock = startMockExecutor(['--scenario', 'ask-question']);
  t.after(() => mock.stop());

  const ready = await mock.waitFor((entry) => entry.type === 'ready');
  mock.send({ type: 'execute', prompt: 'choose a mode' });
  const question = await mock.waitFor(
    (entry) => entry.type === 'message' && entry.message.status === 'question',
  );

  assert.equal(mock.child.exitCode, null);
  assert.equal(mock.messages.some((entry) => entry.type === 'complete'), false);
  mock.send({ type: 'answer', questionId: 'question-1', answer: 'Safe' });

  const result = await mock.waitFor(
    (entry) => entry.type === 'message' && entry.message.type === 'result',
  );
  const complete = await mock.waitFor((entry) => entry.type === 'complete');
  assert.equal(result.message.text, 'continued:Safe');
  assert.equal(ready.pid, question.pid);
  assert.equal(question.pid, result.pid);
  assert.equal(result.pid, complete.pid);
});

test('scenario files can define custom execute events', async (t) => {
  const fixtureDir = await mkdtemp(join(tmpdir(), 'coding-executor-scenario-'));
  const scenarioPath = join(fixtureDir, 'custom.json');
  await writeFile(scenarioPath, JSON.stringify({
    name: 'custom',
    onExecute: [
      { type: 'message', message: { type: 'delta', text: 'custom:${prompt}' } },
      { type: 'complete' },
    ],
  }));
  const mock = startMockExecutor(['--scenario-file', scenarioPath]);
  t.after(() => mock.stop());

  await mock.waitFor((entry) => entry.type === 'ready');
  mock.send({ type: 'execute', prompt: 'hello' });
  const delta = await mock.waitFor(
    (entry) => entry.type === 'message' && entry.message.type === 'delta',
  );
  await mock.waitFor((entry) => entry.type === 'complete');

  assert.equal(delta.message.text, 'custom:hello');
});
