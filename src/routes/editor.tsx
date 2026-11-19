import { useCallback, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeTypes,
} from "@xyflow/react"
import { ArrowLeft, FileCode2, FlaskConical, Save, Settings2 } from "lucide-react"
import Inspector from "../components/editor/inspector"
import NodePalette, { DRAG_KEY, type PaletteItem } from "../components/editor/node-palette"
import TestPanel from "../components/editor/test-panel"
import WorkflowNodeView from "../components/editor/workflow-node"
import YamlPanel from "../components/editor/yaml-panel"
import { generate } from "../lib/workflow/generate"
import { loadProjects, upsertProject } from "../lib/storage-parser"
import {
  makeActionNode,
  makeScriptNode,
  makeStarterProject,
  makeTriggerNode,
  type WorkflowNode,
  type WorkflowNodeData,
  type WorkflowProject,
} from "../lib/workflow/types"

const nodeTypes: NodeTypes = { workflow: WorkflowNodeView }

function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const initial = useMemo(() => {
    const existing = id ? loadProjects().find((project) => project.id === id) : undefined
    return existing ?? makeStarterProject()
  }, [id])

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initial.edges)
  const [projectId, setProjectId] = useState(initial.id)
  const [meta, setMeta] = useState<Pick<WorkflowProject, "name" | "workflowName" | "runsOn" | "env">>({
    name: initial.name,
    workflowName: initial.workflowName,
    runsOn: initial.runsOn,
    env: initial.env ?? {},
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<"properties" | "yaml" | "test">("yaml")
  const [notice, setNotice] = useState("")
  const wrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const project: WorkflowProject = useMemo(
    () => ({ id: projectId, ...meta, nodes, edges, updatedAt: initial.updatedAt }),
    [projectId, meta, nodes, edges, initial.updatedAt],
  )
  const result = useMemo(() => generate(project), [project])
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null

  const flash = useCallback((message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2200)
  }, [])

  const addNode = useCallback(
    (item: PaletteItem, position?: { x: number; y: number }) => {
      if (item.type === "trigger" && nodes.some((node) => node.data.kind === "trigger")) {
        flash("A workflow can only have one trigger")
        return
      }
      const rect = wrapper.current?.getBoundingClientRect()
      const center = position ?? screenToFlowPosition({
        x: (rect?.left ?? 0) + (rect?.width ?? 800) / 2,
        y: (rect?.top ?? 0) + (rect?.height ?? 600) / 2,
      })
      const offset = position ? 0 : Math.random() * 40 - 20
      const at = { x: center.x + offset, y: center.y + offset }

      const node =
        item.type === "trigger"
          ? makeTriggerNode(at)
          : item.type === "script"
            ? makeScriptNode(item.language, at)
            : makeActionNode(item.action, at)
      setNodes((current) => [...current, node])
      setSelectedId(node.id)
      setTab("properties")
    },
    [flash, nodes, screenToFlowPosition, setNodes],
  )

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) =>
        addEdge(
          { ...connection, animated: true, style: { stroke: "#a3e635", strokeWidth: 2 } },
          current,
        ),
      ),
    [setEdges],
  )

  const updateData = useCallback(
    (updater: (data: WorkflowNodeData) => WorkflowNodeData) => {
      if (!selectedId) return
      setNodes((current) =>
        current.map((node) => (node.id === selectedId ? { ...node, data: updater(node.data) } : node)),
      )
    },
    [selectedId, setNodes],
  )

  const removeSelected = useCallback(() => {
    if (!selectedId) return
    setNodes((current) => current.filter((node) => node.id !== selectedId))
    setEdges((current) => current.filter((edge) => edge.source !== selectedId && edge.target !== selectedId))
    setSelectedId(null)
  }, [selectedId, setEdges, setNodes])

  const save = () => {
    const saved = upsertProject({ ...project, updatedAt: Date.now() })
    flash(saved ? "Saved to this browser" : "Could not save project")
    setProjectId(project.id)
    if (saved && !id) navigate(`/editor/${project.id}`, { replace: true })
  }

  return (
    <div className="flex h-full min-h-[560px] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#0a0a0a]">
      <NodePalette onAdd={addNode} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-white/10 bg-[#111] px-4 py-2.5">
          <Link to="/projects" title="Back to projects" className="text-white/50 transition hover:text-lime-300">
            <ArrowLeft size={17} />
          </Link>
          <input
            aria-label="Project name"
            value={meta.name}
            onChange={(event) => setMeta((current) => ({ ...current, name: event.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
            placeholder="Untitled project"
          />
          {notice && <span className="text-[11px] text-lime-300">{notice}</span>}
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-1.5 rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-bold text-black transition hover:bg-lime-300"
          >
            <Save size={14} /> Save
          </button>
        </div>

        <div ref={wrapper} className="relative min-h-0 flex-1 bg-[#0a0a0a]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeContextMenu={(event, edge) => {
              event.preventDefault()
              setEdges((current) => current.filter((item) => item.id !== edge.id))
            }}
            onNodeClick={(_, node) => {
              setSelectedId(node.id)
              setTab("properties")
            }}
            onPaneClick={() => setSelectedId(null)}
            onNodesDelete={(deleted) => {
              if (deleted.some((node) => node.id === selectedId)) setSelectedId(null)
            }}
            isValidConnection={(connection) => connection.source !== connection.target}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = "move"
            }}
            onDrop={(event) => {
              event.preventDefault()
              const raw = event.dataTransfer.getData(DRAG_KEY)
              if (!raw) return
              try {
                addNode(JSON.parse(raw) as PaletteItem, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
              } catch {
                flash("Could not add that node")
              }
            }}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{ animated: true, style: { stroke: "#a3e635", strokeWidth: 2 } }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
            <Controls className="!border-white/10 !bg-[#181818] [&_button]:!border-white/10 [&_button]:!bg-[#181818] [&_button]:!fill-white/60" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => (node.data.kind === "trigger" ? "#a78bfa" : "#a3e635")}
              maskColor="rgba(0,0,0,0.7)"
              className="!border !border-white/10 !bg-[#111]"
            />
          </ReactFlow>
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-white/10 bg-[#111]/90 px-3 py-1.5 text-[11px] text-white/40">
            Drag handles to connect · Right-click a line to remove it · Click a node to edit
          </div>
        </div>
      </div>

      <div className="flex w-[380px] shrink-0 flex-col border-l border-white/10 bg-[#111]">
        <div className="flex border-b border-white/10">
          <button
            type="button"
            onClick={() => setTab("properties")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition ${tab === "properties" ? "border-b-2 border-lime-400 text-lime-300" : "text-white/40 hover:text-white/70"
              }`}
          >
            <Settings2 size={14} /> Properties
          </button>
          <button
            type="button"
            onClick={() => setTab("yaml")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition ${tab === "yaml" ? "border-b-2 border-lime-400 text-lime-300" : "text-white/40 hover:text-white/70"
              }`}
          >
            <FileCode2 size={14} /> YAML
          </button>
          <button
            type="button"
            onClick={() => setTab("test")}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-bold transition ${tab === "test" ? "border-b-2 border-lime-400 text-lime-300" : "text-white/40 hover:text-white/70"
              }`}
          >
            <FlaskConical size={14} /> Test
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden overflow-y-auto">
          {tab === "yaml" ? (
            <YamlPanel result={result} filename={meta.workflowName || meta.name} />
          ) : tab === "test" ? (
            <TestPanel generatedYaml={result.yaml} />
          ) : (
            <Inspector
              node={selectedNode}
              project={project}
              issues={result.issues}
              onMeta={(patch) => setMeta((current) => ({ ...current, ...patch }))}
              onData={updateData}
              onDelete={removeSelected}
              onSelectIssue={(nodeId) => setSelectedId(nodeId)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function EditorRoute() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  )
}
