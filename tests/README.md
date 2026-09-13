# Testing Documentation

This directory contains all test files for the Schema3D project: **274 tests** across **29 test files**, covering parsers, state, visualization, and UI.

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
├── unit/
│   ├── filtering/              # Category filtering & management
│   ├── layout/                 # Initial layout / view mode
│   ├── parsers/
│   │   ├── drawdb/             # DrawDB detect, import, export, share fetch
│   │   ├── sqlParser.test.ts
│   │   ├── mermaidParser.test.ts
│   │   └── parsers.test.ts     # Multi-format detect / validate
│   ├── schema/                 # Schema utils, editor text, upload helpers
│   ├── schemas/                # Sample schema fixtures (Blog Platform)
│   ├── state/                  # Schema/view state + DrawDB query load
│   ├── url-encoding/           # Shareable URL encoding
│   └── visualization/          # Relationships, WebGL, graph build
├── integration/                # Component + round-trip tests
├── examples/                   # Example/test schema files
├── MANUAL_TEST_CHECKLIST.md    # Manual testing guide
└── README.md                   # This file
```

Run `npm test` for the current totals — counts above are a snapshot and may drift as tests are added.

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

# Run DrawDB parser tests
npm run test -- tests/unit/parsers/drawdb

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

- ✅ **SQL, Mermaid & DrawDB Parsing** - CREATE TABLE, FKs, views, ER diagrams, DrawDB JSON import/export, share fetch
- ✅ **Schema Conversion** - Round-trips across SQL / Mermaid / DrawDB with relationship preservation
- ✅ **Category Management** - Auto-assignment, filtering, custom categories, color management, validation
- ✅ **Layout Algorithms** - Force-directed, hierarchical, circular layouts with 2D/3D modes
- ✅ **URL Sharing** - Schema and view state encoding (including DrawDB), compression, backward compatibility
- ✅ **Relationship Analysis** - Cardinality calculation, FK detection, constraint handling
- ✅ **UI Components** - Schema editor, category dialog, controls, validation feedback, WebGL/chunk fallbacks
- ✅ **Round-Trip Integrity** - Schema encoding/decoding, view state preservation through share cycle
- ✅ **Error Handling** - Invalid SQL/Mermaid/DrawDB, truncated gists, rate limits, corrupted URLs, empty inputs

## Test Suites

### Unit Tests (`tests/unit/`)

- **filtering/** — Category guessing, colors, rename/move/filter operations
- **layout/** — Initial layout vs view-mode consistency
- **parsers/** — SQL, Mermaid, DrawDB detect/import/export/share-fetch, multi-format `parsers.test.ts`
- **schema/** — Schema comparison, editor text helpers, upload utils
- **schemas/** — Sample fixture coverage (Blog Platform DrawDB)
- **state/** — Schema/view state stores, `?drawdbShareId=` loading
- **url-encoding/** — Hash prefixes (`sql:`, `mermaid:`, `schema:`, pako)
- **visualization/** — Cardinality helpers, relationship graph, WebGL support

### Integration Tests (`tests/integration/`)

- **CategoryEditDialog.test.tsx** — Category editor UI
- **SchemaControls.test.tsx** — Schema selector / samples / validation
- **SchemaEditor.test.tsx** — Editor rendering and paste
- **urlSchemaRoundTrip.test.ts** / **viewStateRoundTrip.test.ts** — Share encode/decode
- **WebGLFallback.test.tsx** / **ChunkLoadErrorBoundary.test.tsx** — Graceful degradation

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
