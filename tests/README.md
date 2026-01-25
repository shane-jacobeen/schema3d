# Testing Documentation

This directory contains all test files for the Schema3D project: **176 tests** across **13 test files**, providing comprehensive coverage of core functionality.

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
├── unit/                       # Unit tests for individual functions (125 tests)
│   ├── filtering/              # Category filtering (36 tests)
│   │   ├── categoryFiltering.test.ts   # 18 tests - guessCategory, color palette
│   │   └── categoryManagement.test.ts  # 18 tests - Category operations, validation
│   ├── layout/                 # Layout algorithms (8 tests)
│   │   └── initialLayoutState.test.ts  # Layout/view mode consistency
│   ├── parsers/                # Schema parsers (26 tests)
│   │   ├── sqlParser.test.ts           # 14 tests - SQL parsing, FKs, views
│   │   └── mermaidParser.test.ts       # 12 tests - ER diagrams, cardinality
│   ├── schema/                 # Schema utilities (9 tests)
│   │   └── schemaUtils.test.ts         # Schema comparison, conversion
│   ├── url-encoding/           # URL management (15 tests)
│   │   └── urlState.test.ts            # Hash parsing, shareable URLs
│   └── visualization/          # Visualization (17 tests)
│       └── relationshipUtils.test.ts   # Cardinality, FK/PK analysis
├── integration/                # Integration/component tests (51 tests)
│   ├── CategoryEditDialog.test.tsx  # 21 tests - Category UI interactions
│   ├── SchemaControls.test.tsx      # 4 tests - Schema selection, format switching
│   ├── SchemaEditor.test.tsx        # 5 tests - Text editor, syntax highlighting
│   ├── urlSchemaRoundTrip.test.ts   # 16 tests - Schema encoding/decoding
│   └── viewStateRoundTrip.test.ts   # 19 tests - View state preservation, sharing
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

## What's Tested

The test suite provides comprehensive coverage across all core domains:

- ✅ **SQL & Mermaid Parsing** - CREATE TABLE, foreign keys, views, ER diagrams, cardinality, T-SQL syntax
- ✅ **Schema Conversion** - SQL ↔ Mermaid format conversion with full fidelity, relationship preservation
- ✅ **Category Management** - Auto-assignment, filtering, custom categories, color management, validation
- ✅ **Layout Algorithms** - Force-directed, hierarchical, circular layouts with 2D/3D modes
- ✅ **URL Sharing** - Schema and view state encoding, compression, backward compatibility, prefix handling
- ✅ **Relationship Analysis** - Cardinality calculation (1:1, 1:N, 0..1:1, etc.), FK detection, constraint handling
- ✅ **UI Components** - Schema editor, category dialog, controls, validation feedback, user interactions
- ✅ **Round-Trip Integrity** - Schema encoding/decoding, view state preservation, data integrity through share cycle
- ✅ **Error Handling** - Invalid SQL/Mermaid, corrupted URLs, empty inputs, edge cases

## Test Suites

### Unit Tests (125 tests)

#### Filtering (`tests/unit/filtering/`) - 36 tests

- **categoryFiltering.test.ts** (18 tests) - Tests for the `guessCategory` function and color palette:
  - Table name categorization (Auth, Product, Order, Customer, Content, Financial, Notification, Log, System, General)
  - Case-insensitivity and prefix/suffix handling
  - Priority matching for overlapping keywords
  - Color palette validation (15 unique hex colors, all valid hex format, starts with blue)

- **categoryManagement.test.ts** (18 tests) - Tests for category management logic:
  - Category assignment based on table names
  - Unique color assignment per category
  - Category filtering and toggling (selected/unselected states)
  - Category renaming across all tables
  - Moving tables between categories
  - Updating category colors globally
  - Category validation (non-empty names, capitalization, color format)
  - Edge cases (empty schemas, single category, all tables in one category)

#### Layout (`tests/unit/layout/`) - 8 tests

- **initialLayoutState.test.ts** (8 tests) - Tests for initial layout state consistency:
  - Default layout (force) in default view mode (3D)
  - 2D vs 3D mode produce different table positions
  - Different layout algorithms (force, hierarchical, circular) produce different positions
  - Verifies default layout type is "force" and default view mode is "3D"
  - Ensures initial schema matches manually applied default layout
  - Confirms table properties (color, category) are preserved after layout application

#### Parsers (`tests/unit/parsers/`) - 26 tests

- **sqlParser.test.ts** (14 tests) - SQL schema parsing tests:
  - Simple CREATE TABLE statements with columns and types
  - Table-level and column-level FOREIGN KEY constraints
  - T-SQL bracketed identifiers and schema prefixes
  - ALTER TABLE ADD statements
  - UNIQUE and NOT NULL constraints
  - Cardinality calculation from NULL/NOT NULL and UNIQUE constraints
  - Multiple tables with relationships
  - CREATE VIEW statement parsing and SQL generation
  - Error handling for invalid SQL
  - SQL block validation (identifyValidSqlBlocks)

