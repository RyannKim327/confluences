import { useState, type SubmitEvent } from "react"
import { useNavigate } from "react-router"
import { ArrowRight, Plus, Trash2 } from "lucide-react"
import Modal from "../components/modal"
import Title from "../components/title"
import { deleteProject, loadProjects, upsertProject } from "../lib/storage-parser"
import { makeStarterProject } from "../lib/workflow/types"

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState(loadProjects)
  const [show, setShow] = useState(false)
  const [name, setName] = useState("")

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const project = makeStarterProject()
    project.name = name.trim() || "Untitled workflow"
    project.workflowName = project.name
    upsertProject(project)
    navigate(`/editor/${project.id}`)
  }

  const remove = (id: string) => {
    deleteProject(id)
    setProjects((current) => current.filter((project) => project.id !== id))
  }

  return (
    <div className="px-4 pb-8">
      <Title title="Projects" description="Workflows saved in this browser" />
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/15 py-24">
          <span className="text-xl font-semibold text-white/80">No projects saved yet</span>
          <button
            type="button"
            onClick={() => setShow(true)}
            className="flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-lime-300"
          >
            <Plus size={16} /> Create new project
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setShow(true)}
              className="flex items-center gap-2 rounded-lg border border-lime-400/50 px-3 py-2 text-xs font-bold text-lime-300 transition hover:bg-lime-400/10"
            >
              <Plus size={15} /> New project
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col rounded-xl border border-white/10 bg-[#111] p-4 transition hover:border-lime-400/40"
              >
                <span className="truncate font-bold text-white">{project.name}</span>
                <span className="mt-1 truncate font-mono text-xs text-white/40">{project.workflowName || "Workflow"}</span>
                <div className="mt-3 flex gap-4 text-[11px] text-white/40">
                  <span>{project.nodes.length} nodes</span>
                  <span>{project.edges.length} links</span>
                  <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 py-2 text-xs font-bold text-white transition hover:bg-lime-400 hover:text-black"
                  >
                    Open <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    title="Delete project"
                    onClick={() => remove(project.id)}
                    className="rounded-lg border border-white/10 p-2 text-white/40 transition hover:border-red-500/40 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal show={show} showModal={setShow}>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <span className="font-bold">Create new project</span>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-white/50">Project name</span>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My workflow"
              className="rounded-lg border border-white/20 bg-[#0d0d0d] px-3 py-2 text-sm outline-none focus:border-lime-400"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShow(false)} className="rounded-lg px-3 py-2 text-xs text-white/50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-lime-400 px-4 py-2 text-xs font-bold text-black">
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
