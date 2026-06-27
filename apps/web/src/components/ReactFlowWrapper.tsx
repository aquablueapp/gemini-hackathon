import { Background, Controls, type Edge, type Node, ReactFlow } from '@xyflow/react'
import * as React from 'react'
import '@xyflow/react/dist/style.css'

interface WorkflowData {
  nodes: Node[]
  edges: Edge[]
}

export default function ReactFlowWrapper({ data }: { data: string }) {
  const [parsedData, setParsedData] = React.useState<WorkflowData>({ nodes: [], edges: [] })
  const [nodeStatuses, setNodeStatuses] = React.useState<Record<string, string>>({})
  const [error, setError] = React.useState<string | null>(null)

  // Listen to window custom event for node status updates
  React.useEffect(() => {
    const handleNodeStatus = (event: Event) => {
      const customEvent = event as CustomEvent
      if (!customEvent.detail)
        return

      try {
        let payload: Record<string, unknown> | null = null
        if (typeof customEvent.detail === 'string') {
          payload = JSON.parse(customEvent.detail)
        }
        else if (typeof customEvent.detail === 'object' && customEvent.detail !== null) {
          payload = customEvent.detail as Record<string, unknown>
        }

        if (payload) {
          const id = (payload.nodeId || payload.node_id) as string | undefined
          const status = payload.status as string | undefined

          if (id && status) {
            setNodeStatuses(prev => ({
              ...prev,
              [id]: status,
            }))
          }
        }
      } catch {
        // Silently catch JSON parse errors to remain robust
      }
    }

    window.addEventListener('node-status', handleNodeStatus)
    return () => {
      window.removeEventListener('node-status', handleNodeStatus)
    }
  }, [])

  // Parse raw data on change
  React.useEffect(() => {
    try {
      // Find the first JSON-like structure if wrap has text
      let jsonStr = data.trim()
      const jsonStart = jsonStr.indexOf('{')
      const jsonEnd = jsonStr.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1)
      }

      const parsed = JSON.parse(jsonStr) as WorkflowData
      if (parsed && Array.isArray(parsed.nodes)) {
        setParsedData(parsed)
        setNodeStatuses({}) // reset live statuses to prevent stale contamination on schema change
        setError(null)
      }
      else {
        setError('Invalid workflow nodes array')
      }
    } catch {
      setError('JSON Parse Error: Failed to parse workflow graph schema')
    }
  }, [data])

  // Dynamically compute styled nodes based on state
  const nodes = React.useMemo(() => {
    return parsedData.nodes.map((n) => {
      const status = nodeStatuses[n.id] || (n.data?.status as string | undefined)
      if (n.className && !status) {
        return n
      }

      const isInput = n.type === 'input'
      const isOutput = n.type === 'output'

      let borderClass = 'border-stone-250 dark:border-stone-850'
      let textClass = 'text-stone-800 dark:text-stone-200'
      let bgClass = 'bg-white/80 dark:bg-stone-900/80'
      let extraClass = ''

      if (status) {
        if (status === 'running' || status === 'active') {
          borderClass = 'border-blue-500 shadow-blue-100 dark:shadow-blue-950/20'
          bgClass = 'bg-blue-50/70 dark:bg-blue-950/30'
          textClass = 'text-blue-950 dark:text-blue-200'
          extraClass = 'animate-pulse'
        }
        else if (status === 'success' || status === 'completed') {
          borderClass = 'border-emerald-500'
          bgClass = 'bg-emerald-50/70 dark:bg-emerald-950/20'
          textClass = 'text-emerald-900 dark:text-emerald-250'
        }
        else if (status === 'failed' || status === 'error') {
          borderClass = 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/20'
          textClass = 'text-rose-900 dark:text-rose-250'
          extraClass = 'animate-bounce'
        }
        else {
          // default status (e.g. pending)
          borderClass = 'border-stone-250 dark:border-stone-850'
          extraClass = 'opacity-60'
        }
      }
      else {
        // Fallback to original preset stylings
        if (isInput) {
          borderClass = 'border-blue-500/60 dark:border-blue-400/60'
          bgClass = 'bg-blue-50/70 dark:bg-blue-950/30'
          textClass = 'text-blue-950 dark:text-blue-200'
        }
        else if (isOutput) {
          borderClass = 'border-emerald-500/60 dark:border-emerald-400/60'
          bgClass = 'bg-emerald-50/70 dark:bg-emerald-950/30'
          textClass = 'text-emerald-950 dark:text-emerald-200'
        }
      }

      return {
        ...n,
        className: `px-4 py-3 rounded-xl border-2 ${borderClass} ${bgClass} ${textClass} ${extraClass} backdrop-blur-md shadow-sm font-sans text-xs font-bold text-center flex items-center justify-center transition-all hover:scale-105 select-none`,
        style: {
          ...n.style,
          boxShadow: status && (status === 'running' || status === 'active') ? undefined : '0 4px 12px rgba(0, 0, 0, 0.05)',
        },
      }
    })
  }, [parsedData.nodes, nodeStatuses])

  // Dynamically compute styled edges based on source node status
  const edges = React.useMemo(() => {
    return (parsedData.edges || []).map((e) => {
      const sourceNode = parsedData.nodes.find(n => n.id === e.source)
      const sourceStatus = nodeStatuses[e.source] || (sourceNode?.data?.status as string | undefined)
      const isSourceSuccess = sourceStatus === 'success' || sourceStatus === 'completed'

      return {
        ...e,
        animated: isSourceSuccess ? true : (e.animated !== false),
        style: {
          ...e.style,
          stroke: isSourceSuccess ? '#10b981' : '#78716c', // Emerald green or stone gray
          strokeWidth: 2,
        },
      }
    })
  }, [parsedData.edges, nodeStatuses])

  if (error) {
    return (
      <div className="w-full h-80 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 flex items-center justify-center text-xs text-rose-500 font-mono p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="w-full h-80 rounded-xl border border-stone-200 dark:border-stone-850 bg-stone-50 dark:bg-stone-950 overflow-hidden shadow-inner my-3 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        zoomOnScroll={false}
        nodesDraggable={true}
        nodesConnectable={false}
        preventScrolling={true}
        colorMode="system"
      >
        <Background gap={12} size={1} className="text-stone-300 dark:text-stone-900 opacity-60" />
        <Controls showInteractive={false} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-850 dark:text-stone-150 rounded-lg shadow-sm" />
      </ReactFlow>
    </div>
  )
}
