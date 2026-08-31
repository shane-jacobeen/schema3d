import { Card, CardContent } from "@/shared/ui-components/card";
import { Button } from "@/shared/ui-components/button";

interface ChunkLoadFallbackProps {
  /** Extra detail about the failure, shown to help the user report it. */
  detail?: string;
}

/**
 * Shown when a lazy route chunk fails to load and a reload did not fix it. A
 * stale client asks for a hashed chunk that a newer deploy removed, so the app
 * cannot render the route. This names the cause and offers a manual reload.
 */
export function ChunkLoadFallback({ detail }: ChunkLoadFallbackProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 px-6 py-12">
      <Card className="relative w-full max-w-xl border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur">
        <CardContent className="flex flex-col gap-6 p-8 sm:p-10">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">
              Update required
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              A new version of Schema3D is available.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-300">
              Part of the app could not load because your browser holds an old
              version. Reload the page to get the latest version.
            </p>
            {detail && (
              <p className="max-w-lg text-sm leading-6 text-slate-500">
                {detail}
              </p>
            )}
          </div>

          <div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
