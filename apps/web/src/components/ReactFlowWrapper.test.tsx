import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { type Edge, type Node } from '@xyflow/react'
import ReactFlowWrapper from './ReactFlowWrapper'

// Mock ReactFlow components to easily assert on nodes and edges
vi.mock('@xyflow/react', async (importOriginal) => {
  const original = await importOriginal<typeof import('@xyflow/react')>()
  return {
    ...original,
    ReactFlow: ({ children, nodes, edges }: { children?: React.ReactNode; nodes: Node[]; edges: Edge[] }) => (
      <div data-testid="rf-mock">
        <div data-testid="rf-nodes">
          {nodes.map((n: Node) => (
            <div key={n.id} data-testid={`node-${n.id}`} className={n.className}>
              {(n.data?.label as string) || n.id}
            </div>
          ))}
        </div>
        <div data-testid="rf-edges">
          {edges.map((e: Edge) => (
            <div key={e.id} data-testid={`edge-${e.id}`} data-animated={e.animated ? 'true' : 'false'}>
              {e.id}
            </div>
          ))}
        </div>
        {children}
      </div>
    ),
    Controls: () => <div data-testid="rf-controls" />,
    Background: () => <div data-testid="rf-background" />,
  }
})

describe('reactFlowWrapper', () => {
  const mockData = JSON.stringify({
    nodes: [
      { id: '1', data: { label: 'Node 1' }, position: { x: 0, y: 0 } },
      { id: '2', data: { label: 'Node 2' }, position: { x: 100, y: 0 } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: false },
    ],
  })

  it('renders nodes and edges successfully', () => {
    render(<ReactFlowWrapper data={mockData} />)

    expect(screen.getByTestId('node-1')).toBeInTheDocument()
    expect(screen.getByTestId('node-2')).toBeInTheDocument()
    expect(screen.getByTestId('edge-e1-2')).toBeInTheDocument()
    expect(screen.getByTestId('edge-e1-2')).toHaveAttribute('data-animated', 'false')
  })

  it('updates node className when custom node-status event is dispatched', () => {
    render(<ReactFlowWrapper data={mockData} />)

    const node1 = screen.getByTestId('node-1')

    // Dispatch running status
    fireEvent(window, new CustomEvent('node-status', {
      detail: JSON.stringify({ nodeId: '1', status: 'running' }),
    }))

    expect(node1.className).toContain('border-blue-500')
    expect(node1.className).toContain('animate-pulse')
  })

  it('supports snake_case (node_id) keys in event payload', () => {
    render(<ReactFlowWrapper data={mockData} />)

    const node1 = screen.getByTestId('node-1')

    // Dispatch running status with snake_case node_id
    fireEvent(window, new CustomEvent('node-status', {
      detail: JSON.stringify({ node_id: '1', status: 'failed' }),
    }))

    expect(node1.className).toContain('border-rose-500')
  })

  it('animates edges originating from node when its status is success', () => {
    render(<ReactFlowWrapper data={mockData} />)

    const edge = screen.getByTestId('edge-e1-2')
    expect(edge).toHaveAttribute('data-animated', 'false')

    // Dispatch success status
    fireEvent(window, new CustomEvent('node-status', {
      detail: JSON.stringify({ nodeId: '1', status: 'success' }),
    }))

    expect(edge).toHaveAttribute('data-animated', 'true')
  })

  it('loads preset node statuses and animates edges from custom data', () => {
    const presetData = JSON.stringify({
      nodes: [
        { id: '1', data: { label: 'Node 1', status: 'success' }, position: { x: 0, y: 0 } },
        { id: '2', data: { label: 'Node 2' }, position: { x: 100, y: 0 } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: false },
      ],
    })

    render(<ReactFlowWrapper data={presetData} />)
    const node1 = screen.getByTestId('node-1')
    expect(node1.className).toContain('border-emerald-500')

    const edge = screen.getByTestId('edge-e1-2')
    expect(edge).toHaveAttribute('data-animated', 'true')
  })

  it('cleans up nodeStatuses on new workflow data schema', () => {
    const { rerender } = render(<ReactFlowWrapper data={mockData} />)

    // Dispatch status for node-1
    fireEvent(window, new CustomEvent('node-status', {
      detail: JSON.stringify({ nodeId: '1', status: 'running' }),
    }))

    const node1 = screen.getByTestId('node-1')
    expect(node1.className).toContain('border-blue-500')

    // Rerender with completely new data schema (e.g. node-3)
    const newSchema = JSON.stringify({
      nodes: [
        { id: '3', data: { label: 'Node 3' }, position: { x: 0, y: 0 } },
      ],
      edges: [],
    })
    rerender(<ReactFlowWrapper data={newSchema} />)

    expect(screen.getByTestId('node-3')).toBeInTheDocument()
    expect(screen.queryByTestId('node-1')).not.toBeInTheDocument()

    // Dispatch status update for node-3 to ensure it still works
    fireEvent(window, new CustomEvent('node-status', {
      detail: JSON.stringify({ nodeId: '3', status: 'running' }),
    }))
    expect(screen.getByTestId('node-3').className).toContain('border-blue-500')
  })
})
