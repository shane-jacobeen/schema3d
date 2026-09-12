import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { FormatSelector } from "@/visualizer/ui/schema/format-selector";

describe("FormatSelector", () => {
  it("renders SQL, Mermaid, and DrawDB options", () => {
    render(<FormatSelector value="sql" onChange={vi.fn()} />);
    expect(screen.getByLabelText("SQL format")).toBeInTheDocument();
    expect(screen.getByLabelText("Mermaid format")).toBeInTheDocument();
    expect(screen.getByLabelText("DrawDB JSON format")).toBeInTheDocument();
  });

  it("highlights DrawDB when value is drawdb", () => {
    render(<FormatSelector value="drawdb" onChange={vi.fn()} />);
    expect(screen.getByLabelText("DrawDB JSON format")).toHaveAttribute(
      "data-state",
      "on"
    );
  });

  it("calls onChange when DrawDB is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FormatSelector value="sql" onChange={onChange} />);
    await user.click(screen.getByLabelText("DrawDB JSON format"));
    expect(onChange).toHaveBeenCalledWith("drawdb");
  });
});
