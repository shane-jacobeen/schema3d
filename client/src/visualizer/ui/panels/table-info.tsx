import { Key, Link } from "lucide-react";
import type { Table } from "@/shared/types/schema";
import { Panel } from "./panel";

interface TableInfoProps {
  table: Table;
  onClose: () => void;
}

export function TableInfo({ table, onClose }: TableInfoProps) {
  return (
    <Panel
      title={table.name}
      subtitle={table.isView ? "View" : `${table.category} Table`}
      onClose={onClose}
    >
      <div className="space-y-2">
        <h4 className="text-xs sm:text-sm font-semibold text-slate-300 mb-2">
          Columns
        </h4>
        {table.columns
          .filter((col) => !col.name.startsWith("_ref_")) // Filter out virtual relationship columns
          .map((column, index) => (
            <div
              key={index}
              className="bg-slate-800/80 rounded p-2 sm:p-3 border border-slate-700"
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs sm:text-sm font-medium text-white break-all">
                  {column.name}
                </span>
                {column.isPrimaryKey && (
                  <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">
                    <Key size={10} className="sm:w-3 sm:h-3" />
                    PK
                  </span>
                )}
                {column.isForeignKey && (
                  <span className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">
                    <Link size={10} className="sm:w-3 sm:h-3" />
                    FK
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono break-all">
                {column.type}
              </div>
              {column.references && (
                <div className="text-xs text-slate-500 mt-1 break-all">
                  References: {column.references.table}.
                  {column.references.column}
                </div>
              )}
              {table.isView && column.sourceTable && (
                <div className="text-xs text-slate-500 mt-1 break-all">
                  From: {column.sourceTable}
                  {column.sourceColumn &&
                    column.sourceColumn !== column.name && (
                      <>.{column.sourceColumn}</>
                    )}
                </div>
              )}
            </div>
          ))}
      </div>
    </Panel>
  );
}
