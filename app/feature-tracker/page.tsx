import fs from "node:fs";
import path from "node:path";

export const metadata = {
  title: "Feature Tracker - LoanFlow",
};

type TrackerRow = Record<string, string>;

const VISIBLE_COLUMNS = [
  "ID",
  "Area",
  "Feature",
  "User story",
  "Current status",
  "Test result",
  "Error or UX issue",
  "Fix status",
  "Retest result",
];

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (inQuotes) {
      if (char === "\"") {
        if (input[i + 1] === "\"") {
          cell += "\"";
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function readTracker(): TrackerRow[] {
  const csv = fs.readFileSync(path.join(process.cwd(), "feature-status-tracker.csv"), "utf8");
  const [headers, ...rows] = parseCsv(csv.trimEnd());
  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
}

function statusClass(status: string) {
  if (status.includes("Fixed") || status.includes("passed")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (status.includes("TODO") || status.includes("Tracked")) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export default function FeatureTrackerPage() {
  const rows = readTracker();
  const passed = rows.filter((row) => row["Current status"].includes("passed")).length;
  const fixed = rows.filter((row) => row["Current status"].includes("Fixed")).length;
  const tracked = rows.filter((row) => row["Current status"].includes("Tracked")).length;

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Canonical QA spreadsheet
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Feature tracker
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          A live table view of feature-status-tracker.csv, showing user stories,
          expected behavior evidence, test results, fixes, and remaining TODOs.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <Metric label="Tracked stories" value={rows.length} />
        <Metric label="Tested passed" value={passed} />
        <Metric label="Fixed retested" value={fixed} />
        <Metric label="Residual TODO" value={tracked} />
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[96rem] divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                {VISIBLE_COLUMNS.map((column) => (
                  <th key={column} className="px-4 py-3">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.ID} className="align-top">
                  {VISIBLE_COLUMNS.map((column) => (
                    <td key={column} className="px-4 py-3">
                      {column === "Current status" ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass(
                            row[column],
                          )}`}
                        >
                          {row[column]}
                        </span>
                      ) : (
                        <span className={column === "ID" ? "font-mono text-xs" : ""}>
                          {row[column]}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase text-slate-500">{label}</div>
    </div>
  );
}
