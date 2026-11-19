import { Link } from "react-router"
import { ArrowRight, Code2, FolderOpen, GitBranch, Workflow, Zap } from "lucide-react"
import ConfluenceMark from "../components/brand"

const FLOW = [
  { Icon: Zap, label: "Push main", tone: "text-violet-300" },
  { Icon: GitBranch, label: "Checkout", tone: "text-cyan-300" },
  { Icon: Code2, label: "JS script", tone: "text-amber-300" },
]

function WorkflowPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 rounded-[2.5rem] bg-lime-400/[0.06] blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#0e0e0e] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-2 border-b border-white/10 bg-[#141414] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400/50" />
            <span className="h-2 w-2 rounded-full bg-amber-400/50" />
            <span className="h-2 w-2 rounded-full bg-lime-400/60" />
          </div>
          <span className="ml-2 truncate font-mono text-[11px] text-white/40">.github/workflows/ci.yml</span>
          <span className="ml-auto shrink-0 rounded-full border border-lime-400/25 bg-lime-400/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-lime-300">
            VALID
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-1.5">
            {FLOW.map(({ Icon, label, tone }, index) => (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
                <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-white/10 bg-[#171717] p-2.5">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-md bg-white/5 ${tone}`}>
                    <Icon size={13} />
                  </span>
                  <span className="truncate text-[10px] font-semibold text-white/65">{label}</span>
                </div>
                {index < FLOW.length - 1 && <ArrowRight size={13} className="shrink-0 text-lime-400/50" />}
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/50 p-4 font-mono text-[11px] leading-[1.75]">
            <div>
              <span className="text-white/35">name</span>: <span className="text-lime-200/90">CI</span>
            </div>
            <div>
              <span className="text-white/35">on</span>:
            </div>
            <div className="pl-3">
              <span className="text-white/35">push</span>:
            </div>
            <div className="pl-6">
              <span className="text-white/35">branches</span>:
            </div>
            <div className="pl-9 text-lime-200/90">- main</div>
            <div>
              <span className="text-white/35">jobs</span>:
            </div>
            <div className="pl-3">
              <span className="text-white/35">build</span>:
            </div>
            <div className="pl-6">
              <span className="text-white/35">runs-on</span>: <span className="text-lime-200/90">ubuntu-latest</span>
            </div>
            <div className="pl-6">
              <span className="text-white/35">steps</span>:
            </div>
            <div className="pl-9 text-white/45">- uses: actions/checkout@v4</div>
            <div className="pl-9 text-white/45">- run: node script.js</div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#141414]/95 px-3 py-2 text-[10px] font-semibold text-white/60 shadow-xl backdrop-blur sm:flex">
        <ConfluenceMark className="h-4 w-4 text-lime-300" /> 3 nodes → 1 workflow
      </div>
    </div>
  )
}

export default function Index() {
  return (
    <div className="relative flex min-h-full w-full items-center overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 50% 40%, black, transparent 75%)",
        }}
      />
      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 md:px-12 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:gap-14 lg:py-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/5 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-lime-300 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_8px_#a3e635]" />
            Visual GitHub Actions builder
          </span>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight md:text-6xl">
            Confluences<span className="text-lime-400">.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/55 md:text-xl">
            Build workflows visually. Connect nodes, write JS/TS or Python scripts, and export a ready-to-run{" "}
            <span className="text-white/85">GitHub Actions YAML</span>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/editor"
              className="flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-bold text-black shadow-[0_8px_30px_-12px_rgba(163,230,53,0.7)] transition hover:bg-lime-300 hover:shadow-[0_10px_36px_-10px_rgba(163,230,53,0.9)]"
            >
              <Workflow size={17} /> Open editor <ArrowRight size={16} />
            </Link>
            <Link
              to="/projects"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-white/35 hover:bg-white/[0.06] hover:text-white"
            >
              <FolderOpen size={16} /> My projects
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-2.5 text-[11px] text-white/40">
            {["Visual DAG editor", "JS · TS · Python steps", "Live YAML preview", "Local project storage"].map((feature) => (
              <span key={feature} className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5">
                {feature}
              </span>
            ))}
          </div>
        </div>

        <WorkflowPreview />
      </div>
    </div>
  )
}
