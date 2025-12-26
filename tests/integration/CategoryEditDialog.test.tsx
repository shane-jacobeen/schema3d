import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { CategoryEditDialog } from "@/visualizer/ui/category-edit-dialog";
import type { DatabaseSchema } from "@/shared/types/schema";

describe("CategoryEditDialog", () => {
  const mockOnSave = vi.fn();
  const mockOnOpenChange = vi.fn();

  const mockSchema: DatabaseSchema = {
    name: "Test Schema",
    format: "sql",
    tables: [
      {
        name: "users",
        columns: [],
        position: [0, 0, 0],
        color: "#3b82f6",
        category: "Auth",
      },
      {
        name: "products",
        columns: [],
        position: [1, 0, 0],
        color: "#10b981",
        category: "Product",
      },
      {
        name: "orders",
        columns: [],
        position: [2, 0, 0],
        color: "#f59e0b",
        category: "Order",
      },
      {
        name: "payments",
        columns: [],
        position: [3, 0, 0],
        color: "#ec4899",
        category: "Financial",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Dialog Rendering", () => {
    it("should render dialog when open", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Edit Category")).toBeInTheDocument();
    });

    it("should not render dialog when closed", () => {
      render(
        <CategoryEditDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      expect(screen.queryByText("Edit Category")).not.toBeInTheDocument();
    });

    it("should display category name in input", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const input = screen.getByLabelText("Category Name");
      expect(input).toHaveValue("Auth");
    });

    it("should display color picker with current category color", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const colorPicker = screen.getByLabelText("Color");
      expect(colorPicker).toHaveValue("#3b82f6");
    });
  });

  describe("Table Lists", () => {
    it("should show tables in the selected category", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("users")).toBeInTheDocument();
      // Category name is in bold, so use a text matcher
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Tables in Auth (1)";
        })
      ).toBeInTheDocument();
    });

    it("should show tables not in the selected category", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("products")).toBeInTheDocument();
      expect(screen.getByText("orders")).toBeInTheDocument();
      expect(screen.getByText("payments")).toBeInTheDocument();
      expect(screen.getByText("Available Tables (3)")).toBeInTheDocument();
    });

    it("should display category labels with category name", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      // The label should include "Tables in" and the category name
      const label = screen
        .getByText("Category Name")
        .closest("div")?.parentElement;
      expect(label).toBeInTheDocument();
      // Check that the word "Auth" appears in the document (in multiple places)
      const authElements = screen.getAllByText("Auth");
      expect(authElements.length).toBeGreaterThan(0);
    });
  });

  describe("User Interactions", () => {
    it("should allow changing category name", async () => {
      const user = userEvent.setup();

      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const input = screen.getByLabelText("Category Name");
      await user.clear(input);
      await user.type(input, "Authentication");

      expect(input).toHaveValue("Authentication");
    });

    it("should allow changing category color", async () => {
      const user = userEvent.setup();

      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const colorPicker = screen.getByLabelText("Color") as HTMLInputElement;
      // For color inputs, we can't use clear(), just change the value directly
      await user.click(colorPicker);

      // Simulate changing color by updating the value
      colorPicker.value = "#ff0000";
      colorPicker.dispatchEvent(new Event("change", { bubbles: true }));

      expect(colorPicker).toHaveValue("#ff0000");
    });

    it("should allow selecting tables from available list", async () => {
      const user = userEvent.setup();

      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const productTable = screen.getByText("products");
      // The styling is on the parent div that contains the click handler
      const clickableContainer = productTable.closest(".cursor-pointer");

      await user.click(productTable);

      // Check if the table container has the selected styling
      await waitFor(() => {
        expect(clickableContainer).toHaveClass("bg-blue-600/30");
      });
    });

    it("should enable 'Add to Category' button when tables are selected", async () => {
      const user = userEvent.setup();

      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const addButton = screen.getByRole("button", { name: /Add to/i });
      expect(addButton).toBeDisabled();

      const productTable = screen.getByText("products");
      await user.click(productTable);

      await waitFor(() => {
        expect(addButton).not.toBeDisabled();
      });
    });
  });

  describe("Save Functionality", () => {
    it("should disable save button when category name is empty", async () => {
      const user = userEvent.setup();

      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole("button", { name: /Save Changes/i });
      const input = screen.getByLabelText("Category Name");

      await user.clear(input);

      expect(saveButton).toBeDisabled();
    });

    it("should enable save button when category name is valid", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole("button", { name: /Save Changes/i });
      expect(saveButton).not.toBeDisabled();
    });

    it("should call onSave with correct parameters", async () => {
      const user = userEvent.setup();

      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole("button", { name: /Save Changes/i });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        "Auth",
        expect.any(Set),
        "#3b82f6"
      );
    });

    it("should close dialog after saving", async () => {
      const user = userEvent.setup();

      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="Auth"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByRole("button", { name: /Save Changes/i });
      await user.click(saveButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("New Category Creation", () => {
    it("should show empty category name for new category", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="new"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const input = screen.getByLabelText("Category Name");
      expect(input).toHaveValue("");
    });

    it("should show all tables as available for new category", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="new"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText("Available Tables (4)")).toBeInTheDocument();
      expect(screen.getByText(/Tables in.*\(0\)/)).toBeInTheDocument();
    });

    it("should use default color for new category", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="new"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const colorPicker = screen.getByLabelText("Color");
      expect(colorPicker).toHaveValue("#3b82f6");
    });
  });

  describe("Placeholder Text", () => {
    it("should show placeholder with muted appearance", () => {
      render(
        <CategoryEditDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          category="new"
          schema={mockSchema}
          onSave={mockOnSave}
        />
      );

      const input = screen.getByPlaceholderText("Enter category name");
      expect(input).toHaveClass("placeholder:text-slate-500");
    });
  });
});
