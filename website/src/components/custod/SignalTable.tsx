import type { SignalRow } from "@/types/custod";

interface SignalTableProps {
  rows: SignalRow[];
}

export function SignalTable({ rows }: SignalTableProps) {
  return (
    <div className="custod-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              <th className="px-5 py-4 font-semibold text-foreground">Source</th>
              <th className="px-5 py-4 font-semibold text-foreground">Signals</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.source}
                className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}
              >
                <td className="px-5 py-4 align-top font-medium text-primary">
                  {row.source}
                </td>
                <td className="px-5 py-4 text-muted-foreground">{row.signals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
