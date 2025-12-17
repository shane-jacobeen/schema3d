# Manual Test Checklist

This document outlines key flows that should be manually verified before releases and during development.

## Prerequisites

- Development server running (`npm run dev`)
- Browser with developer tools open
- Test schemas available (Retailer, Blog Platform, University)

---

## Schema Loading Tests

### ✅ Load Sample Schemas

#### SQL Schemas

- [ ] **Retailer Schema**
  - Click "Change Schema" button
  - Select "Retailer" from sample schemas
  - Verify:
    - Schema loads without errors
    - All tables are visible in 3D view
    - Relationship lines are drawn correctly
    - Table colors are assigned by category

- [ ] **Blog Platform Schema**
  - Select "Blog Platform" from sample schemas
  - Verify:
    - Schema loads correctly
    - All relationships are displayed
    - No console errors

#### Mermaid Schema

- [ ] **University Schema**
  - Select "University" from sample schemas
  - Verify:
    - Mermaid format is detected/selected
    - Schema parses correctly
    - All tables and relationships render
    - Cardinality notation displays correctly (||, o{, |{, etc.)

---

## Schema Input Tests

### ✅ Paste Large Schemas

- [ ] **Large SQL Schema**
  - Open schema editor
  - Paste a large SQL schema (50+ tables)
  - Verify:
    - Schema parses without errors
    - All tables render in 3D view
    - Performance is acceptable (no lag)
    - Relationship lines are all visible
    - Camera can navigate smoothly

- [ ] **Large Mermaid Schema**
  - Switch format to Mermaid
  - Paste a large Mermaid ER diagram
  - Verify:
    - Parsing completes successfully
    - All entities and relationships are captured
    - Rendering is correct

### ✅ Format Switching

- [ ] **SQL to Mermaid**
  - Load a SQL schema
  - Switch format selector to "Mermaid"
  - Verify:
    - Editor content converts to Mermaid format
    - Schema structure is preserved
    - Relationships maintain cardinality

- [ ] **Mermaid to SQL**
  - Load a Mermaid schema
  - Switch format selector to "SQL"
  - Verify:
    - Editor content converts to SQL format
    - All tables and columns are present
    - Foreign key relationships are correct

### ✅ Validation Feedback

- [ ] **Invalid SQL**
  - Type invalid SQL in editor
  - Verify:
    - Invalid syntax is grayed out
    - Error message appears (if applicable)
    - Valid parts remain highlighted

- [ ] **Invalid Mermaid**
  - Type invalid Mermaid syntax
  - Verify:
    - Invalid blocks are grayed out
    - Error feedback is shown
    - Valid syntax remains visible

- [ ] **Valid Input**
  - Type valid schema syntax
  - Verify:
    - Syntax highlighting works correctly
    - No error messages appear
    - "OK" button is enabled

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
  - Inspect relationship lines
  - Verify:
    - One-to-one (||--||) shows donuts on both ends
    - One-to-many (||--o{) shows donut + crow's-foot
    - Many-to-many (o{--o{) shows crow's-foot on both ends
    - Zero-or-one (o--||) shows sphere + donut
    - One-or-many (|{--||) shows donut + crow's-foot at offset

- [ ] **Cardinality from Mermaid**
  - Load University schema (Mermaid)
  - Verify:
    - All cardinality types from Mermaid are rendered correctly
    - Symbols match the Mermaid notation (||, o, {, |{, })

### ✅ Table-Level Foreign Keys

- [ ] **Table-Level FK Constraints**
  - Load a schema with table-level FOREIGN KEY constraints
  - Verify:
    - Constraints are parsed correctly
    - Relationships are created
    - Lines render properly

---

## Responsive Design Tests

### ✅ Mobile/Small Viewport

- [ ] **Small Screen (Mobile)**
  - Resize browser to mobile width (< 768px)
  - Verify:
    - UI elements are accessible
    - Panels don't overlap
    - Controls are usable
    - 3D view is still interactive

- [ ] **Tablet Viewport**
  - Resize to tablet width (768px - 1024px)
  - Verify:
    - Layout adapts correctly
    - All features remain accessible
    - Touch interactions work (if applicable)

- [ ] **Large Screen**
  - Use full desktop width (> 1024px)
  - Verify:
    - All panels are visible
    - No unnecessary scrolling
    - Optimal use of screen space

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

- [ ] Switch between layouts multiple times
  - Verify:
    - Animations are smooth (60fps)
    - No stuttering or lag
    - Camera movements are fluid

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
