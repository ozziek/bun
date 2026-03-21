import { Worker, isMainThread, parentPort } from "worker_threads";

const CONCURRENCY = Number.parseInt(process.env.WORKER_INTL_DESTRUCTION_CONCURRENCY ?? "4", 10);
const RUN_COUNT = Number.parseInt(process.env.WORKER_INTL_DESTRUCTION_RUN_COUNT ?? "200", 10);

function exerciseWorkerIntl() {
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date());
}

function exerciseParentIntl(n: number) {
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(2026, 0, (n % 28) + 1));
}

if (isMainThread) {
  for (let batch = 0; batch < RUN_COUNT; batch++) {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < CONCURRENCY; i++) {
      const worker = new Worker(import.meta.url, {
        env: process.env,
      });
      worker.ref();

      const promise = new Promise<void>((resolve, reject) => {
        worker.once("error", reject);
        worker.once("message", () => {
          worker
            .terminate()
            .then(() => resolve())
            .catch(reject);
        });
      });

      promises.push(promise);
    }

    await Promise.all(promises);
    exerciseParentIntl(batch);
    Bun.gc(true);
  }
} else {
  Bun.gc(true);
  exerciseWorkerIntl();
  await Bun.sleep(0);
  parentPort!.postMessage("done");
  await new Promise(() => {});
}