- **mermaidParser.test.ts** (12 tests) - Mermaid ER diagram parsing tests:
  - Simple entity definitions with columns
  - Relationship parsing with cardinality notation (||, o, {, |{, o{)
  - All cardinality types (1:1, 1:N, N:N, 0..1:1, etc.)
  - Cardinality normalization when FK is on left or right side
  - Multiple constraints per column (PK, FK, UK)
  - Tables defined only by relationships (implicit entities)
  - Complex relationships with all cardinality symbols
  - Error handling for invalid Mermaid syntax
  - Mermaid block validation (identifyValidMermaidBlocks)

#### Schema (`tests/unit/schema/`) - 9 tests

- **schemaUtils.test.ts** (9 tests) - Schema utility function tests:
  - `areSchemasEqual` - Schema comparison ignoring visual properties (position, color)
  - Detects differences in table count, column types, foreign key relationships
  - Case-insensitive table and column name comparison
  - `schemaToFormat` - Conversion between SQL and Mermaid formats
  - Preserves relationships through format conversion

#### URL Encoding (`tests/unit/url-encoding/`) - 15 tests

- **urlState.test.ts** (15 tests) - URL state management tests:
  - `getSchemaFromHash` - Parses hash with different prefixes (pako, sql, mermaid, schema)
  - Handles uppercase prefixes and auto-detection
  - Error handling for invalid/corrupted encoded data
  - `removeSchemaFromUrl` - Removes hash from URL
  - `hasSchemaInUrl` - Validates schema presence in URL
  - `createShareableUrl` - Generates shareable URLs with proper format
  - Preserves origin and pathname in generated URLs

#### Visualization (`tests/unit/visualization/`) - 17 tests

- **relationshipUtils.test.ts** (17 tests) - Foreign key relationship utility tests:
  - `calculateCardinality` - Determines relationship cardinality from constraints:
    - 1:1 (unique FK, NOT NULL)
    - 0..1:1 (unique FK, nullable)
    - 1:1..N (non-unique FK, NOT NULL)
    - 0..1:0..N (non-unique FK, nullable)
    - Handles undefined isNullable conservatively
    - Treats primary keys as unique
  - `parseCardinality` - Parses cardinality strings (1:N, 1:1, N:N, 0..1:1, etc.)

### Integration Tests (51 tests)

#### Component Tests (`tests/integration/`)

- **CategoryEditDialog.test.tsx** (21 tests) - Category edit dialog component tests:
  - Dialog rendering (open/closed states, proper UI elements)
  - Category name and color input fields display correct values
  - Table lists (tables in category vs available tables, sorted alphabetically)
  - Category labels display with correct category name
  - User interactions (name change, color picker, table selection via checkboxes)
  - Transfer functionality (add/remove tables between category and available lists)
  - Save functionality (validates non-empty name, calls onSave with correct data, closes dialog)
  - New category creation (empty name, all tables available, default color, validation)
  - Placeholder text styling (muted appearance for empty states)

- **SchemaControls.test.tsx** (4 tests) - Schema controls component tests:
  - Schema selector dialog rendering
  - Sample schema selection functionality
  - Format switching (SQL ↔ Mermaid)
  - Schema validation feedback display

- **SchemaEditor.test.tsx** (5 tests) - Schema editor component tests:
  - Editor rendering as textbox
  - onChange callback on user typing
  - Newline character handling
  - Syntax highlighting based on format (SQL vs Mermaid)
  - Paste event handling

#### Round-Trip Tests (`tests/integration/`)

- **urlSchemaRoundTrip.test.ts** (16 tests) - Schema encoding/decoding integration tests:
  - Round-trip all sample schemas (Retailer, Blog Platform, University)
  - Schema conversion round-trips (SQL and Mermaid)
  - Cross-format compatibility (pako:, sql:, mermaid:, schema: prefixes)
  - Data integrity (preserves column details, handles large schemas efficiently)
  - Error handling (corrupted data, empty hash, missing prefix)
  - URL length and compression validation
  - Creates valid shareable URLs with proper format

- **viewStateRoundTrip.test.ts** (19 tests) - View state preservation and sharing tests:
  - View state serialization (all fields, special characters in names)
  - Error handling (invalid encoded data, empty strings)
  - URL integration (schema + view state, without view state, Mermaid format)
  - Full round-trip with sample schemas (Retailer, Blog Platform, University)
  - Backward compatibility (handles missing view state gracefully)
  - Corrupted view state handling
  - Layout algorithms and view modes preservation
  - Category customization (table mappings, complex reorganization scenarios)
  - URL length validation (reasonable size, minimal overhead)
  - Category visibility preservation (selected: true/false in shared URLs)
  - View (CREATE VIEW) statement preservation through share cycle

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
