import type { DatabaseSchema } from "@/shared/types/schema";
import { computeForceDirectedLayout } from "../utils/force-layout-core";

interface ForceLayoutMessage {
  schema: DatabaseSchema;
  viewMode: "2D" | "3D";
}

self.onmessage = (event: MessageEvent<ForceLayoutMessage>) => {
  const { schema, viewMode } = event.data;
  self.postMessage(computeForceDirectedLayout(schema, viewMode));
};

export {};
