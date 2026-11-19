import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router"
import Header from "./components/header"
import About from "./routes/about"
import Index from "./routes"
import Projects from "./routes/projects"

const EditorRoute = lazy(() => import("./routes/editor"))

export default function App() {
  return (
    <div className="relative flex h-dvh w-dvw flex-col gap-2 overflow-hidden bg-[#050505] p-2 text-white sm:gap-3 sm:p-3">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(163,230,53,0.08),transparent)]" />
      <Header />
      <main className="relative min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-8 text-sm text-white/40">Loading editor…</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/editor" element={<EditorRoute />} />
            <Route path="/editor/:id" element={<EditorRoute />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
