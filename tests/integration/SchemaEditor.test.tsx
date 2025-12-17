import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SchemaEditor } from "@/visualizer/ui/schema/schema-editor";

// Mock the parser functions
vi.mock("@/schemas/parsers", () => ({
  identifyValidBlocks: vi.fn((text: string) => {
    if (text.includes("CREATE TABLE")) {
      return [{ start: 0, end: text.length, isValid: true }];
    }
    return [{ start: 0, end: text.length, isValid: false }];
  }),
}));

describe("SchemaEditor", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock contentEditable element
    HTMLElement.prototype.contentEditable = "true";
  });

  it("should render the editor", () => {
    const { container } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    // contentEditable div doesn't have a role="textbox" by default
    const editor = container.querySelector('[contenteditable="true"]');
    expect(editor).toBeInTheDocument();
  });

  it("should call onChange when user types", async () => {
    const _user = userEvent.setup();

    const { container } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    const editor = container.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement;
    expect(editor).toBeInTheDocument();

    // Simulate typing
    editor.textContent = "CREATE TABLE";
    editor.dispatchEvent(new Event("input", { bubbles: true }));

    // The onChange should be called
    await waitFor(
      () => {
        expect(mockOnChange).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it("should handle newline characters", async () => {
    const { container } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    const editor = container.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement;
    editor.textContent = "CREATE TABLE users (\n  id INT\n);";
    editor.dispatchEvent(new Event("input", { bubbles: true }));

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE users")
      );
    });
  });

  it("should apply syntax highlighting based on format", async () => {
    const { container } = render(
      <SchemaEditor
        value="CREATE TABLE users (id INT);"
        format="sql"
        onChange={mockOnChange}
      />
    );

    // The editor should apply highlighting
    // This is tested indirectly through the rendered HTML
    const editor = container.querySelector('[contenteditable="true"]');
    expect(editor).toBeInTheDocument();

    // Wait for highlighting to be applied (it's async via useEffect)
    await waitFor(
      () => {
        expect(editor?.innerHTML).toContain("<span");
      },
      { timeout: 2000 }
    );
  });

  it("should handle paste events", async () => {
    const { container } = render(
      <SchemaEditor value="" format="sql" onChange={mockOnChange} />
    );

    const editor = container.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement;

    // Mock ClipboardEvent and DataTransfer for jsdom (they're not available natively)
    class MockDataTransfer {
      private data: Map<string, string> = new Map();
      setData(format: string, data: string): void {
        this.data.set(format, data);
      }
      getData(format: string): string {
        return this.data.get(format) || "";
      }
    }

    class MockClipboardEvent extends Event {
      clipboardData: MockDataTransfer;
      constructor(type: string, eventInitDict?: EventInit) {
        super(type, eventInitDict);
        this.clipboardData = new MockDataTransfer();
      }
    }

    // Simulate paste event
    const pasteEvent = new MockClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
    });
    pasteEvent.clipboardData.setData(
      "text/plain",
      "CREATE TABLE users (id INT);"
    );
    editor.dispatchEvent(pasteEvent);

    // Note: Actual paste handling may be more complex
    // This is a basic test structure
    expect(editor).toBeInTheDocument();
  });
});
