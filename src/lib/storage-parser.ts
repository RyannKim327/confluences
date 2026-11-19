import type { WorkflowProject } from "./workflow/types"

export function loadProjects(): WorkflowProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as WorkflowProject[]) : []
  } catch {
    return []
  }
}

export function saveProjects(projects: WorkflowProject[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    return true
  } catch {
    return false
  }
}

export function upsertProject(project: WorkflowProject): boolean {
  const projects = loadProjects()
  const index = projects.findIndex((item) => item.id === project.id)
  if (index >= 0) projects[index] = project
  else projects.unshift(project)
  return saveProjects(projects)
}

export function deleteProject(id: string): boolean {
  return saveProjects(loadProjects().filter((project) => project.id !== id))
}

const STORAGE_KEY = "confluences.workflows.v1"
const LEGACY_KEY = "constellation.workflows.v1"
