import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { WebGLFallback } from "@/visualizer/3d/components/webgl-fallback";

describe("WebGLFallback", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("names the cause and offers a reload", () => {
    render(<WebGLFallback detail="WebGL context creation failed." />);

    expect(
      screen.getByText(/could not start the 3D view/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/WebGL context creation failed\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reload page/i })
    ).toBeInTheDocument();
  });

  it("shows the Brave shields hint on Brave", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      brave: { isBrave: () => Promise.resolve(true) },
    });

    render(<WebGLFallback />);

    expect(await screen.findByText(/lower shields/i)).toBeInTheDocument();
  });
});
