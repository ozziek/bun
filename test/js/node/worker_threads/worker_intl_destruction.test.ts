import { expect, test } from "bun:test";
import { isLinux } from "harness";
import path from "path";

test.skipIf(!isLinux)("worker Intl destruction exits cleanly", () => {
  expect([path.join(import.meta.dir, "worker_intl_destruction.fixture.ts")]).toRun();
});
