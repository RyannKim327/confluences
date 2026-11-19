import { Plus, X } from "lucide-react"

type Props = {
  variables: Record<string, string>
  onChange: (next: Record<string, string>) => void
  hint?: string
}

export default function EnvEditor({ variables, onChange, hint }: Props) {
  const entries = Object.entries(variables)

  const updateAt = (index: number, patch: { key?: string; value?: string }) => {
    const next = entries.map(([key, value], current) => [
      current === index ? (patch.key ?? key) : key,
      current === index ? (patch.value ?? value) : value,
    ])
    onChange(Object.fromEntries(next))
  }

  const removeAt = (index: number) => {
    onChange(Object.fromEntries(entries.filter((_, current) => current !== index)))
  }

  const add = () => {
    let index = 1
    while (entries.some(([key]) => key === `NEW_VAR_${index}`)) index += 1
    onChange(Object.fromEntries([...entries, [`NEW_VAR_${index}`, ""]]))
  }

  const fieldClass =
    "min-w-0 rounded-lg border border-white/15 bg-[#0d0d0d] px-2.5 py-1.5 font-mono text-xs text-white outline-none transition focus:border-lime-400/70"

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, value], index) => (
        <div key={index} className="flex items-center gap-1.5">
          <input
            aria-label="Variable name"
            value={key}
            placeholder="NAME"
            onChange={(event) => updateAt(index, { key: event.target.value })}
            className={`${fieldClass} w-[38%] ${/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? "" : "border-red-500/60"}`}
          />
          <input
            aria-label="Variable value"
            value={value}
            placeholder="${{ secrets.TOKEN }}"
            onChange={(event) => updateAt(index, { value: event.target.value })}
            className={`${fieldClass} flex-1`}
          />
          <button
            type="button"
            title="Remove variable"
            onClick={() => removeAt(index)}
            className="shrink-0 rounded-lg p-1.5 text-white/35 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 py-1.5 text-[11px] font-semibold text-white/45 transition hover:border-lime-400/40 hover:text-lime-300"
      >
        <Plus size={13} /> Add variable
      </button>
      {hint && <span className="text-[10px] leading-snug text-white/30">{hint}</span>}
    </div>
  )
}
