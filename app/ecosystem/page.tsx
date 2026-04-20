const PRODUCT_ROWS = [
  {
    product: "DeltaV Alarm Mosaic",
    does: "Visual alarm flood overview with characteristic grouping and activation history",
    isa: "Operation",
    copilot: "Copilot would consume Mosaic's alarm groupings as clustering input",
  },
  {
    product: "DeltaV Alarm Help",
    does: "In-context access to rationalization data: causes, consequences, responses",
    isa: "Operation",
    copilot: "Copilot references Alarm Help fields to generate root-cause text in handoffs",
  },
  {
    product: "AgileOps Database",
    does: "Master alarm database with approved attributes and rationalization records",
    isa: "Rationalization, Design, MOC",
    copilot: "Copilot pulls cause/consequence/response data from rationalization records",
  },
  {
    product: "AgileOps Dynamics",
    does: "State-based alarm suppression using predefined case logic",
    isa: "Design, Operation",
    copilot:
      "Dynamics handles known-state suppression; Copilot addresses novel-pattern clustering",
  },
  {
    product: "AgileOps Performance Analytics",
    does: "Alarm KPI dashboards and ISA-18.2 metric reporting",
    isa: "Monitoring & Assessment",
    copilot: "Analytics provides historical metrics; Copilot provides real-time shift narrative",
  },
  {
    product: "DeltaV Logbooks",
    does: "Manual shift dashboards, notes, tasks, reports",
    isa: "Operation",
    copilot: "Logbooks captures manual notes; Copilot auto-generates the narrative draft",
  },
  {
    product: "DeltaV Edge Environment",
    does: "Contextualized DeltaV data access for downstream apps",
    isa: "Enabling Platform",
    copilot: "Edge is the natural deployment surface for a copilot like this",
  },
];

const ISA_METRICS = [
  { metric: "Alarms per hour per console", value: "~6 avg acceptable · ~12 max manageable" },
  { metric: "Alarms per 10-min period", value: "~1 avg · ~2 max" },
  { metric: "Max alarms in 10-min period", value: "≤10" },
  { metric: "Time in flood", value: "~<1%" },
  { metric: "Chattering / fleeting alarms", value: "Zero target" },
  { metric: "Stale alarms", value: "<5 per day" },
  { metric: "Priority distribution", value: "~80% low · ~15% medium · ~5% high" },
];

const REFERENCES = [
  'Emerson, "Alarm Management for DeltaV," whitepaper, 2024',
  'Emerson, "DeltaV Alarm Mosaic," product datasheet',
  'Emerson, "DeltaV AgileOps," product datasheet',
  'Emerson, "DeltaV Alarm Help," product datasheet',
  'Emerson, "DeltaV Alarm Operations," whitepaper',
  'Emerson, "DeltaV Logbooks," product datasheet',
  'Emerson, "DeltaV Edge Environment," use-case flyer',
  'Emerson, "DeltaV History Analysis," product datasheet',
  'ISA-18.2-2016, "Management of Alarm Systems for the Process Industries"',
];

export default function EcosystemPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-base font-semibold tracking-wide text-slate-900 mb-1">
          WHERE THIS FITS IN THE DELTAV ECOSYSTEM
        </h1>
        <p className="text-xs text-slate-500 font-mono">
          The Shift Handoff Copilot is designed to complement — not replace — Emerson&apos;s
          existing alarm management stack.
        </p>
      </div>

      {/* Product mapping table */}
      <div className="mb-8 rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xs font-semibold tracking-widest text-[#0066B2] uppercase">
            Emerson DeltaV Alarm Management Stack
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-[#061E37]">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-[#4DA6D8] uppercase w-44">
                  Emerson Product
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-[#4DA6D8] uppercase">
                  What It Does
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-[#4DA6D8] uppercase w-44">
                  ISA-18.2 Stage
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold tracking-widest text-[#4DA6D8] uppercase">
                  Relationship to This Copilot
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PRODUCT_ROWS.map((row, idx) => (
                <tr key={row.product} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-4 py-3 text-slate-800 font-medium align-top">{row.product}</td>
                  <td className="px-4 py-3 text-slate-600 align-top">{row.does}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 align-top">{row.isa}</td>
                  <td className="px-4 py-3 text-slate-500 align-top">{row.copilot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* The Gap */}
      <div className="mb-8 rounded border border-slate-200 border-l-4 border-l-amber-500 bg-amber-50 px-4 py-4 shadow-sm">
        <div className="text-[10px] font-semibold tracking-widest text-amber-700 uppercase mb-2">
          The Gap This Concept Addresses
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          Emerson&apos;s current public DeltaV alarm management stack provides strong capabilities
          for alarm visualization (Alarm Mosaic), rationalization (AgileOps Database + Alarm Help),
          state-based suppression (AgileOps Dynamics), KPI reporting (Performance Analytics), and
          manual shift handover (Logbooks). What appears publicly under-served is the automatic
          generation of structured, evidence-linked shift handoff narratives from live alarm and
          event data. The Shift Handoff Copilot is a concept prototype exploring that specific gap.
        </p>
      </div>

      {/* ISA-18.2 Reference Metrics */}
      <div className="mb-8 rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xs font-semibold tracking-widest text-[#0066B2] uppercase">
            ISA-18.2 Reference Metrics
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-100">
              {ISA_METRICS.map((row, idx) => (
                <tr key={row.metric} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-4 py-2.5 text-slate-600 w-72">{row.metric}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-800">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50">
          <p className="text-[10px] text-slate-400 font-mono">
            Source: ISA-18.2-2016, as reproduced in Emerson&apos;s &ldquo;Alarm Management for
            DeltaV&rdquo; whitepaper
          </p>
        </div>
      </div>

      {/* References */}
      <div className="rounded border border-slate-200 bg-white shadow-sm px-4 py-4">
        <div className="text-[10px] font-semibold tracking-widest text-[#0066B2] uppercase mb-3">
          References
        </div>
        <ol className="space-y-1.5">
          {REFERENCES.map((ref, idx) => (
            <li key={idx} className="flex items-start gap-3 text-xs text-slate-600">
              <span className="font-mono text-slate-400 shrink-0">{idx + 1}.</span>
              <span>{ref}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
