export interface Throttle {
  schedule<T>(task: () => Promise<T>): Promise<T>;
}

export function createThrottle(minIntervalMs: number): Throttle {
  let chain: Promise<unknown> = Promise.resolve();
  let lastRunAt = 0;

  function gate(): Promise<void> {
    const next = chain.then(async () => {
      const wait = minIntervalMs - (Date.now() - lastRunAt);
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      lastRunAt = Date.now();
    });
    chain = next.catch(() => undefined);
    return next;
  }

  return {
    schedule<T>(task: () => Promise<T>): Promise<T> {
      return gate().then(task);
    },
  };
}
