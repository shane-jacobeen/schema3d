import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { SchemaEditor } from "@/visualizer/ui/schema/schema-editor";

vi.mock("@/schemas/parsers", () => ({
  identifyValidBlocks: vi.fn((text: string) => {
    if (text.includes("CREATE TABLE")) {
      return [{ start: 0, end: text.length, isValid: true }];
    }
    return [{ start: 0, end: text.length, isValid: false }];
  }),
}));

function getEditor(container: HTMLElement): HTMLTextAreaElement {
  return container.querySelector("textarea") as HTMLTextAreaElement;
}

function pasteEvent(text: string): {
  clipboardData: { getData: (format: string) => string };
} {
  return {
    clipboardData: {
      getData: (format: string) => (format === "text/plain" ? text : ""),
    },
  };
}

describe("SchemaEditor", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the editor", () => {
    const { container } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    expect(getEditor(container)).toBeInTheDocument();
  });

  it("should call onChange when user types", () => {
    const { container } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    fireEvent.change(getEditor(container), {
      target: { value: "CREATE TABLE" },
    });

    expect(mockOnChange).toHaveBeenCalledWith("CREATE TABLE");
  });

  it("should handle newline characters", () => {
    const { container } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    fireEvent.change(getEditor(container), {
      target: { value: "CREATE TABLE users (\n  id INT\n);" },
    });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE users")
    );
  });

  it("should apply syntax highlighting based on format", () => {
    const { container } = render(
      <SchemaEditor
        value="CREATE TABLE users (id INT);"
        format="sql"
        onChange={mockOnChange}
      />
    );

    const highlight = container.querySelector("pre");
    expect(highlight?.querySelector("span")).toBeInTheDocument();
    expect(highlight?.textContent).toContain("CREATE TABLE users (id INT);");
  });

  it("should handle paste events", () => {
    const { container } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    fireEvent.paste(
      getEditor(container),
      pasteEvent("CREATE TABLE users (id INT);")
    );

    expect(mockOnChange).toHaveBeenCalledWith("CREATE TABLE users (id INT);");
  });

  it("does not throw if unmounted after paste", () => {
    const { container, unmount } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    fireEvent.paste(
      getEditor(container),
      pasteEvent("CREATE TABLE users (id INT);")
    );

    expect(() => unmount()).not.toThrow();
  });

  it("opts the editor out of browser translation", () => {
    const { container } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    expect(container.firstElementChild).toHaveAttribute("translate", "no");
  });
});
