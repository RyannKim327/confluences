import { describe, expect, it } from "vitest"
import { generate } from "./generate"
import { makeStarterProject } from "./types"
import { validateYaml } from "./validate-yaml"

const validWorkflow = generate(makeStarterProject()).yaml

function messages(source: string): string[] {
  return validateYaml(source).checks.map((check) => check.message)
}

describe("validateYaml", () => {
  it("accepts generated workflow YAML", () => {
    const result = validateYaml(validWorkflow)
    expect(result.valid).toBe(true)
    expect(result.jobCount).toBe(1)
    expect(result.eventCount).toBe(1)
    expect(result.checks).toHaveLength(0)
  })

  it("reports syntax errors with a line number", () => {
    const result = validateYaml("name: Broken\njobs: [\n")
    expect(result.valid).toBe(false)
    expect(result.checks[0].line).toBe(3)
    expect(result.checks[0].path).toBe("syntax")
  })

  it("rejects empty files", () => {
    expect(messages("  \n")).toContain("YAML file is empty")
  })

  it("requires on: and jobs:", () => {
    const checks = messages("name: Test\n")
    expect(checks).toContain('Missing required "on:" trigger')
    expect(checks).toContain('Missing required "jobs:" section')
  })

  it("warns when the workflow has no name", () => {
    expect(messages(validWorkflow.replace("name: CI\n", ""))).toContain("Workflow has no top-level name:")
  })

  it("rejects unknown trigger events", () => {
    expect(messages(validWorkflow.replace("push:", "pussh:"))).toContain('Unknown trigger event "pussh"')
  })

  it("rejects steps that have both uses and run", () => {
    const source = validWorkflow.replace(
      "      - name: Checkout\n",
      "      - name: Checkout\n        run: echo hi\n",
    )
    expect(messages(source).some((message) => message.includes("cannot have both"))).toBe(true)
  })

  it("rejects needs that reference an unknown job", () => {
    const source = `name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    needs: missing
    steps:
      - run: echo hi
`
    expect(messages(source).some((message) => message.includes('needs unknown job "missing"'))).toBe(true)
  })

  it("detects cycles in job dependencies", () => {
    const source = `name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - run: echo hi
  test:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - run: echo hi
`
    expect(messages(source).some((message) => message.includes("Job dependency cycle"))).toBe(true)
  })

  it("rejects invalid env names anywhere in the file", () => {
    const source = validWorkflow.replace("    steps:\n", "    env:\n      BAD-NAME: x\n    steps:\n")
    expect(messages(source).some((message) => message.includes('Invalid environment variable name "BAD-NAME"'))).toBe(true)
  })

  it("warns about unbalanced expressions", () => {
    expect(messages(validWorkflow + "# ${{ secrets.OPEN\n")).toContain("Unbalanced ${{ ... }} expression braces")
  })

  it("requires a cron expression for schedules", () => {
    const source = `name: Test
on:
  schedule:
    - notcron: x
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo hi
`
    expect(messages(source).some((message) => message.includes("needs a cron expression"))).toBe(true)
  })
})
