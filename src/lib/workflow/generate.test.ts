import { describe, expect, it } from "vitest"
import YAML from "yaml"
import type { Edge } from "@xyflow/react"
import { generate, validate } from "./generate"
import type {
  ActionType,
  ScriptLanguage,
  TriggerEvent,
  WorkflowNode,
  WorkflowNodeData,
  WorkflowProject,
} from "./types"

function node(id: string, data: WorkflowNodeData): WorkflowNode {
  return { id, type: "workflow", position: { x: 0, y: 0 }, data }
}

function link(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target }
}

function trigger(overrides: Partial<Extract<WorkflowNodeData, { kind: "trigger" }>> = {}): WorkflowNode {
  return node("t", {
    kind: "trigger",
    label: "Trigger",
    events: ["push"],
    branches: "main",
    paths: "",
    cron: "0 0 * * *",
    env: {},
    ...overrides,
  })
}

function action(id: string, type: ActionType, overrides: Partial<Extract<WorkflowNodeData, { kind: "action" }>> = {}): WorkflowNode {
  return node(id, {
    kind: "action",
    label: type,
    action: type,
    params: {},
    env: {},
    ...overrides,
  })
}

function script(
  id: string,
  language: ScriptLanguage,
  overrides: Partial<Extract<WorkflowNodeData, { kind: "script" }>> = {},
): WorkflowNode {
  return node(id, {
    kind: "script",
    label: `${language} script`,
    language,
    code: 'console.log("hi")\n',
    env: {},
    ...overrides,
  })
}

function project(nodes: WorkflowNode[], edges: Edge[], overrides: Partial<WorkflowProject> = {}): WorkflowProject {
  return {
    id: "p1",
    name: "Test project",
    workflowName: "CI",
    runsOn: "ubuntu-latest",
    env: {},
    nodes,
    edges,
    updatedAt: 0,
    ...overrides,
  }
}

function parse(yaml: string): Record<string, any> {
  return YAML.parse(yaml) as Record<string, any>
}

const checkout = () => action("c", "checkout", { label: "Checkout" })

