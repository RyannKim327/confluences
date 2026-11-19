import {
  Boxes,
  Braces,
  Code2,
  Download,
  GitBranch,
  Package,
  Terminal,
  Upload,
  Zap,
} from "lucide-react"
import {
  ACTIONS,
  LANGUAGE_LABEL,
  type ActionType,
  type ScriptLanguage,
} from "../../lib/workflow/types"

export type PaletteItem =
  | { type: "trigger" }
  | { type: "script"; language: ScriptLanguage }
  | { type: "action"; action: ActionType }

export const DRAG_KEY = "application/confluences-node"

const ACTION_ICON: Record<ActionType, typeof GitBranch> = {
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
}

type Entry = { item: PaletteItem; label: string; hint: string; Icon: typeof GitBranch; tone: string }

const SCRIPT_TONE: Record<ScriptLanguage, string> = {
  javascript: "text-amber-300",
  typescript: "text-sky-300",
  python: "text-emerald-300",
}

const SCRIPT_ICON: Record<ScriptLanguage, typeof Code2> = {
  javascript: Code2,
  typescript: Braces,
  python: Code2,
}

export default function NodePalette({ onAdd }: { onAdd: (item: PaletteItem) => void }) {
  const scriptEntries: Entry[] = (["javascript", "typescript", "python"] as ScriptLanguage[]).map((language) => ({
    item: { type: "script", language },
    label: `${LANGUAGE_LABEL[language]} script`,
    hint: "Custom code",
    Icon: SCRIPT_ICON[language],
    tone: SCRIPT_TONE[language],
  }))

  const actionEntries: Entry[] = ACTIONS.map((action) => ({
    item: { type: "action", action: action.type },
    label: action.label,
    hint: action.description,
    Icon: ACTION_ICON[action.type],
    tone: "text-cyan-300",
  }))

  const groups: { title: string; entries: Entry[] }[] = [
    {
      title: "Triggers",
      entries: [{
        item: { type: "trigger" },
        label: "Trigger",
        hint: "Starts the workflow",
        Icon: Zap,
        tone: "text-violet-300",
      }],
    },
    { title: "Scripts", entries: scriptEntries },
    { title: "Actions", entries: actionEntries },
  ]

  return (
    <aside className="flex w-[232px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#111] px-3 py-4">
      <div className="mb-4 px-1">
        <h2 className="text-xs font-bold tracking-widest text-white/50 uppercase">Node library</h2>
        <p className="mt-1 text-[11px] leading-snug text-white/35">Drag onto the canvas or click to add</p>
      </div>
      {groups.map((group) => (
        <section key={group.title} className="mb-5">
          <h3 className="mb-2 px-1 text-[10px] font-bold tracking-widest text-lime-400/80 uppercase">
            {group.title}
          </h3>
          <div className="flex flex-col gap-1.5">
            {group.entries.map((entry) => (
              <button
                key={entry.label}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(DRAG_KEY, JSON.stringify(entry.item))
                  event.dataTransfer.effectAllowed = "move"
                }}
                onClick={() => onAdd(entry.item)}
                className="flex cursor-grab items-center gap-2.5 rounded-lg border border-white/5 bg-[#1a1a1a] px-2.5 py-2 text-left transition hover:border-lime-400/40 hover:bg-[#222] active:cursor-grabbing"
              >
                <entry.Icon size={16} className={`shrink-0 ${entry.tone}`} />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-white/90">{entry.label}</span>
                  <span className="block truncate text-[10px] text-white/35">{entry.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  )
}
