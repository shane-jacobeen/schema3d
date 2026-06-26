import type { DatabaseSchema } from "@/shared/types/schema";
import { computeForceDirectedLayout } from "./force-layout-core";
import ForceLayoutWorker from "../workers/force-layout.worker?worker";

const WORKER_THRESHOLD = 50;

export function runForceDirectedLayout(
  schema: DatabaseSchema,
  viewMode: "2D" | "3D" = "3D"
): DatabaseSchema | Promise<DatabaseSchema> {
  if (schema.tables.length < WORKER_THRESHOLD) {
    return computeForceDirectedLayout(schema, viewMode);
  }

  return new Promise((resolve, reject) => {
    const worker = new ForceLayoutWorker();
    worker.onmessage = (event: MessageEvent<DatabaseSchema>) => {
      resolve(event.data);
      worker.terminate();
    };
    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };
    worker.postMessage({ schema, viewMode });
  });
}
