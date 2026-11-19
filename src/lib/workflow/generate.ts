import YAML from "yaml"
import {
  getActionDefinition,
  type ActionNodeData,
  type ScriptLanguage,
  type ScriptNodeData,
  type TriggerNodeData,
  type WorkflowNode,
  type WorkflowProject,
} from "./types"

export type ValidationIssue = {
  level: "error" | "warning"
  message: string
  nodeId?: string
}

export type GenerateResult = {
  yaml: string
  issues: ValidationIssue[]
  jobCount: number
}

type Graph = {
  outgoing: Map<string, string[]>
  incoming: Map<string, string[]>
}

type InternalJob = {
  id: string
  name: string
  needs: string[]
  nodeIds: string[]
}

const USES: Record<string, string> = {
  checkout: "actions/checkout@v4",
  "setup-node": "actions/setup-node@v4",
  "setup-python": "actions/setup-python@v5",
  "upload-artifact": "actions/upload-artifact@v4",
  "download-artifact": "actions/download-artifact@v4",
  cache: "actions/cache@v4",
}

const RUN_COMMANDS = ["npm-install", "npm-build", "npm-test", "run-command"]

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
}

function splitList(value: string): string[] {
  return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean)
}

function envMap(env?: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(env ?? {})) {
    const name = key.trim()
    if (name) result[name] = value
  }
  return result
}

function envIssues(env: Record<string, string> | undefined, owner: string, issues: ValidationIssue[], nodeId?: string) {
  for (const key of Object.keys(env ?? {})) {
    const name = key.trim()
    if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      issues.push({
        level: "error",
        message: `"${owner}" has an invalid environment variable name: ${key || "(empty)"}`,
        nodeId,
      })
    }
  }
}

function buildGraph(project: WorkflowProject): Graph {
  const ids = new Set(project.nodes.map((node) => node.id))
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()
  for (const id of ids) {
    outgoing.set(id, [])
    incoming.set(id, [])
  }
  for (const edge of project.edges) {
    if (!ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target) continue
    outgoing.get(edge.source)?.push(edge.target)
    incoming.get(edge.target)?.push(edge.source)
  }
  return { outgoing, incoming }
}

function reachableFrom(start: string, graph: Graph): Set<string> {
  const seen = new Set<string>()
  const queue = [start]
  while (queue.length) {
    const id = queue.shift()
    if (!id || seen.has(id)) continue
    seen.add(id)
    for (const next of graph.outgoing.get(id) ?? []) queue.push(next)
  }
  return seen
}

function topologicalOrder(ids: Set<string>, graph: Graph): string[] | null {
  const indegree = new Map<string, number>()
  for (const id of ids) indegree.set(id, (graph.incoming.get(id) ?? []).filter((p) => ids.has(p)).length)

  const queue = [...ids].filter((id) => indegree.get(id) === 0)
  const order: string[] = []
  while (queue.length) {
    const id = queue.shift()
    if (!id) continue
    order.push(id)
    for (const next of graph.outgoing.get(id) ?? []) {
      if (!ids.has(next)) continue
      const degree = (indegree.get(next) ?? 0) - 1
      indegree.set(next, degree)
      if (degree === 0) queue.push(next)
    }
  }
  return order.length === ids.size ? order : null
}

export function validate(project: WorkflowProject): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  envIssues(project.env, project.workflowName || project.name || "Workflow", issues)
  if (project.nodes.length === 0) {
    return [{ level: "error", message: "Add a trigger and some nodes to build a workflow" }]
  }

  const graph = buildGraph(project)
  const triggers = project.nodes.filter((node) => node.data.kind === "trigger")
  if (triggers.length === 0) {
    issues.push({ level: "error", message: "A workflow needs exactly one trigger node" })
    return issues
  }
  if (triggers.length > 1) {
    issues.push({ level: "error", message: "Only one trigger node is allowed per workflow" })
  }

  const trigger = triggers[0]
  const reachable = reachableFrom(trigger.id, graph)
  const order = topologicalOrder(reachable, graph)
  if (!order) {
    issues.push({ level: "error", message: "The workflow contains a cycle — remove the loop between nodes" })
  }
  if ((graph.outgoing.get(trigger.id) ?? []).length === 0) {
    issues.push({ level: "error", message: "Connect the trigger to at least one node", nodeId: trigger.id })
  }

  for (const node of project.nodes) {
    envIssues(node.data.env, node.data.label, issues, node.id)
    if (!reachable.has(node.id)) {
      issues.push({ level: "warning", message: `"${node.data.label}" is not connected to the trigger`, nodeId: node.id })
    }
    if (node.data.kind === "script" && !node.data.code.trim()) {
      issues.push({ level: "warning", message: `"${node.data.label}" has an empty script`, nodeId: node.id })
    }
    if (node.data.kind === "trigger") {
      const data = node.data as TriggerNodeData
      if (data.events.includes("schedule") && !data.cron.trim()) {
        issues.push({ level: "error", message: "Schedule trigger needs a cron expression", nodeId: node.id })
      }
    }
  }
  return issues
}

function triggerConfig(data: TriggerNodeData): Record<string, unknown> {
  const on: Record<string, unknown> = {}
  const events = data.events.length ? data.events : (["push"] as const)
  for (const event of events) {
    if (event === "push" || event === "pull_request") {
      const config: Record<string, string[]> = {}
      const branches = splitList(data.branches)
      const paths = splitList(data.paths)
      if (branches.length) config.branches = branches
      if (paths.length) config.paths = paths
      on[event] = Object.keys(config).length ? config : null
    } else if (event === "schedule") {
      on.schedule = [{ cron: data.cron.trim() || "0 0 * * *" }]
    } else {
      on.workflow_dispatch = null
    }
  }
  return on
}

