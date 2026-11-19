import YAML from "yaml"

export type YamlCheckLevel = "error" | "warning" | "info"

export type YamlCheck = {
  level: YamlCheckLevel
  message: string
  path?: string
  line?: number
}

export type YamlValidation = {
  checks: YamlCheck[]
  valid: boolean
  jobCount: number
  eventCount: number
}

const EVENTS = new Set([
  "push",
  "pull_request",
  "pull_request_target",
  "schedule",
  "workflow_dispatch",
  "workflow_run",
  "issues",
  "issue_comment",
  "pull_request_review",
  "release",
  "create",
  "delete",
  "fork",
  "watch",
  "page_build",
  "repository_dispatch",
])

const FILTERS = new Set([
  "branches",
  "branches-ignore",
  "tags",
  "tags-ignore",
  "paths",
  "paths-ignore",
  "types",
  "inputs",
])

const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/
const JOB_ID = /^[A-Za-z_][A-Za-z0-9_-]*$/
const USES = /^[^/\s]+\/[^@\s]+@[^@\s]+$/

type YamlDoc = ReturnType<typeof YAML.parseDocument>

function isMap(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function lineFor(doc: YamlDoc, source: string, path: (string | number)[]): number | undefined {
  const node = doc.getIn(path, true) as { range?: number[] } | undefined
  const start = node?.range?.[0]
  return typeof start === "number" ? source.slice(0, start).split("\n").length : undefined
}

function checkEnv(
  env: unknown,
  path: (string | number)[],
  add: (level: YamlCheckLevel, message: string, path: (string | number)[]) => void,
) {
  if (env === undefined) return
  const label = path.join(".")
  if (!isMap(env)) {
    add("error", `"${label}" must be a mapping of names to values`, path)
    return
  }
  for (const key of Object.keys(env)) {
    if (!ENV_NAME.test(key)) add("error", `Invalid environment variable name "${key || "(empty)"}" in ${label}`, [...path, key])
  }
}

function findNeedsCycle(jobs: Record<string, unknown>): string[] | null {
  const state = new Map<string, number>()
  const stack: string[] = []

  const visit = (id: string): string[] | null => {
    state.set(id, 1)
    stack.push(id)
    const job = jobs[id]
    const rawNeeds = isMap(job) ? job.needs : undefined
    const needs = Array.isArray(rawNeeds) ? rawNeeds : rawNeeds === undefined ? [] : [rawNeeds]
    for (const need of needs) {
      if (typeof need !== "string" || !(need in jobs)) continue
      if (state.get(need) === 1) return [...stack.slice(stack.indexOf(need)), need]
      if (!state.has(need)) {
        const cycle = visit(need)
        if (cycle) return cycle
      }
    }
    stack.pop()
    state.set(id, 2)
    return null
  }

  for (const id of Object.keys(jobs)) {
    if (!state.has(id)) {
      const cycle = visit(id)
      if (cycle) return cycle
    }
  }
  return null
}

export function validateYaml(source: string): YamlValidation {
  const checks: YamlCheck[] = []
  let doc: YamlDoc

  try {
    doc = YAML.parseDocument(source, { prettyErrors: true, uniqueKeys: true })
  } catch (error) {
    return {
      checks: [{ level: "error", message: error instanceof Error ? error.message : "Could not parse YAML" }],
      valid: false,
      jobCount: 0,
      eventCount: 0,
    }
  }

  const add = (level: YamlCheckLevel, message: string, path: (string | number)[]) => {
    checks.push({ level, message, path: path.join("."), line: lineFor(doc, source, path) })
  }

  for (const error of doc.errors) {
    checks.push({
      level: "error",
      message: error.message.split("\n")[0],
      path: "syntax",
      line: error.linePos?.[0]?.line,
    })
  }
  for (const warning of doc.warnings) {
    checks.push({
      level: "warning",
      message: warning.message.split("\n")[0],
      path: "syntax",
      line: warning.linePos?.[0]?.line,
    })
  }

  const rootValue = doc.toJS() as unknown
  const rootMap = isMap(rootValue) ? rootValue : null
  const jobsMap = rootMap && isMap(rootMap.jobs) ? rootMap.jobs : null

  const finish = (): YamlValidation => ({
    checks,
    valid: !checks.some((check) => check.level === "error"),
    jobCount: jobsMap ? Object.keys(jobsMap).length : 0,
    eventCount: 0,
  })

  if (!source.trim()) {
    checks.push({ level: "error", message: "YAML file is empty" })
    return finish()
  }
  if (doc.errors.length) return finish()

  if (!rootMap) {
    checks.push({ level: "error", message: "Top level of the workflow must be a mapping" })
    return finish()
  }

  if (rootMap.name === undefined) add("warning", "Workflow has no top-level name:", ["name"])
  else if (typeof rootMap.name !== "string") add("error", "Workflow name must be a string", ["name"])

  for (const key of Object.keys(rootMap)) {
    if (!["name", "on", "env", "defaults", "concurrency", "permissions", "jobs"].includes(key)) {
      add("warning", `Unknown top-level key "${key}"`, [key])
    }
  }

  let eventCount = 0
  if (rootMap.on === undefined) {
    checks.push({ level: "error", message: 'Missing required "on:" trigger' })
  } else if (typeof rootMap.on === "string") {
    eventCount = 1
    if (!EVENTS.has(rootMap.on)) add("warning", `Unknown trigger event "${rootMap.on}"`, ["on"])
  } else if (isMap(rootMap.on)) {
    eventCount = Object.keys(rootMap.on).length
    if (!eventCount) add("error", '"on:" must define at least one event', ["on"])
    for (const [event, config] of Object.entries(rootMap.on)) {
      if (!EVENTS.has(event)) {
        add("error", `Unknown trigger event "${event}"`, ["on", event])
        continue
      }
      if (event === "schedule") {
        if (!Array.isArray(config) || config.length === 0) {
          add("error", '"schedule" must contain at least one cron entry', ["on", event])
        } else {
          config.forEach((entry, index) => {
            if (!isMap(entry) || typeof entry.cron !== "string" || !entry.cron.trim()) {
              add("error", `Schedule entry ${index + 1} needs a cron expression`, ["on", event, index, "cron"])
            }
          })
        }
      } else if (config !== null && !isMap(config)) {
        add("error", `"${event}" config must be a mapping`, ["on", event])
      } else if (isMap(config)) {
        for (const key of Object.keys(config)) {
          if (!FILTERS.has(key)) add("warning", `Unknown filter "${key}" for ${event}`, ["on", event, key])
        }
      }
    }
  } else {
    add("error", '"on:" must be a mapping or an event name', ["on"])
  }

  checkEnv(rootMap.env, ["env"], add)

  if (rootMap.jobs === undefined) {
    checks.push({ level: "error", message: 'Missing required "jobs:" section' })
  } else if (!isMap(rootMap.jobs)) {
    add("error", '"jobs:" must be a mapping', ["jobs"])
  } else {
    const jobs = rootMap.jobs
    const jobIds = Object.keys(jobs)
    if (!jobIds.length) add("error", '"jobs:" must contain at least one job', ["jobs"])

    for (const [id, rawJob] of Object.entries(jobs)) {
      if (!JOB_ID.test(id)) add("error", `Invalid job id "${id}"`, ["jobs", id])
      if (!isMap(rawJob)) {
        add("error", `Job "${id}" must be a mapping`, ["jobs", id])
        continue
      }
      const job = rawJob
      if (job["runs-on"] === undefined) add("error", `Job "${id}" is missing "runs-on"`, ["jobs", id, "runs-on"])
      else if (typeof job["runs-on"] !== "string" && !isMap(job["runs-on"])) {
        add("error", `Job "${id}" has an invalid "runs-on" value`, ["jobs", id, "runs-on"])
      }

      checkEnv(job.env, ["jobs", id, "env"], add)

      if (job.needs !== undefined) {
        const needs = Array.isArray(job.needs) ? job.needs : [job.needs]
        needs.forEach((need, index) => {
          const path = Array.isArray(job.needs) ? ["jobs", id, "needs", index] : ["jobs", id, "needs"]
          if (typeof need !== "string") {
            add("error", `Job "${id}" has a non-string need`, path)
          } else if (!jobIds.includes(need)) {
            add("error", `Job "${id}" needs unknown job "${need}"`, path)
          } else if (need === id) {
            add("error", `Job "${id}" cannot depend on itself`, path)
          }
        })
      }

      if (!Array.isArray(job.steps)) {
        add("error", `Job "${id}" must define a "steps" array`, ["jobs", id, "steps"])
        continue
      }
      if (!job.steps.length) add("warning", `Job "${id}" has no steps`, ["jobs", id, "steps"])

      job.steps.forEach((rawStep, index) => {
        const path = ["jobs", id, "steps", index]
        if (!isMap(rawStep)) {
          add("error", `Job "${id}" step ${index + 1} must be a mapping`, path)
          return
        }
        const step = rawStep
        const hasUses = typeof step.uses === "string"
        const hasRun = typeof step.run === "string"
        if (!hasUses && !hasRun) add("error", `Job "${id}" step ${index + 1} needs "uses" or "run"`, path)
        if (hasUses && hasRun) add("error", `Job "${id}" step ${index + 1} cannot have both "uses" and "run"`, path)
        if (hasUses && !USES.test(step.uses as string)) {
          add("warning", `Step "uses" should look like owner/repo@ref`, [...path, "uses"])
        }
        if (step.with !== undefined && !isMap(step.with)) {
          add("error", `Job "${id}" step ${index + 1} has an invalid "with" block`, [...path, "with"])
        }
        checkEnv(step.env, ["jobs", id, "steps", index, "env"], add)
      })
    }

    const cycle = findNeedsCycle(jobs)
    if (cycle) add("error", `Job dependency cycle: ${cycle.join(" → ")}`, ["jobs"])
  }

  const opens = source.match(/\$\{\{/g)?.length ?? 0
  const closes = source.match(/\}\}/g)?.length ?? 0
  if (opens !== closes) checks.push({ level: "warning", message: "Unbalanced ${{ ... }} expression braces", path: "expressions" })

  const result = finish()
  result.eventCount = eventCount
  return result
}
