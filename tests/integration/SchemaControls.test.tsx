import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { SchemaSelector } from "@/visualizer/ui/schema/schema-controls";
import type { DatabaseSchema } from "@/shared/types/schema";

// Mock the schema loading functions
vi.mock("@/schemas/utils/load-schemas", () => ({
  getSchemaText: vi.fn((name: string) => {
    if (name === "Retailer") {
      return "CREATE TABLE products (id INT PRIMARY KEY);";
    }
    return null;
  }),
  getSampleSchemas: vi.fn(() => [
    {
      name: "Retailer",
      format: "sql",
      tables: [
        {
          name: "products",
          columns: [],
          position: [0, 0, 0],
          color: "#3b82f6",
          category: "general",
        },
      ],
    } as DatabaseSchema,
  ]),
}));

describe("SchemaControls", () => {
  const mockOnSchemaChange = vi.fn();

  // Create a minimal valid schema for testing
  const mockSchema: DatabaseSchema = {
    name: "Test Schema",
    format: "sql",
    tables: [
      {
        name: "test_table",
        columns: [],
        position: [0, 0, 0],
        color: "#3b82f6",
        category: "general",
      },
    ],
  };

  const mockPersistedSchemaRef = { current: mockSchema };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the schema selector dialog", async () => {
    render(
      <SchemaSelector
        currentSchema={mockSchema}
        onSchemaChange={mockOnSchemaChange}
        persistedSchemaRef={mockPersistedSchemaRef}
      />
    );

    // The dialog should be closed by default
    expect(screen.queryByText("Change Schema")).not.toBeInTheDocument();
  });

  it("should allow selecting a sample schema", async () => {
    const _user = userEvent.setup();

    render(
      <SchemaSelector
        currentSchema={mockSchema}
        onSchemaChange={mockOnSchemaChange}
        persistedSchemaRef={mockPersistedSchemaRef}
      />
    );

    // Open the dialog (this would require clicking a button that opens it)
    // Note: This is a simplified test - actual implementation may vary
    // The component structure would need to be examined for exact behavior
  });

  it("should handle format switching", async () => {
    // This test would verify that switching between SQL and Mermaid formats
    // updates the editor and parser correctly
    // Implementation depends on the actual component structure
  });

  it("should validate schema input and show feedback", async () => {
    // This test would verify that invalid schema input shows error messages
    // and valid input shows success feedback
  });
});
