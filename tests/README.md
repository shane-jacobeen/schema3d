# Testing Documentation

This directory contains all test files for the Schema3D project.

## Test Framework

We use [Vitest](https://vitest.dev/) as our test framework, which is optimized for Vite projects and provides:

- Fast test execution
- Built-in TypeScript support
- React Testing Library integration
- Coverage reporting with v8

## Directory Structure

```
tests/
├── setup.ts                    # Test setup and global configuration
├── unit/                        # Unit tests for individual functions
│   ├── filtering/              # Category filtering tests
│   │   ├── categoryFiltering.test.ts   # guessCategory function, color palette
│   │   └── categoryManagement.test.ts  # Category assignment, filtering logic, management
│   ├── parsers/                # Parser tests
│   │   ├── sqlParser.test.ts
│   │   └── mermaidParser.test.ts
│   ├── schema/                 # Schema utility tests
│   │   └── schemaUtils.test.ts
│   └── visualization/          # Visualization utility tests
│       └── relationshipUtils.test.ts
├── integration/                 # Integration/component tests
│   ├── CategoryEditDialog.test.tsx  # Category edit dialog interactions
│   ├── SchemaControls.test.tsx
│   └── SchemaEditor.test.tsx
├── examples/                   # Example/test schema files
│   └── test-missing-table-fk.sql
├── MANUAL_TEST_CHECKLIST.md    # Manual testing guide
└── README.md                   # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Running Specific Tests

```bash
# Run only unit tests
npm run test -- tests/unit

# Run only integration tests
npm run test -- tests/integration

# Run filtering tests
npm run test -- tests/unit/filtering

# Run a specific test file
npm run test -- tests/unit/parsers/sqlParser.test.ts
npm run test -- tests/unit/filtering/categoryFiltering.test.ts
npm run test -- tests/integration/CategoryEditDialog.test.tsx
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { parseSqlSchema } from "@/lib/parsers/sqlParser";

describe("parseSqlSchema", () => {
  it("should parse a simple CREATE TABLE statement", () => {
    const sql = "CREATE TABLE users (id INT PRIMARY KEY);";
    const schema = parseSqlSchema(sql);
    expect(schema).not.toBeNull();
    expect(schema?.tables).toHaveLength(1);
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SchemaEditor } from "@/components/controls/schema/SchemaEditor";

describe("SchemaEditor", () => {
  it("should render the editor", () => {
    render(<SchemaEditor value="" onChange={() => {}} />);
    const editor = screen.getByRole("textbox");
    expect(editor).toBeInTheDocument();
  });
});
```

## Coverage

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view the interactive coverage report.

### Coverage Thresholds

- **Lines**: 50%
- **Functions**: 50%
- **Branches**: 40%
- **Statements**: 50%

These are intentionally low to start - increase them as test coverage improves.

## Test Suites

### Unit Tests

#### Filtering (`tests/unit/filtering/`)

- **categoryFiltering.test.ts** - Tests for the `guessCategory` function and color palette:
  - Table name categorization (Auth, Product, Order, Customer, Content, Financial, Notification, Log, System, General)
  - Case-insensitivity and prefix/suffix handling
  - Color palette validation (15 unique hex colors)

- **categoryManagement.test.ts** - Tests for category management logic:
  - Category assignment based on table names
  - Color assignment per category
  - Category filtering and toggling
  - Category renaming across all tables
  - Moving tables between categories
  - Updating category colors
  - Category validation (name and color format)
  - Edge cases (empty schemas, single category, empty categories)

#### Parsers (`tests/unit/parsers/`)

- **sqlParser.test.ts** - SQL schema parsing tests
- **mermaidParser.test.ts** - Mermaid ER diagram parsing tests

#### Schema (`tests/unit/schema/`)

- **schemaUtils.test.ts** - Schema utility function tests

#### Visualization (`tests/unit/visualization/`)

- **relationshipUtils.test.ts** - Foreign key relationship utility tests

### Integration Tests

#### Component Tests (`tests/integration/`)

- **CategoryEditDialog.test.tsx** - Category edit dialog component tests:
  - Dialog rendering (open/closed states)
  - Category name and color display
  - Table lists (tables in category, available tables)
  - User interactions (name change, color change, table selection)
  - Transfer buttons (add/remove tables with icon-only buttons)
  - Save functionality (validation, callbacks)
  - New category creation workflow
  - Placeholder and styling validation

- **SchemaControls.test.tsx** - Schema controls component tests
- **SchemaEditor.test.tsx** - Schema editor component tests

## Test Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the function/component does, not how it does it.

2. **Use Descriptive Test Names**: Test names should clearly describe what is being tested.

3. **Arrange-Act-Assert Pattern**: Structure tests with clear sections for setup, execution, and verification.

4. **Test Edge Cases**: Include tests for:
   - Empty inputs
   - Invalid inputs
   - Boundary conditions
   - Error cases

5. **Keep Tests Independent**: Each test should be able to run in isolation.

6. **Mock External Dependencies**: Use Vitest's mocking capabilities for API calls, file system, etc.

## Manual Testing

Automated tests don't cover everything. See [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md) for manual testing procedures that should be performed before releases.

## Continuous Integration

Tests should be run automatically in CI/CD pipelines. Ensure all tests pass before merging pull requests.
