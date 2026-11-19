import { useMemo, useRef, useState, type ChangeEvent } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { yaml } from "@codemirror/lang-yaml"
import { oneDark } from "@codemirror/theme-one-dark"
import { AlertTriangle, CheckCircle2, RotateCcw, Upload, XCircle } from "lucide-react"
import { validateYaml, type YamlCheckLevel } from "../../lib/workflow/validate-yaml"

type Mode = "generated" | "custom"

const ICONS: Record<YamlCheckLevel, typeof XCircle> = {
  error: XCircle,
  warning: AlertTriangle,
  info: CheckCircle2,
}

const TONE: Record<YamlCheckLevel, string> = {
  error: "border-red-500/25 bg-red-500/5 text-red-300",
  warning: "border-amber-500/25 bg-amber-500/5 text-amber-300",
  info: "border-sky-500/25 bg-sky-500/5 text-sky-300",
}

export default function TestPanel({ generatedYaml }: { generatedYaml: string }) {
  const [mode, setMode] = useState<Mode>("generated")
  const [customText, setCustomText] = useState("")
  const [fileName, setFileName] = useState("")
  const fileInput = useRef<HTMLInputElement>(null)

  const activeText = mode === "generated" ? generatedYaml : customText
  const result = useMemo(() => validateYaml(activeText), [activeText])

  const errors = result.checks.filter((check) => check.level === "error").length
  const warnings = result.checks.filter((check) => check.level === "warning").length

  const switchMode = (next: Mode) => {
    if (next === "custom" && !customText) setCustomText(generatedYaml)
    setMode(next)
  }

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCustomText(await file.text())
    setFileName(file.name)
    setMode("custom")
    event.target.value = ""
  }

  return (
    <div className="flex h-full flex-col bg-[#0d0d0d]">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-widest text-white/50 uppercase">YAML tester</span>
            <span className="text-[10px] text-white/30">
              {result.jobCount} jobs · {result.eventCount} events
            </span>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
              result.valid ? "border-lime-400/30 bg-lime-400/10 text-lime-300" : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {result.valid ? "Valid" : `${errors} error${errors === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="mt-3 flex gap-1 rounded-lg border border-white/5 bg-black/40 p-1">
          {(["generated", "custom"] as Mode[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => switchMode(value)}
              className={`flex-1 rounded-md py-1.5 text-[11px] font-semibold transition ${
                mode === value ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {value === "generated" ? "Generated" : "Paste / upload"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative h-[38%] min-h-[180px] shrink-0 border-b border-white/10">
          <CodeMirror
            value={activeText}
            height="100%"
            theme={oneDark}
            editable={mode === "custom"}
            extensions={[yaml()]}
            onChange={(value) => {
              if (mode === "custom") setCustomText(value)
            }}
            className="h-full [&_.cm-editor]:h-full"
          />
          {mode === "custom" && (
            <div className="absolute right-2 top-2 z-10 flex gap-1.5">
              <input ref={fileInput} type="file" accept=".yml,.yaml,text/yaml" onChange={upload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-1 rounded-md border border-white/15 bg-[#181818]/95 px-2 py-1 text-[10px] font-semibold text-white/60 transition hover:text-lime-300"
              >
                <Upload size={12} /> {fileName || "Upload .yml"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomText(generatedYaml)
                  setFileName("")
                }}
                title="Load generated YAML"
                className="rounded-md border border-white/15 bg-[#181818]/95 p-1.5 text-white/50 transition hover:text-lime-300"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center gap-3 text-[10px] font-semibold text-white/35">
            <span>CHECKS</span>
            {errors > 0 && <span className="text-red-300/70">{errors} errors</span>}
            {warnings > 0 && <span className="text-amber-300/70">{warnings} warnings</span>}
          </div>
          {result.checks.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-lime-400/20 bg-lime-400/5 p-3 text-xs text-lime-200/80">
              <CheckCircle2 size={16} /> No issues found. This file is ready to save as .yml
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.checks.map((check, index) => {
                const Icon = ICONS[check.level]
                return (
                  <li
                    key={`${index}:${check.message}`}
                    className={`flex gap-2 rounded-lg border p-2.5 ${TONE[check.level]}`}
                  >
                    <Icon size={14} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] leading-snug">{check.message}</p>
                      {(check.path || check.line) && (
                        <p className="mt-1 truncate font-mono text-[10px] opacity-50">
                          {check.path ?? "yaml"}
                          {check.line ? ` · line ${check.line}` : ""}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
