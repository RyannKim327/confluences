import type { Edge, Node } from "@xyflow/react"

export type TriggerEvent = "push" | "pull_request" | "schedule" | "workflow_dispatch"
export type ScriptLanguage = "javascript" | "typescript" | "python"

export type ActionType =
  | "checkout"
  | "setup-node"
  | "setup-python"
  | "npm-install"
  | "npm-build"
  | "npm-test"
  | "run-command"
  | "upload-artifact"
  | "download-artifact"
  | "cache"

export type TriggerNodeData = {
  kind: "trigger"
  label: string
  events: TriggerEvent[]
  branches: string
  paths: string
  cron: string
  env?: Record<string, string>
}

export type ScriptNodeData = {
  kind: "script"
  label: string
  language: ScriptLanguage
  code: string
  env?: Record<string, string>
}

export type ActionNodeData = {
  kind: "action"
  label: string
  action: ActionType
  params: Record<string, string>
  env?: Record<string, string>
}

export type WorkflowNodeData = TriggerNodeData | ScriptNodeData | ActionNodeData

export type WorkflowNode = Node<WorkflowNodeData, "workflow">

export type ActionField = {
  key: string
  label: string
  placeholder?: string
  default: string
}

export type ActionDefinition = {
  type: ActionType
  label: string
  description: string
  group: "Source" | "Runtime" | "Command" | "Artifacts"
  fields: ActionField[]
}

export const ACTIONS: ActionDefinition[] = [
  {
    type: "checkout",
    label: "Checkout",
    description: "Clone the repository",
    group: "Source",
    fields: [
      { key: "repository", label: "Repository", placeholder: "owner/repo", default: "" },
      { key: "ref", label: "Ref", placeholder: "main", default: "" },
      { key: "fetch-depth", label: "Fetch depth", default: "1" },
      { key: "submodules", label: "Submodules", default: "false" },
    ],
  },
  {
    type: "setup-node",
    label: "Setup Node",
    description: "Install a Node.js version",
    group: "Runtime",
    fields: [
      { key: "node-version", label: "Node version", default: "20" },
      { key: "cache", label: "Cache", default: "npm" },
    ],
  },
  {
    type: "setup-python",
    label: "Setup Python",
    description: "Install a Python version",
    group: "Runtime",
    fields: [{ key: "python-version", label: "Python version", default: "3.11" }],
  },
  {
    type: "npm-install",
    label: "Install deps",
    description: "Install npm dependencies",
    group: "Command",
    fields: [{ key: "command", label: "Command", default: "npm ci" }],
  },
  {
    type: "npm-build",
    label: "Build",
    description: "Run the build script",
    group: "Command",
    fields: [{ key: "command", label: "Command", default: "npm run build" }],
  },
  {
    type: "npm-test",
    label: "Test",
    description: "Run the test suite",
    group: "Command",
    fields: [{ key: "command", label: "Command", default: "npm test" }],
  },
  {
    type: "run-command",
    label: "Shell command",
    description: "Run an arbitrary command",
    group: "Command",
    fields: [{ key: "command", label: "Command", default: "echo 'Hello world'" }],
  },
  {
    type: "upload-artifact",
    label: "Upload artifact",
    description: "Store build output",
    group: "Artifacts",
    fields: [
      { key: "name", label: "Name", default: "build" },
      { key: "path", label: "Path", default: "dist" },
    ],
  },
  {
    type: "download-artifact",
    label: "Download artifact",
    description: "Restore a stored artifact",
    group: "Artifacts",
    fields: [
      { key: "name", label: "Name", default: "build" },
      { key: "path", label: "Path", default: "dist" },
    ],
  },
  {
    type: "cache",
    label: "Cache",
    description: "Cache dependencies",
    group: "Artifacts",
    fields: [
      { key: "path", label: "Path", default: "node_modules" },
      { key: "key", label: "Key", default: "${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}" },
    ],
  },
]

export function getActionDefinition(type: ActionType): ActionDefinition {
  return ACTIONS.find((a) => a.type === type) ?? ACTIONS[0]
}

export const SCRIPT_STARTER: Record<ScriptLanguage, string> = {
  javascript: 'console.log("Hello from JavaScript")\n',
  typescript: 'const message: string = "Hello from TypeScript"\nconsole.log(message)\n',
  python: 'print("Hello from Python")\n',
}

export const LANGUAGE_LABEL: Record<ScriptLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
}

export const TRIGGER_LABEL: Record<TriggerEvent, string> = {
  push: "Push",
  pull_request: "Pull request",
  schedule: "Schedule",
  workflow_dispatch: "Manual",
}

export type WorkflowProject = {
  id: string
  name: string
  workflowName: string
  runsOn: string
  env?: Record<string, string>
  nodes: WorkflowNode[]
  edges: Edge[]
  updatedAt: number
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function makeTriggerNode(position = { x: 80, y: 200 }): WorkflowNode {
  return {
    id: `trigger_${uid()}`,
    type: "workflow",
    position,
    data: {
      kind: "trigger",
      label: "Trigger",
      events: ["push"],
      branches: "main",
      paths: "",
      cron: "0 0 * * *",
      env: {},
    },
  }
}

export function makeScriptNode(language: ScriptLanguage, position = { x: 380, y: 200 }): WorkflowNode {
  return {
    id: `script_${uid()}`,
    type: "workflow",
    position,
    data: {
      kind: "script",
      label: `${LANGUAGE_LABEL[language]} script`,
      language,
      code: SCRIPT_STARTER[language],
      env: {},
    },
  }
}

export function makeActionNode(type: ActionType, position = { x: 380, y: 200 }): WorkflowNode {
  const definition = getActionDefinition(type)
  return {
    id: `action_${uid()}`,
    type: "workflow",
    position,
    data: {
      kind: "action",
      label: definition.label,
      action: type,
      params: Object.fromEntries(definition.fields.map((field) => [field.key, field.default])),
      env: {},
    },
  }
}

export function makeStarterProject(): WorkflowProject {
  const trigger = makeTriggerNode({ x: 40, y: 220 })
  const checkout = makeActionNode("checkout", { x: 360, y: 220 })
  const script = makeScriptNode("javascript", { x: 680, y: 220 })
  return {
    id: uid(),
    name: "My first workflow",
    workflowName: "CI",
    runsOn: "ubuntu-latest",
    env: {},
    nodes: [trigger, checkout, script],
    edges: [
      { id: `e_${uid()}`, source: trigger.id, target: checkout.id },
      { id: `e_${uid()}`, source: checkout.id, target: script.id },
    ],
    updatedAt: Date.now(),
  }
}
