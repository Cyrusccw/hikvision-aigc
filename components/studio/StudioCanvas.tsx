'use client';

import { useCallback, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  {
    id: 'product',
    position: { x: 80, y: 180 },
    data: { label: '1. Product Input\nURL / Images / Spec' },
  },
  {
    id: 'idea',
    position: { x: 80, y: 360 },
    data: { label: '2. Creative Idea\nDescribe the video you want' },
  },
  {
    id: 'storyboard',
    position: { x: 420, y: 260 },
    data: { label: '3. AI Storyboard\nGenerate independent shots' },
  },
  {
    id: 'shot1',
    position: { x: 760, y: 80 },
    data: { label: 'Shot 01\nReference Image → Video' },
  },
  {
    id: 'shot2',
    position: { x: 760, y: 260 },
    data: { label: 'Shot 02\nReference Image → Video' },
  },
  {
    id: 'shot3',
    position: { x: 760, y: 440 },
    data: { label: 'Shot 03\nReference Image → Video' },
  },
  {
    id: 'final',
    position: { x: 1120, y: 260 },
    data: { label: 'Final Cut\nSelect → Merge → Export' },
  },
];

const initialEdges: Edge[] = [
  { id: 'p-s', source: 'product', target: 'storyboard' },
  { id: 'i-s', source: 'idea', target: 'storyboard' },
  { id: 's-1', source: 'storyboard', target: 'shot1' },
  { id: 's-2', source: 'storyboard', target: 'shot2' },
  { id: 's-3', source: 'storyboard', target: 'shot3' },
  { id: '1-f', source: 'shot1', target: 'final' },
  { id: '2-f', source: 'shot2', target: 'final' },
  { id: '3-f', source: 'shot3', target: 'final' },
];

export default function StudioCanvas() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((current) => applyNodeChanges(changes, current)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((current) => applyEdgeChanges(changes, current)),
    [],
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge(connection, current)),
    [],
  );

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div>
          <strong>Hikvision AIGC Studio</strong>
          <span>Infinite Canvas · Product Video Workflow</span>
        </div>
        <button className="primary-button">New Project</button>
      </header>
      <section className="canvas-wrap">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background gap={28} size={1} />
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </section>
    </main>
  );
}
