# Confluences

A visual editor that turns a node graph into a GitHub Actions workflow YAML file.

## Features

- n8n-style canvas: drag nodes from the library, connect handles, pan/zoom
- Trigger node with push, pull_request, schedule, and workflow_dispatch events
- Custom script nodes for JavaScript, TypeScript, and Python with an inline code editor
- Built-in action nodes (checkout, runtime setup, npm commands, artifacts, cache)
- Environment variables at workflow, job (trigger node), and step level, with `${{ secrets.* }}` / `${{ vars.* }}` support
- Branches become separate jobs with `needs`; converging nodes wait for all upstream jobs
- Generated steps follow the graph from the trigger to the end, excluding the trigger itself
- Live YAML preview with validation, copy, and download
- Test tab that validates generated YAML or an uploaded/pasted .yml file against GitHub Actions structure rules
- Projects saved in browser local storage

## Run

```bash
npm install
npm run dev
```

## Checks

```bash
npm test
npm run lint
npm run build
```
