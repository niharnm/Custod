import type { SignalRow } from "@/types/custod";

interface SignalTableProps {
  rows: SignalRow[];
}

export function SignalTable({ rows }: SignalTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <th className="px-5 py-4 font-semibold text-[#0f172a]">Source</th>
              <th className="px-5 py-4 font-semibold text-[#0f172a]">Signals</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.source}
                className={index % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]/50"}
              >
                <td className="px-5 py-4 align-top font-medium text-custod-primary">
                  {row.source}
                </td>
                <td className="px-5 py-4 text-custod-muted">{row.signals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