function scriptStep(node: WorkflowNode, data: ScriptNodeData): Record<string, unknown> {
  const extension: Record<ScriptLanguage, string> = { javascript: "js", typescript: "ts", python: "py" }
  const command: Record<ScriptLanguage, string> = {
    javascript: "node",
    typescript: "npx --yes tsx",
    python: "python",
  }
  const name = slug(data.label) || "script"
  const filename = `step_${name}.${extension[data.language]}`
  const delimiter = `YML_${name.toUpperCase()}_${node.id.replace(/[^a-zA-Z0-9]/g, "")}`
  const body = data.code.replace(/\r\n/g, "\n").replace(/\s+$/, "")
  const run = `cat > ${filename} <<'${delimiter}'\n${body}\n${delimiter}\n${command[data.language]} ${filename}`
  const env = envMap(data.env)
  return { name: data.label, run, ...(Object.keys(env).length ? { env } : {}) }
}

function actionStep(data: ActionNodeData): Record<string, unknown> {
  const definition = getActionDefinition(data.action)
  const values: Record<string, string> = {}
  for (const field of definition.fields) {
    const value = data.params[field.key]?.trim()
    if (value) values[field.key] = value
  }
  const env = envMap(data.env)
  const extra = Object.keys(env).length ? { env } : {}
  if (RUN_COMMANDS.includes(data.action)) {
    return { name: data.label, run: values.command || definition.fields[0].default, ...extra }
  }
  return {
    name: data.label,
    uses: USES[data.action],
    ...(Object.keys(values).length ? { with: values } : {}),
    ...extra,
  }
}

function jobSteps(nodeIds: string[], nodeMap: Map<string, WorkflowNode>): Record<string, unknown>[] {
  const steps: Record<string, unknown>[] = []

  for (const id of nodeIds) {
    const node = nodeMap.get(id)
    if (!node) continue
    if (node.data.kind === "script") {
      steps.push(scriptStep(node, node.data))
    } else if (node.data.kind === "action") {
      steps.push(actionStep(node.data))
    }
  }

  return steps
}

export function generate(project: WorkflowProject): GenerateResult {
  const issues = validate(project)
  const graph = buildGraph(project)
  const triggers = project.nodes.filter((node) => node.data.kind === "trigger")
  const nodeMap = new Map(project.nodes.map((node) => [node.id, node]))

  if (!triggers.length || project.nodes.length === 0) {
    return { yaml: "# Add a trigger node to generate a workflow\n", issues, jobCount: 0 }
  }

  const trigger = triggers[0]
  const reachable = reachableFrom(trigger.id, graph)
  const order = topologicalOrder(reachable, graph)
  if (!order) {
    return { yaml: "# Fix the cycle in the graph to generate a workflow\n", issues, jobCount: 0 }
  }

  const jobs: InternalJob[] = []
  const jobOf = new Map<string, string>()
  const usedJobIds = new Set<string>()

  const createJob = (nodeId: string, predecessors: string[]) => {
    const node = nodeMap.get(nodeId)
    const base = node ? slug(node.data.label) || "job" : "job"
    let id = base
    let suffix = 2
    while (usedJobIds.has(id)) id = `${base}_${suffix++}`
    usedJobIds.add(id)

    const needs = [...new Set(
      predecessors
        .map((predecessor) => jobOf.get(predecessor))
        .filter((value): value is string => Boolean(value) && value !== id),
    )]
    const job: InternalJob = { id, name: node?.data.label ?? "Job", needs, nodeIds: [nodeId] }
    jobs.push(job)
    jobOf.set(nodeId, id)
    return job
  }

  for (const id of order) {
    const predecessors = (graph.incoming.get(id) ?? []).filter((p) => reachable.has(p))

    if (predecessors.length === 0) continue
    if (predecessors.length > 1) {
      createJob(id, predecessors)
      continue
    }
    const predecessor = predecessors[0]
    if ((graph.outgoing.get(predecessor) ?? []).filter((s) => reachable.has(s)).length > 1) {
      createJob(id, [predecessor])
      continue
    }
    const parentJobId = jobOf.get(predecessor)
    const parentJob = jobs.find((job) => job.id === parentJobId)
    if (parentJob) {
      jobOf.set(id, parentJob.id)
      parentJob.nodeIds.push(id)
    } else {
      createJob(id, [predecessor])
    }
  }

  const triggerData = trigger.data as TriggerNodeData
  const jobEnv = envMap(triggerData.env)
  const jobsOut: Record<string, unknown> = {}
  for (const job of jobs) {
    jobsOut[job.id] = {
      name: job.name,
      ...(job.needs.length ? { needs: job.needs } : {}),
      "runs-on": project.runsOn || "ubuntu-latest",
      ...(Object.keys(jobEnv).length ? { env: jobEnv } : {}),
      steps: jobSteps(job.nodeIds, nodeMap),
    }
  }

  const workflowEnv = envMap(project.env)
  const workflow: Record<string, unknown> = {
    name: project.workflowName || project.name || "Workflow",
    on: triggerConfig(triggerData),
    ...(Object.keys(workflowEnv).length ? { env: workflowEnv } : {}),
    jobs: jobsOut,
  }

  return { yaml: YAML.stringify(workflow, { lineWidth: 0 }), issues, jobCount: jobs.length }
}
