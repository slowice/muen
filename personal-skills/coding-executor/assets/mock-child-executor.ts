import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

import type {
  TaskConfig,
  TaskExecutor,
  TaskMessage,
  TaskParams,
} from '../../../resources/claw-plugin/coding-tool/src/executor/types';

type MockEnvelope = {
  type: 'ready' | 'message' | 'complete' | 'protocol-error';
  pid: number;
  message?: TaskMessage;
  error?: string;
};

export class MockChildExecutor implements TaskExecutor {
  child: ChildProcessWithoutNullStreams | null = null;
  readonly envelopes: MockEnvelope[] = [];
  launches = 0;

  constructor(
    private readonly scriptPath: string,
    private readonly scenarioOrFile: string,
  ) {}

  execute(
    params: TaskParams,
    _config: TaskConfig,
    onMessage: (message: TaskMessage) => void,
  ): Promise<void> {
    this.launches += 1;
    const scenarioArgs = this.scenarioOrFile.endsWith('.json')
      ? ['--scenario-file', this.scenarioOrFile]
      : ['--scenario', this.scenarioOrFile];
    this.child = spawn(
      process.execPath,
      [this.scriptPath, ...scenarioArgs],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );

    return new Promise<void>((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let completed = false;
      this.child!.stderr.setEncoding('utf8');
      this.child!.stderr.on('data', (chunk: string) => {
        stderr += chunk;
      });
      this.child!.stdout.setEncoding('utf8');
      this.child!.stdout.on('data', (chunk: string) => {
        stdout += chunk;
        let newline = stdout.indexOf('\n');
        while (newline >= 0) {
          const line = stdout.slice(0, newline).trim();
          stdout = stdout.slice(newline + 1);
          if (line) {
            const envelope = JSON.parse(line) as MockEnvelope;
            this.envelopes.push(envelope);
            if (envelope.type === 'message' && envelope.message) {
              onMessage(envelope.message);
            } else if (envelope.type === 'complete') {
              completed = true;
              this.child?.kill();
              resolve();
            } else if (envelope.type === 'protocol-error') {
              reject(new Error(envelope.error));
            }
          }
          newline = stdout.indexOf('\n');
        }
      });
      this.child!.once('error', reject);
      this.child!.once('close', (code) => {
        if (!completed) {
          reject(new Error(`Mock executor exited early (${code}): ${stderr}`));
        }
      });
      this.child!.stdin.write(`${JSON.stringify({
        type: 'execute',
        prompt: params.prompt,
        workdir: params.workdir,
        sessionid: params.sessionid,
      })}\n`);
    });
  }

  async answerQuestion(questionId: string, answer: string): Promise<void> {
    if (!this.child?.stdin.writable) {
      throw new Error('Mock executor stdin is not writable');
    }
    this.child.stdin.write(`${JSON.stringify({
      type: 'answer',
      questionId,
      answer,
    })}\n`);
  }

  abort(): void {
    this.child?.kill();
  }
}
