import type { DatabaseSchema } from "@/shared/types/schema";
import { computeForceDirectedLayout } from "./force-layout-core";
import ForceLayoutWorker from "./workers/force-layout.worker?worker";

/** Schemas at or above this table count use a web worker for force layout. */
export const FORCE_LAYOUT_WORKER_THRESHOLD = 50;

export function runForceDirectedLayout(
  schema: DatabaseSchema,
  viewMode: "2D" | "3D" = "3D"
): DatabaseSchema | Promise<DatabaseSchema> {
  if (schema.tables.length < FORCE_LAYOUT_WORKER_THRESHOLD) {
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
