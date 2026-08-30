import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { Component, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { ChunkLoadErrorBoundary } from "@/app/chunk-load-error-boundary";

vi.mock("posthog-js", () => ({
  default: { captureException: vi.fn() },
}));

const reloadMock = vi.fn();

function Thrower({ error }: { error: Error }): ReactNode {
  throw error;
}

// Outer boundary that proves a non-chunk error is re-thrown past the chunk one.
class CatchAll extends Component<
  { children: ReactNode },
  { caught: boolean }
> {
  state = { caught: false };
  static getDerivedStateFromError() {
    return { caught: true };
  }
  render() {
    return this.state.caught ? <p>outer caught</p> : this.props.children;
  }
}

describe("ChunkLoadErrorBoundary", () => {
  beforeEach(() => {
    sessionStorage.clear();
    reloadMock.mockClear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: reloadMock },
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reloads once on the first chunk load error", () => {
    render(
      <ChunkLoadErrorBoundary>
        <Thrower
          error={new Error("Failed to fetch dynamically imported module")}
        />
      </ChunkLoadErrorBoundary>
    );

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("shows a manual reload after a recent reload did not fix it", () => {
    sessionStorage.setItem("schema3d:chunk-reload-at", String(Date.now()));

    render(
      <ChunkLoadErrorBoundary>
        <Thrower
          error={new Error("'text/html' is not a valid JavaScript MIME type")}
        />
      </ChunkLoadErrorBoundary>
    );

    expect(reloadMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/new version of Schema3D is available/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reload page/i })
    ).toBeInTheDocument();
  });

  it("re-throws errors that are not chunk load failures", () => {
    render(
      <CatchAll>
        <ChunkLoadErrorBoundary>
          <Thrower error={new Error("render blew up")} />
        </ChunkLoadErrorBoundary>
      </CatchAll>
    );

    expect(screen.getByText(/outer caught/i)).toBeInTheDocument();
    expect(reloadMock).not.toHaveBeenCalled();
  });
});
