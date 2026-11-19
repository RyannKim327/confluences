import { Handle, Position, type NodeProps } from "@xyflow/react"
import {
  Boxes,
  Braces,
  Code2,
  Download,
  GitBranch,
  Package,
  Play,
  Terminal,
  Upload,
  Zap,
} from "lucide-react"
import { getActionDefinition, TRIGGER_LABEL, type ActionType, type WorkflowNodeData } from "../../lib/workflow/types"

const ACTION_ICON = {
  checkout: GitBranch,
  "setup-node": Boxes,
  "setup-python": Boxes,
  "npm-install": Package,
  "npm-build": Terminal,
  "npm-test": Terminal,
  "run-command": Terminal,
  "upload-artifact": Upload,
  "download-artifact": Download,
  cache: Boxes,
} satisfies Record<ActionType, typeof GitBranch>

const STYLE = {
  trigger: { accent: "bg-violet-500", ring: "border-violet-500/60", icon: "text-violet-400", Icon: Zap },
  javascript: { accent: "bg-amber-400", ring: "border-amber-400/60", icon: "text-amber-300", Icon: Code2 },
  typescript: { accent: "bg-sky-500", ring: "border-sky-500/60", icon: "text-sky-300", Icon: Braces },
  python: { accent: "bg-emerald-500", ring: "border-emerald-500/60", icon: "text-emerald-300", Icon: Code2 },
  action: { accent: "bg-cyan-500", ring: "border-cyan-500/60", icon: "text-cyan-300", Icon: Play },
}

function preview(data: WorkflowNodeData): string {
  if (data.kind === "trigger") {
    return data.events.map((event) => TRIGGER_LABEL[event]).join(" · ") || "No events"
  }
  if (data.kind === "script") {
    return data.code.trim().split("\n")[0]?.slice(0, 42) || "Empty script"
  }
  const definition = getActionDefinition(data.action)
  const command = data.params.command
  return command || definition.description
}

export default function WorkflowNode({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData
  const variant =
    nodeData.kind === "trigger"
      ? STYLE.trigger
      : nodeData.kind === "script"
        ? STYLE[nodeData.language]
        : STYLE.action

  const Icon = nodeData.kind === "action" ? ACTION_ICON[nodeData.action] : variant.Icon
  const badge =
    nodeData.kind === "trigger" ? "trigger" : nodeData.kind === "script" ? nodeData.language : nodeData.action

  return (
    <div
      className={`group w-[220px] overflow-hidden rounded-xl border-2 bg-[#181818] shadow-xl transition-colors ${
        selected ? variant.ring : "border-white/15"
      }`}
    >
      {nodeData.kind !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-[#181818] !bg-lime-400"
        />
      )}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 ${variant.icon}`}>
          <Icon size={17} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-white">{nodeData.label}</div>
          <div className="truncate font-mono text-[10px] text-white/40">{badge}</div>
        </div>
      </div>
      <div className={`h-0.5 w-full ${variant.accent}`} />
      <div className="truncate px-3 py-2 font-mono text-[11px] text-white/55">{preview(nodeData)}</div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-[#181818] !bg-lime-400"
      />
    </div>
  )
}
