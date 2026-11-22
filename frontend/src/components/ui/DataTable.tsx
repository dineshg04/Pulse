
import type { ReactNode } from "react";

interface DataTableProps {
  children: ReactNode;
  minWidth?: string;
}

function DataTable({ children, minWidth = "750px" }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-left text-sm"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  );
}

export default DataTable;
