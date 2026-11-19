import {
  Code2,
  Download,
  FileCode2,
  GitBranch,
  MousePointer2,
  ShieldCheck,
  Workflow,
  Zap,
} from "lucide-react"
import Title from "../components/title"
import { Link } from "react-router"

const FEATURES = [
  {
    Icon: Workflow,
    title: "Visual graph",
    body: "Drag nodes from the library, wire them together, and shape the execution order directly on the canvas.",
    tone: "text-violet-300",
  },
  {
    Icon: Code2,
    title: "Scripts & actions",
    body: "Write JavaScript, TypeScript, or Python inline. Add checkout, runtime, command, and artifact actions.",
    tone: "text-amber-300",
  },
  {
    Icon: FileCode2,
    title: "Real YAML",
    body: "Live preview, branch-aware jobs with needs, environment variables, and a built-in .yml tester.",
    tone: "text-lime-300",
  },
]

const STEPS = [
  { Icon: Zap, title: "Trigger", body: "Pick push, pull request, schedule, or manual events." },
  { Icon: GitBranch, title: "Connect", body: "Branches become jobs; merges wait for all upstream jobs." },
  { Icon: Download, title: "Export", body: "Copy or download the generated workflow.yml file." },
]

export default function About() {
  return (
    <div className="pb-12">
      <Title title="About" description="What Confluences does" />
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <p className="max-w-2xl text-base leading-relaxed text-white/60">
          Confluences turns a visual graph of nodes into a GitHub Actions workflow file. Connect a trigger to scripts
          and built-in actions, edit each node in the properties panel, and watch the YAML update instantly.
        </p>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {FEATURES.map(({ Icon, title, body, tone }) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-[#101010] p-5 transition hover:border-lime-400/30"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ${tone}`}>
                <Icon size={18} />
              </div>
              <h2 className="mt-4 text-sm font-bold text-white">{title}</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-white/45">{body}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-white/10 bg-[#0e0e0e] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <MousePointer2 size={15} className="text-lime-300" />
            <h2 className="text-sm font-bold">How a graph becomes YAML</h2>
          </div>
          <ol className="mt-5 grid gap-5 sm:grid-cols-3">
            {STEPS.map(({ Icon, title, body }, index) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] font-bold text-white/50">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-white/85">
                    <Icon size={14} className="text-lime-300/70" /> {title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/40">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-lime-300/70" />
            <p className="max-w-xl text-xs leading-relaxed text-white/45">
              Projects are stored only in your browser's local storage — nothing is uploaded. You can also upload any
              existing .yml file into the Test tab to check it.
            </p>
          </div>
          <Link
            to="/editor"
            className="shrink-0 rounded-lg border border-lime-400/40 px-4 py-2 text-center text-xs font-bold text-lime-300 transition hover:bg-lime-400/10"
          >
            Open editor
          </Link>
        </div>
      </div>
    </div>
  )
}
