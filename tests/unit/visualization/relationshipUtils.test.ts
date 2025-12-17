import { describe, it, expect } from "vitest";
import {
  calculateCardinality,
  parseCardinality,
} from "@/visualizer/3d/components/relationships/relationship-utils";
import type { Cardinality } from "@/visualizer/3d/types";

describe("calculateCardinality", () => {
  it("should return 1:1 for unique PK and unique FK", () => {
    const pkColumn = { isPrimaryKey: true, isUnique: true };
    const fkColumn = { isUnique: true };

    const cardinality = calculateCardinality(pkColumn, fkColumn);
    expect(cardinality).toBe("1:1");
  });

  it("should return 1:N for unique PK and non-unique FK", () => {
    const pkColumn = { isPrimaryKey: true };
    const fkColumn = { isUnique: false };

    const cardinality = calculateCardinality(pkColumn, fkColumn);
    expect(cardinality).toBe("1:N");
  });

  it("should return N:1 for non-unique PK and unique FK", () => {
    const pkColumn = { isUnique: false };
    const fkColumn = { isUnique: true };

    const cardinality = calculateCardinality(pkColumn, fkColumn);
    expect(cardinality).toBe("N:1");
  });

  it("should return N:N for non-unique PK and non-unique FK", () => {
    const pkColumn = { isUnique: false };
    const fkColumn = { isUnique: false };

    const cardinality = calculateCardinality(pkColumn, fkColumn);
    expect(cardinality).toBe("N:N");
  });

  it("should handle undefined PK column", () => {
    const fkColumn = { isUnique: false };

    const cardinality = calculateCardinality(undefined, fkColumn);
    expect(cardinality).toBe("N:N");
  });

  it("should treat primary key as unique", () => {
    const pkColumn = { isPrimaryKey: true };
    const fkColumn = { isUnique: false };

    const cardinality = calculateCardinality(pkColumn, fkColumn);
    expect(cardinality).toBe("1:N");
  });
});

describe("parseCardinality", () => {
  it("should parse simple cardinality (1:N)", () => {
    const result = parseCardinality("1:N" as Cardinality);
    expect(result.left).toBe("1");
    expect(result.right).toBe("N");
    expect(result.leftIsMany).toBe(false);
    expect(result.rightIsMany).toBe(true);
  });

  it("should parse one-to-one cardinality (1:1)", () => {
    const result = parseCardinality("1:1" as Cardinality);
    expect(result.left).toBe("1");
    expect(result.right).toBe("1");
    expect(result.leftIsMany).toBe(false);
    expect(result.rightIsMany).toBe(false);
  });

  it("should parse many-to-many cardinality (N:N)", () => {
    const result = parseCardinality("N:N" as Cardinality);
    expect(result.left).toBe("N");
    expect(result.right).toBe("N");
    expect(result.leftIsMany).toBe(true);
    expect(result.rightIsMany).toBe(true);
  });

  it("should parse zero-or-one cardinality (0..1:1)", () => {
    const result = parseCardinality("0..1:1" as Cardinality);
    expect(result.left).toBe("0..1");
    expect(result.right).toBe("1");
    expect(result.leftIsMany).toBe(false);
    expect(result.rightIsMany).toBe(false);
  });

  it("should parse one-or-many cardinality (1:1..N)", () => {
    const result = parseCardinality("1:1..N" as Cardinality);
    expect(result.left).toBe("1");
    expect(result.right).toBe("1..N");
    expect(result.leftIsMany).toBe(false);
    expect(result.rightIsMany).toBe(true);
  });

  it("should parse zero-or-many cardinality (0..N:0..N)", () => {
    const result = parseCardinality("0..N:0..N" as Cardinality);
    expect(result.left).toBe("0..N");
    expect(result.right).toBe("0..N");
    expect(result.leftIsMany).toBe(true);
    expect(result.rightIsMany).toBe(true);
  });

  it("should correctly identify 'many' sides", () => {
    const testCases: Array<{
      cardinality: Cardinality;
      leftIsMany: boolean;
      rightIsMany: boolean;
    }> = [
      { cardinality: "1:1", leftIsMany: false, rightIsMany: false },
      { cardinality: "1:N", leftIsMany: false, rightIsMany: true },
      { cardinality: "N:1", leftIsMany: true, rightIsMany: false },
      { cardinality: "N:N", leftIsMany: true, rightIsMany: true },
      { cardinality: "0..1:1", leftIsMany: false, rightIsMany: false },
      { cardinality: "1:1..N", leftIsMany: false, rightIsMany: true },
      { cardinality: "0..N:0..N", leftIsMany: true, rightIsMany: true },
    ];

    testCases.forEach(({ cardinality, leftIsMany, rightIsMany }) => {
      const result = parseCardinality(cardinality);
      expect(result.leftIsMany).toBe(leftIsMany);
      expect(result.rightIsMany).toBe(rightIsMany);
    });
  });
});
