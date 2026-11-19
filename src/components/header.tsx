import { useState } from "react"
import { Link, NavLink, useLocation } from "react-router"
import { FolderOpen, House, Info, Menu, Plus, Workflow, X } from "lucide-react"
import ConfluenceMark from "./brand"
import { site, type SiteLink } from "../lib/site"

const ICONS = {
  home: House,
  editor: Workflow,
  projects: FolderOpen,
  about: Info,
} satisfies Record<SiteLink["icon"], typeof House>

function Logo() {
  return (
    <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-lime-400/20 bg-gradient-to-br from-lime-400/15 via-lime-400/5 to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <ConfluenceMark />
    </span>
  )
}

function navClass(active: boolean, mobile = false): string {
  if (mobile) {
    return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
      active ? "bg-lime-400/10 text-lime-300" : "text-white/60 hover:bg-white/5 hover:text-white"
    }`
  }
  return `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
    active
      ? "bg-lime-400/10 text-lime-300 shadow-[inset_0_0_0_1px_rgba(163,230,53,0.22)]"
      : "text-white/45 hover:bg-white/5 hover:text-white/90"
  }`
}

export default function Header() {
  const location = useLocation()
  const [menu, setMenu] = useState({ path: "", open: false })
  const open = menu.path === location.pathname && menu.open
  const toggle = () => setMenu({ path: location.pathname, open: !open })

  return (
    <header className="relative z-40 shrink-0 rounded-2xl border border-white/10 bg-[#0e0e0e]/90 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.95)] backdrop-blur-xl before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-lime-400/40 before:to-transparent">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5" aria-label="Confluences home">
          <Logo />
          <span className="hidden flex-col leading-none sm:flex">
            <span className="text-[15px] font-semibold tracking-tight text-white transition-colors group-hover:text-lime-200">
              Confluences<span className="text-lime-400">.</span>
            </span>
            <span className="mt-1 text-[9px] font-medium tracking-[0.2em] text-white/30 uppercase">Workflow studio</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <nav aria-label="Main navigation" className="hidden items-center gap-0.5 rounded-full border border-white/5 bg-black/40 p-1 md:flex">
            {site.map((link) => {
              const Icon = ICONS[link.icon]
              return (
                <NavLink key={link.href} to={link.href} end={link.href === "/"} className={({ isActive }) => navClass(isActive)}>
                  {({ isActive }) => (
                    <>
                      <Icon size={14} strokeWidth={2} />
                      <span>{link.name}</span>
                      {isActive && <span className="ml-0.5 h-1 w-1 rounded-full bg-lime-400 shadow-[0_0_6px_#a3e635]" />}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          <Link
            to="/editor"
            className="hidden items-center gap-1.5 rounded-full bg-lime-400 px-3.5 py-2 text-xs font-bold text-black transition-all hover:bg-lime-300 hover:shadow-[0_0_22px_-6px_rgba(163,230,53,0.8)] sm:flex"
          >
            <Plus size={14} strokeWidth={2.6} /> New workflow
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={toggle}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:text-white md:hidden"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          aria-label="Mobile navigation"
          className="absolute right-2 top-full z-50 mt-2 w-52 rounded-xl border border-white/10 bg-[#121212] p-1.5 shadow-2xl md:hidden"
        >
          {site.map((link) => {
            const Icon = ICONS[link.icon]
            return (
              <NavLink key={link.href} to={link.href} end={link.href === "/"} className={({ isActive }) => navClass(isActive, true)}>
                <Icon size={16} />
                {link.name}
              </NavLink>
            )
          })}
          <div className="my-1.5 h-px bg-white/10" />
          <Link to="/editor" className="flex items-center gap-2.5 rounded-lg bg-lime-400/10 px-3 py-2 text-sm font-semibold text-lime-300">
            <Plus size={16} /> New workflow
          </Link>
        </nav>
      )}
    </header>
  )
}
