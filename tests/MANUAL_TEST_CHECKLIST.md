# Manual Test Checklist

This document outlines key flows that should be manually verified before releases and during development.

## Prerequisites

- Development server running (`npm run dev`)
- Browser with developer tools open
- Test schemas available (Retailer, Blog Platform, University)

---

## Schema Loading Tests

### ✅ Load Sample Schemas

- [ ] **Test All Sample Schemas**
  - Click "Change Schema" button
  - Test each schema (Retailer, Blog Platform, University)
  - Verify for each:
    - Schema loads without errors
    - All tables visible with correct colors
    - Relationship lines drawn correctly
    - Mermaid format auto-detected for University
    - Cardinality notation displays correctly
    - No console errors

---

## Schema Input Tests

### ✅ Large Schema Handling

- [ ] **Large Schemas (50+ tables)**
  - Test with both SQL and Mermaid formats
  - Verify:
    - Schema parses without errors
    - All tables and relationships render correctly
    - Performance is acceptable (no lag)
    - Camera navigation is smooth

### ✅ Format Switching

- [ ] **Bidirectional Format Conversion**
  - Test both SQL ↔ Mermaid conversions
  - Verify:
    - Editor content converts correctly
    - Schema structure is preserved
    - All tables, columns, and relationships maintained
    - Cardinality information retained

### ✅ Validation Feedback

- [ ] **Input Validation**
  - Test with both valid and invalid SQL/Mermaid syntax
  - Verify:
    - Invalid syntax is grayed out
    - Valid syntax has proper highlighting
    - Error feedback shown for invalid input
    - "OK" button enabled only for valid schemas

---

## Schema Changes & Rendering Tests

### ✅ Camera Recentering

- [ ] **Schema Change**
  - Load a schema
  - Change to a different schema
  - Verify:
    - Camera automatically recenters
    - New schema is fully visible
    - Animation is smooth

- [ ] **Table Selection**
  - Long-press a table
  - Verify:
    - Camera focuses on selected table
    - Table details panel opens
    - Related tables are highlighted

### ✅ Relationship Lines & Cardinality

- [ ] **Relationship Rendering**
  - Load a schema with relationships
  - Verify:
    - All foreign key relationships have lines
    - Lines connect correct tables
    - Lines are visible and properly colored

- [ ] **Cardinality Notation**
  - Test with both SQL and Mermaid schemas
  - Verify all cardinality types render correctly:
    - One-to-one (||--||) shows donuts on both ends
    - One-to-many (||--o{) shows donut + crow's-foot
    - Many-to-many (o{--o{) shows crow's-foot on both ends
    - Zero-or-one (o--||) shows sphere + donut
    - One-or-many (|{--||) shows donut + crow's-foot at offset

### ✅ Table-Level Foreign Keys

- [ ] **Table-Level FK Constraints**
  - Load a schema with table-level FOREIGN KEY constraints
  - Verify:
    - Constraints are parsed correctly
    - Relationships are created
    - Lines render properly

---

## Responsive Design Tests

### ✅ Viewport Responsiveness

- [ ] **Small Screens** (< 1024px)
  - Test mobile and tablet widths
  - Verify:
    - UI elements accessible and don't overlap
    - Controls remain usable
    - 3D view is interactive
    - Layout adapts appropriately

- [ ] **Desktop** (> 1024px)
  - Verify:
    - All panels visible
    - Optimal use of screen space
    - No unnecessary scrolling

---

## Edge Cases

### ✅ Empty Schema

- [ ] Submit empty schema
  - Verify: Appropriate error message

### ✅ Schema with No Relationships

- [ ] Load schema with only tables, no FKs
  - Verify: Tables render, no relationship lines

### ✅ Schema with Views

- [ ] Load schema containing CREATE VIEW statements
  - Verify: Views are parsed and displayed

### ✅ T-SQL Syntax

- [ ] Load schema with bracketed identifiers [TableName]
  - Verify: Parses correctly, displays properly

### ✅ Case Sensitivity

- [ ] Load schema with mixed case table/column names
  - Verify: Relationships match correctly regardless of case

---

## Performance Tests

### ✅ Large Schema Performance

- [ ] Load schema with 100+ tables
  - Verify:
    - Initial load time is acceptable (< 5 seconds)
    - Rendering is smooth
    - Interactions are responsive
    - No memory leaks during navigation

### ✅ Animation Performance

- [ ] **Layout Animation Smoothness**
  - Switch between layouts multiple times (Force → Hierarchical → Circular)
  - Verify:
    - Animations are smooth (60fps)
    - No stuttering or lag
    - Camera movements are fluid

- [ ] **Interrupted Animations**
  - Trigger a layout change (e.g., switch to Hierarchical)
  - Immediately trigger another action (e.g., switch to Circular)
  - Verify:
    - **No flash of connector lines** at incorrect positions
    - Smooth transition from current positions to new layout
    - Tables and relationships animate continuously without jumps

---

## URL Sharing & State Persistence

### ✅ Share URL with View State

- [ ] **Create Shareable URL**
  - Load a schema (e.g., Retailer)
  - Customize view: change layout to Hierarchical, switch to 2D mode
  - Toggle some category visibility (hide/show categories)
  - Click "Share" button
  - Verify:
    - URL is copied to clipboard
    - URL contains encoded schema and view state

- [ ] **Load from Shared URL**
  - Open a shared URL in new tab/incognito window
  - Verify:
    - Schema loads correctly
    - **Layout buttons show correct selection** (e.g., Hierarchical is selected)
    - **View mode buttons show correct selection** (2D or 3D)
    - Category visibility matches shared state
    - Categories have correct colors

- [ ] **Backward Compatibility**
  - Open an old URL without view state (schema only)
  - Verify:
    - Schema loads correctly
    - Default layout (Force) is selected
    - Default view mode (3D) is selected
    - All categories visible by default

---

## Browser Compatibility

### ✅ Chrome/Edge

- [ ] Test in latest Chrome/Edge
  - Verify: All features work correctly

### ✅ Firefox

- [ ] Test in latest Firefox
  - Verify: All features work correctly

### ✅ Safari

- [ ] Test in latest Safari
  - Verify: All features work correctly

---

## Notes

- Run these tests before each release
- Document any issues found
- Update checklist as new features are added
- Test on actual devices when possible (not just browser dev tools)
