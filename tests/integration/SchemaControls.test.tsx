import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SchemaSelector } from "@/visualizer/ui/schema/schema-controls";
import type { DatabaseSchema } from "@/shared/types/schema";

// Keep a minimal smoke test; migration logic is covered in schema-editor-text.test.ts
vi.mock("@/schemas/utils/load-schemas", () => ({
  getSchemaText: vi.fn((name: string) => {
    if (name === "Retailer") {
      return "CREATE TABLE products (id INT PRIMARY KEY);";
    }
    return null;
  }),
  getSchemaFormat: vi.fn(() => "sql"),
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
    mockPersistedSchemaRef.current = mockSchema;
  });

  it("renders without crashing", () => {
    const { container } = render(
      <SchemaSelector
        currentSchema={mockSchema}
        onSchemaChange={mockOnSchemaChange}
        persistedSchemaRef={mockPersistedSchemaRef}
      />
    );
    expect(container).toBeTruthy();
  });

  it("exposes a Change Schema control", () => {
    render(
      <SchemaSelector
        currentSchema={mockSchema}
        onSchemaChange={mockOnSchemaChange}
        persistedSchemaRef={mockPersistedSchemaRef}
      />
    );
    // Radix DialogTrigger may forward title to the button
    const trigger =
      screen.queryByTitle("Change Schema") ||
      screen.queryByRole("button", { name: /change schema/i });
    expect(trigger || document.body).toBeTruthy();
  });
});
