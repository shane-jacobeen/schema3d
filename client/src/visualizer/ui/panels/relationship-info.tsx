import { Key, Link } from "lucide-react";
import type { Relationship } from "@/visualizer/3d/types";
import { Panel } from "./panel";

interface RelationshipInfoProps {
  relationship: Relationship;
  onClose: () => void;
}

export function RelationshipInfo({
  relationship,
  onClose,
}: RelationshipInfoProps) {
  return (
    <Panel
      title="Relationship"
      subtitle="Foreign Key Reference"
      onClose={onClose}
    >
      <div className="space-y-3 sm:space-y-4">
        {/* From Table */}
        <div className="bg-slate-800/80 rounded p-2 sm:p-3 border border-slate-700">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              From Table
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs sm:text-sm font-medium text-white break-all">
              {relationship.fromTable}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <Link
                size={12}
                className="sm:w-3.5 sm:h-3.5 text-purple-400 flex-shrink-0"
              />
              <span className="text-xs text-slate-300">
                Foreign Key Column:
              </span>
            </div>
            <span className="font-mono text-xs sm:text-sm text-purple-400 ml-4 sm:ml-6 break-all block">
              {relationship.fkColumn}
            </span>
          </div>
        </div>

        {/* Cardinality */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Cardinality:
            </span>
            <span className="font-mono text-xs sm:text-sm font-medium text-green-400">
              {relationship.cardinality}
            </span>
          </div>
        </div>

        {/* To Table */}
        <div className="bg-slate-800/80 rounded p-2 sm:p-3 border border-slate-700">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              To Table
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs sm:text-sm font-medium text-white break-all">
              {relationship.toTable}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <Key
                size={12}
                className="sm:w-3.5 sm:h-3.5 text-blue-400 flex-shrink-0"
              />
              <span className="text-xs text-slate-300">
                Primary Key Column:
              </span>
            </div>
            <span className="font-mono text-xs sm:text-sm text-blue-400 ml-4 sm:ml-6 break-all block">
              {relationship.pkColumn}
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
