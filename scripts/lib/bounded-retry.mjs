/**
 * Bounded synchronous retry for flaky subprocess starts (e.g. supabase start on cold CI).
 */

const DEFAULT_STDERR_TAIL_LINES = 16;

/**
 * @param {string} [stderr]
 * @param {number} [lineCount]
 */
export function stderrTail(stderr, lineCount = DEFAULT_STDERR_TAIL_LINES) {
  if (!stderr || !String(stderr).trim()) return '(no stderr)';
  const lines = String(stderr).trimEnd().split('\n');
  return lines.slice(-lineCount).join('\n');
}

/**
 * @param {number} ms
 */
export function sleepMsSync(ms) {
  if (ms <= 0) return;
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    // intentional busy-wait for short CI backoffs in sync harness scripts
  }
}

/**
 * @param {{
 *   maxAttempts: number,
 *   backoffMs?: number[],
 *   label: string,
 *   attempt: (attemptIndex: number) => { status?: number, stdout?: string, stderr?: string },
 *   isSuccess?: (result: ReturnType<Parameters<typeof runSyncWithBoundedRetry>[0]['attempt']>) => boolean,
 *   sleep?: (ms: number) => void,
 *   log?: (message: string) => void,
 *   stderrTailLines?: number,
 * }} options
 */
export function runSyncWithBoundedRetry(options) {
  const {
    maxAttempts,
    backoffMs = [],
    label,
    attempt,
    isSuccess = (r) => (r.status ?? 1) === 0,
    sleep = sleepMsSync,
    log = (msg) => process.stderr.write(`${msg}\n`),
    stderrTailLines = DEFAULT_STDERR_TAIL_LINES,
  } = options;

  if (maxAttempts < 1) {
    throw new Error(`${label}: maxAttempts must be >= 1`);
  }

  /** @type {{ status?: number, stdout?: string, stderr?: string } | undefined} */
  let lastResult;
  /** @type {Error | undefined} */
  let lastThrow;

  for (let i = 1; i <= maxAttempts; i++) {
    log(`${label}: attempt ${i}/${maxAttempts}`);
    try {
      const result = attempt(i);
      lastResult = result;
      lastThrow = undefined;
      if (isSuccess(result)) {
        if (i > 1) log(`${label}: succeeded on attempt ${i}`);
        return result;
      }
      log(`${label}: attempt ${i} failed (status ${result.status ?? 'n/a'})`);
      log(`${label}: stderr tail:\n${stderrTail(result.stderr, stderrTailLines)}`);
    } catch (err) {
      lastThrow = err instanceof Error ? err : new Error(String(err));
      log(`${label}: attempt ${i} threw: ${lastThrow.message}`);
      if (lastThrow.stderr) {
        log(`${label}: stderr tail:\n${stderrTail(lastThrow.stderr, stderrTailLines)}`);
      }
    }
    if (i < maxAttempts) {
      const wait = backoffMs[i - 1] ?? backoffMs[backoffMs.length - 1] ?? 4000;
      log(`${label}: backing off ${wait}ms before retry`);
      sleep(wait);
    }
  }

  const detail =
    lastThrow?.message ??
    `exit status ${lastResult?.status ?? 'unknown'} — ${stderrTail(lastResult?.stderr, 4)}`;
  const err = new Error(`${label} failed after ${maxAttempts} attempt(s): ${detail}`);
  if (lastResult) {
    err.stdout = lastResult.stdout;
    err.stderr = lastResult.stderr;
  }
  throw err;
}