describe("generate", () => {
  it("builds a linear job from the graph nodes, excluding the trigger", () => {
    const result = generate(project([trigger(), checkout(), script("js", "javascript")], [link("t", "c"), link("c", "js")]))
    const parsed = parse(result.yaml)

    expect(result.issues).toEqual([])
    expect(parsed.name).toBe("CI")
    expect(parsed.on.push.branches).toEqual(["main"])
    expect(parsed.jobs.checkout.steps.map((step: any) => step.name)).toEqual(["Checkout", "javascript script"])
    expect(parsed.jobs.checkout.steps[1].run).toContain("node step_javascript_script.js")
  })

  it("writes script code to a file using a matching heredoc delimiter", () => {
    const result = generate(project([trigger(), script("js", "javascript", { code: 'echo "quoted"\n' })], [link("t", "js")]))
    const run = parse(result.yaml).jobs.javascript_script.steps.at(-1).run as string
    const delimiter = run.match(/<<'([^']+)'/)?.[1]

    expect(delimiter).toBeTruthy()
    expect(run).toContain(`echo "quoted"\n${delimiter}\nnode step_javascript_script.js`)
  })

  it("uses the right command for TypeScript and Python without injected setup", () => {
    const ts = generate(project([trigger(), script("ts", "typescript")], [link("t", "ts")]))
    const py = generate(project([trigger(), script("py", "python")], [link("t", "py")]))

    expect(ts.yaml).toContain("npx --yes tsx step_typescript_script.ts")
    expect(ts.yaml).not.toContain("actions/setup-node@v4")
    expect(py.yaml).toContain("python step_python_script.py")
    expect(py.yaml).not.toContain("actions/setup-python@v5")
    expect(py.yaml).not.toContain("actions/setup-node@v4")
  })

  it("starts with the first node after the trigger, such as install before code", () => {
    const install = action("install", "npm-install", { label: "Install" })
    const code = script("code", "javascript", { label: "Code" })
    const result = generate(project([trigger(), install, code], [link("t", "install"), link("install", "code")]))
    const steps = parse(result.yaml).jobs.install.steps

    expect(steps.map((step: any) => step.name)).toEqual(["Install", "Code"])
    expect(steps[0].run).toBe("npm ci")
  })

  it("combines trigger events, branches, paths, cron and manual dispatch", () => {
    const events: TriggerEvent[] = ["push", "pull_request", "schedule", "workflow_dispatch"]
    const result = generate(project([trigger({ events, branches: "main, dev", paths: "src/**", cron: "*/5 * * * *" }), checkout()], [link("t", "c")]))
    const parsed = parse(result.yaml)

    expect(parsed.on.push).toEqual({ branches: ["main", "dev"], paths: ["src/**"] })
    expect(parsed.on.pull_request).toEqual({ branches: ["main", "dev"], paths: ["src/**"] })
    expect(parsed.on.schedule).toEqual([{ cron: "*/5 * * * *" }])
    expect(parsed.on).toHaveProperty("workflow_dispatch")
  })

  it("turns branches into separate jobs with needs", () => {
    const py = script("py", "python")
    const result = generate(
      project(
        [trigger(), checkout(), script("js", "javascript"), py],
        [link("t", "c"), link("c", "js"), link("c", "py")],
      ),
    )
    const jobs = parse(result.yaml).jobs

    expect(jobs.javascript_script.needs).toEqual(["checkout"])
    expect(jobs.python_script.needs).toEqual(["checkout"])
    expect(jobs.checkout.needs).toBeUndefined()
    expect(result.jobCount).toBe(3)
  })

  it("makes a converging step wait for every upstream job", () => {
    const test = action("test", "npm-test", { label: "Test" })
    const result = generate(
      project(
        [trigger(), script("js", "javascript"), script("py", "python"), test],
        [link("t", "js"), link("t", "py"), link("js", "test"), link("py", "test")],
      ),
    )
    const jobs = parse(result.yaml).jobs

    expect(jobs.test.needs).toEqual(["javascript_script", "python_script"])
    expect(result.jobCount).toBe(3)
  })

  it("emits workflow, job and step environment variables", () => {
    const js = script("js", "javascript", { env: { TOKEN: "${{ secrets.TOKEN }}", LOCAL: "yes" } })
    const result = generate(
      project(
        [trigger({ env: { CI_MODE: "true" } }), js],
        [link("t", "js")],
        { env: { API_URL: "https://example.com", EMPTY: "" } },
      ),
    )
    const parsed = parse(result.yaml)

    expect(parsed.env).toEqual({ API_URL: "https://example.com", EMPTY: "" })
    expect(parsed.jobs.javascript_script.env).toEqual({ CI_MODE: "true" })
    expect(parsed.jobs.javascript_script.steps.at(-1).env).toEqual({ TOKEN: "${{ secrets.TOKEN }}", LOCAL: "yes" })
  })

  it("skips environment entries with empty names", () => {
    const js = script("js", "javascript", { env: { "": "ignored", VALID: "kept" } })
    const result = generate(project([trigger(), js], [link("t", "js")]))
    const step = parse(result.yaml).jobs.javascript_script.steps.at(-1)

    expect(step.env).toEqual({ VALID: "kept" })
  })
})

describe("validate", () => {
  it("requires a trigger", () => {
    const result = validate(project([checkout()], []))
    expect(result).toEqual([{ level: "error", message: "A workflow needs exactly one trigger node" }])
  })

  it("rejects multiple triggers", () => {
    const second = trigger()
    second.id = "t2"
    const result = validate(project([trigger(), second, checkout()], [link("t", "c")]))
    expect(result.some((issue) => issue.message.includes("Only one trigger"))).toBe(true)
  })

  it("rejects cycles", () => {
    const result = generate(project([trigger(), checkout()], [link("t", "c"), link("c", "t")]))
    expect(result.issues.some((issue) => issue.message.includes("cycle"))).toBe(true)
    expect(result.yaml).toContain("# Fix the cycle")
  })

  it("warns about disconnected nodes and empty scripts", () => {
    const isolated = script("lonely", "python", { code: "  " })
    const result = validate(project([trigger(), checkout(), isolated], [link("t", "c")]))
    expect(result.some((issue) => issue.level === "warning" && issue.message.includes("not connected"))).toBe(true)
    expect(result.some((issue) => issue.message.includes("empty script"))).toBe(true)
  })

  it("rejects invalid environment variable names", () => {
    const js = script("js", "javascript", { env: { "BAD-NAME": "x" } })
    const result = validate(project([trigger(), js], [link("t", "js")]))
    expect(result.some((issue) => issue.level === "error" && issue.message.includes("invalid environment variable"))).toBe(true)
  })

  it("requires a cron expression for scheduled workflows", () => {
    const result = validate(project([trigger({ events: ["schedule"], cron: "" }), checkout()], [link("t", "c")]))
    expect(result.some((issue) => issue.message.includes("cron"))).toBe(true)
  })

  it("requires the trigger to be connected", () => {
    const result = validate(project([trigger(), checkout()], []))
    expect(result.some((issue) => issue.message.includes("Connect the trigger"))).toBe(true)
  })
})
