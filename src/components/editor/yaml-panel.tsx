import { Check, Copy, Download } from "lucide-react"
import { useState } from "react"
import type { GenerateResult } from "../../lib/workflow/generate"

export default function YamlPanel({ result, filename }: { result: GenerateResult; filename: string }) {
  const [copied, setCopied] = useState(false)
  const lines = result.yaml.split("\n")

  const copy = async () => {
    await navigator.clipboard.writeText(result.yaml)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const blob = new Blob([result.yaml], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${filename.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase() || "workflow"}.yml`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col bg-[#0d0d0d]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-widest text-white/50 uppercase">Generated YAML</span>
          <span className="text-[10px] text-white/30">
            {result.jobCount} {result.jobCount === 1 ? "job" : "jobs"}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-white/70 transition hover:border-lime-400/60 hover:text-lime-300"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={download}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-white/70 transition hover:border-lime-400/60 hover:text-lime-300"
          >
            <Download size={13} /> Download
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-[12px] leading-[1.65]">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            <span className="mr-4 w-7 shrink-0 select-none text-right text-white/20">{index + 1}</span>
            <code className={`whitespace-pre ${line.trim().startsWith("#") ? "text-white/35" : "text-lime-200/85"}`}>
              {line || " "}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}
