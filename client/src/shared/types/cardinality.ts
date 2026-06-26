export type CardinalitySymbol = "1" | "N" | "0..1" | "1..N" | "0..N";
export type Cardinality = `${CardinalitySymbol}:${CardinalitySymbol}`;

/**
 * Calculate relationship cardinality based on UNIQUE and NULL/NOT NULL constraints.
 * Format: "left:right" where left = referenced table, right = FK table.
 */
export function calculateCardinality(
  pkColumn: { isPrimaryKey?: boolean; isUnique?: boolean } | undefined,
  fkColumn: { isUnique?: boolean; isNullable?: boolean }
): Cardinality {
  const fkIsUnique = fkColumn.isUnique || false;
  const fkIsNullable = fkColumn.isNullable !== false;
  const leftSide: CardinalitySymbol = fkIsNullable ? "0..1" : "1";

  let rightSide: CardinalitySymbol;
  if (fkIsUnique) {
    rightSide = "1";
  } else if (fkColumn.isNullable === false) {
    rightSide = "1..N";
  } else if (fkColumn.isNullable === true) {
    rightSide = "0..N";
  } else {
    rightSide = "N";
  }

  return `${leftSide}:${rightSide}` as Cardinality;
}

/**
 * Parse a Cardinality string into left/right symbols plus convenience flags.
 */
export function parseCardinality(cardinality: Cardinality): {
  left: CardinalitySymbol;
  right: CardinalitySymbol;
  leftIsMany: boolean;
  rightIsMany: boolean;
} {
  const [leftRaw, rightRaw] = cardinality.split(":") as [
    CardinalitySymbol,
    CardinalitySymbol,
  ];

  const isMany = (symbol: CardinalitySymbol): boolean =>
    symbol === "N" || symbol === "0..N" || symbol === "1..N";

  return {
    left: leftRaw,
    right: rightRaw,
    leftIsMany: isMany(leftRaw),
    rightIsMany: isMany(rightRaw),
  };
}
