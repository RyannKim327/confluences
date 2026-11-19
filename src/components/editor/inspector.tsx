import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { oneDark } from "@codemirror/theme-one-dark"
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import EnvEditor from "./env-editor"
import type { ValidationIssue } from "../../lib/workflow/generate"
import {
  getActionDefinition,
  TRIGGER_LABEL,
  type TriggerEvent,
  type WorkflowNode,
  type WorkflowNodeData,
  type WorkflowProject,
} from "../../lib/workflow/types"

const inputClass =
  "w-full rounded-lg border border-white/15 bg-[#0d0d0d] px-3 py-2 text-sm text-white outline-none transition focus:border-lime-400/70"

type MetaPatch = Partial<Pick<WorkflowProject, "name" | "workflowName" | "runsOn" | "env">>

type Props = {
  node: WorkflowNode | null
  project: WorkflowProject
  issues: ValidationIssue[]
  onMeta: (patch: MetaPatch) => void
  onData: (updater: (data: WorkflowNodeData) => WorkflowNodeData) => void
  onDelete: () => void
  onSelectIssue: (nodeId: string) => void
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">{label}</span>
      {children}
      {hint && <span className="text-[10px] text-white/30">{hint}</span>}
    </label>
  )
}

export default function Inspector({ node, project, issues, onMeta, onData, onDelete, onSelectIssue }: Props) {
  const data = node?.data

  return (
    <aside className="flex w-[380px] shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-[#111]">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-xs font-bold tracking-widest text-white/50 uppercase">
          {data ? `${data.kind} properties` : "Workflow settings"}
        </h2>
      </div>

      {!data && (
        <div className="flex flex-col gap-4 p-4">
          <Field label="Project name">
            <input className={inputClass} value={project.name} onChange={(e) => onMeta({ name: e.target.value })} />
          </Field>
          <Field label="Workflow name" hint="Value of the top-level name: field">
            <input
              className={inputClass}
              value={project.workflowName}
              onChange={(e) => onMeta({ workflowName: e.target.value })}
            />
          </Field>
          <Field label="Runner">
            <input className={inputClass} value={project.runsOn} onChange={(e) => onMeta({ runsOn: e.target.value })} />
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
              Workflow environment
            </span>
            <EnvEditor
              variables={project.env ?? {}}
              onChange={(env) => onMeta({ env })}
              hint="Available to every job. Use ${{ secrets.NAME }} or ${{ vars.NAME }} for repository values."
            />
          </div>
          <div className="rounded-lg border border-white/10 bg-[#161616] p-3 text-xs leading-relaxed text-white/45">
            Select a node to edit its settings. Connect nodes by dragging from the right handle to the left handle of
            another node. Branches become separate jobs with <code className="text-lime-300">needs</code>.
          </div>
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-4 p-4">
          <Field label="Name">
            <input
              className={inputClass}
              value={data.label}
              onChange={(e) => onData((current) => ({ ...current, label: e.target.value }))}
            />
          </Field>

          {data.kind === "trigger" && (
            <>
              <Field label="Events" hint="Combine events to trigger this workflow">
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(TRIGGER_LABEL) as TriggerEvent[]).map((event) => {
                    const active = data.events.includes(event)
                    return (
                      <button
                        key={event}
                        type="button"
                        onClick={() =>
                          onData((current) => {
                            if (current.kind !== "trigger") return current
                            const events = active
                              ? current.events.filter((item) => item !== event)
                              : [...current.events, event]
                            return { ...current, events }
                          })
                        }
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                          active
                            ? "border-lime-400 bg-lime-400/15 text-lime-300"
                            : "border-white/15 text-white/45 hover:border-white/40"
                        }`}
                      >
                        {TRIGGER_LABEL[event]}
                      </button>
                    )
                  })}
                </div>
              </Field>
              {(data.events.includes("push") || data.events.includes("pull_request")) && (
                <>
                  <Field label="Branches" hint="Comma separated. Leave empty for all branches.">
                    <input
                      className={inputClass}
                      value={data.branches}
                      placeholder="main, dev"
                      onChange={(e) => onData((current) => ({ ...current, branches: e.target.value }))}
                    />
                  </Field>
                  <Field label="Paths" hint="Comma separated file filters">
                    <input
                      className={inputClass}
                      value={data.paths}
                      placeholder="src/**"
                      onChange={(e) => onData((current) => ({ ...current, paths: e.target.value }))}
                    />
                  </Field>
                </>
              )}
              {data.events.includes("schedule") && (
                <Field label="Cron" hint="UTC schedule, e.g. 0 0 * * *">
                  <input
                    className={`${inputClass} font-mono`}
                    value={data.cron}
                    onChange={(e) => onData((current) => ({ ...current, cron: e.target.value }))}
                  />
                </Field>
              )}
            </>
          )}

          {data.kind === "script" && (
            <>
              <Field label="Language">
                <div className="flex gap-1.5">
                  {(["javascript", "typescript", "python"] as const).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => onData((current) => (current.kind === "script" ? { ...current, language } : current))}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                        data.language === language
                          ? "border-lime-400 bg-lime-400/15 text-lime-300"
                          : "border-white/15 text-white/45 hover:border-white/40"
                      }`}
                    >
                      {language === "javascript" ? "JS" : language === "typescript" ? "TS" : "PY"}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Script" hint="Written to a temp file and executed on the runner">
                <div className="overflow-hidden rounded-lg border border-white/15">
                  <CodeMirror
                    value={data.code}
                    height="340px"
                    theme={oneDark}
                    extensions={[data.language === "python" ? python() : javascript({ typescript: data.language === "typescript" })]}
                    onChange={(value) => onData((current) => (current.kind === "script" ? { ...current, code: value } : current))}
                  />
                </div>
              </Field>
            </>
          )}

          {data.kind === "action" && (
            <>
              <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-[11px] text-cyan-200/70">
                {getActionDefinition(data.action).description}
              </div>
              {getActionDefinition(data.action).fields.map((field) => (
                <Field key={field.key} label={field.label}>
                  <input
                    className={`${inputClass} font-mono text-xs`}
                    value={data.params[field.key] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      onData((current) =>
                        current.kind === "action"
                          ? { ...current, params: { ...current.params, [field.key]: e.target.value } }
                          : current,
                      )
                    }
                  />
                </Field>
              ))}
            </>
          )}

          <div className="flex flex-col gap-1.5 border-t border-white/10 pt-4">
            <span className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
              {data.kind === "trigger" ? "Job environment" : "Step environment"}
            </span>
            <EnvEditor
              variables={data.env ?? {}}
              onChange={(env) => onData((current) => ({ ...current, env }))}
              hint={
                data.kind === "trigger"
                  ? "Added to every generated job as env:"
                  : "Added to this step's env: block and overrides workflow values."
              }
            />
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
          >
            <Trash2 size={14} /> Delete node
          </button>
        </div>
      )}

      <div className="mt-auto border-t border-white/10 p-4">
        <h3 className="mb-2 text-[11px] font-bold tracking-widest text-white/45 uppercase">Checks</h3>
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-lime-300">
            <CheckCircle2 size={15} /> Workflow looks good
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {issues.map((issue, index) => (
              <li key={`${index}:${issue.message}`}>
                <button
                  type="button"
                  onClick={() => issue.nodeId && onSelectIssue(issue.nodeId)}
                  className="flex w-full gap-2 rounded-lg border border-white/10 bg-[#171717] p-2 text-left text-[11px] leading-snug transition hover:border-white/25"
                >
                  <AlertTriangle size={14} className={issue.level === "error" ? "shrink-0 text-red-400" : "shrink-0 text-amber-400"} />
                  <span className="text-white/65">{issue.message}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
