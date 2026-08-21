'use client';

import { useCallback, useMemo, useState } from 'react';
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
import { Plus, Save } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { workflowNodeTypes } from './WorkflowNodes';

const initialNodes: Node[] = [
  {
    id: 'product',
    type: 'product',
    position: { x: 80, y: 130 },
    data: {
      title: 'Product Input',
      subtitle: 'Product source & knowledge',
      status: 'ready',
      meta: ['URL connected', '2 images', 'Spec ready'],
      actionLabel: 'Analyze product',
    },
  },
  {
    id: 'brief',
    type: 'brief',
    position: { x: 80, y: 410 },
    data: {
      title: 'Creative Brief',
      subtitle: 'What should this video communicate?',
      status: 'ready',
      meta: ['15s', '16:9', 'English'],
      actionLabel: 'Refine with AI',
    },
  },
  {
    id: 'storyboard',
    type: 'storyboard',
    position: { x: 470, y: 255 },
    data: {
      title: 'AI Storyboard',
      subtitle: 'Creative structure generated from product + brief',
      status: 'approved',
      description: 'A premium 3-shot sequence moving from product hero to real usage and closing confidence.',
      actionLabel: 'Regenerate storyboard',
    },
  },
  {
    id: 'shot1',
    type: 'shot',
    position: { x: 880, y: 40 },
    data: {
      title: 'Shot 01 · Hero Reveal',
      subtitle: 'Establish the product',
      status: 'ready',
      meta: ['Modern office entrance', 'Slow dolly-in'],
      duration: '5s',
      variantCount: 2,
      actionLabel: 'Open shot workspace',
    },
  },
  {
    id: 'shot2',
    type: 'shot',
    position: { x: 880, y: 300 },
    data: {
      title: 'Shot 02 · Usage Moment',
      subtitle: 'Show product value in context',
      status: 'generating',
      meta: ['Backlit lobby', 'Tracking + push'],
      duration: '5s',
      variantCount: 1,
      actionLabel: 'Open shot workspace',
    },
  },
  {
    id: 'shot3',
    type: 'shot',
    position: { x: 880, y: 560 },
    data: {
      title: 'Shot 03 · Closing Confidence',
      subtitle: 'Resolve with a premium ending',
      status: 'idle',
      meta: ['Evening interior', 'Static hero frame'],
      duration: '5s',
      variantCount: 0,
      actionLabel: 'Open shot workspace',
    },
  },
  {
    id: 'image1',
    type: 'image',
    position: { x: 1270, y: 50 },
    data: {
      title: 'Keyframe · Shot 01',
      subtitle: 'Seedream candidate A',
      status: 'approved',
      meta: ['16:9', 'Reference locked'],
      actionLabel: 'Generate variations',
    },
  },
  {
    id: 'video1',
    type: 'video',
    position: { x: 1600, y: 50 },
    data: {
      title: 'Video · Shot 01',
      subtitle: 'Seedance variant B',
      status: 'approved',
      duration: '5s',
      meta: ['1080p', 'Selected'],
      actionLabel: 'Generate again',
    },
  },
  {
    id: 'image2',
    type: 'image',
    position: { x: 1270, y: 310 },
    data: {
      title: 'Keyframe · Shot 02',
      subtitle: 'Generating candidates',
      status: 'generating',
      meta: ['16:9', 'Product locked'],
      actionLabel: 'Generate variations',
    },
  },
  {
    id: 'video2',
    type: 'video',
    position: { x: 1600, y: 310 },
    data: {
      title: 'Video · Shot 02',
      subtitle: 'Waiting for keyframe approval',
      status: 'idle',
      duration: '5s',
      meta: ['No variant yet'],
      actionLabel: 'Generate video',
    },
  },
  {
    id: 'image3',
    type: 'image',
    position: { x: 1270, y: 570 },
    data: {
      title: 'Keyframe · Shot 03',
      subtitle: 'Not generated',
      status: 'idle',
      meta: ['16:9'],
      actionLabel: 'Generate keyframe',
    },
  },
  {
    id: 'video3',
    type: 'video',
    position: { x: 1600, y: 570 },
    data: {
      title: 'Video · Shot 03',
      subtitle: 'Not generated',
      status: 'idle',
      duration: '5s',
      meta: ['No variant yet'],
      actionLabel: 'Generate video',
    },
  },
  {
    id: 'final',
    type: 'finalCut',
    position: { x: 1970, y: 300 },
    data: {
      title: 'Final Cut',
      subtitle: 'Select approved shots, order and export',
      status: 'ready',
      meta: ['15s timeline', '3 shots'],
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'p-s', source: 'product', target: 'storyboard', animated: true },
  { id: 'b-s', source: 'brief', target: 'storyboard', animated: true },
  { id: 's-1', source: 'storyboard', target: 'shot1' },
  { id: 's-2', source: 'storyboard', target: 'shot2' },
  { id: 's-3', source: 'storyboard', target: 'shot3' },
  { id: '1-i', source: 'shot1', target: 'image1' },
  { id: 'i1-v1', source: 'image1', target: 'video1' },
  { id: '2-i', source: 'shot2', target: 'image2' },
  { id: 'i2-v2', source: 'image2', target: 'video2' },
  { id: '3-i', source: 'shot3', target: 'image3' },
  { id: 'i3-v3', source: 'image3', target: 'video3' },
  { id: 'v1-f', source: 'video1', target: 'final' },
  { id: 'v2-f', source: 'video2', target: 'final' },
  { id: 'v3-f', source: 'video3', target: 'final' },
];

export default function StudioCanvas() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>('storyboard');

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? null,
    [nodes, selectedId],
  );

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
        <div className="studio-brand">
          <strong>Hikvision AIGC Studio</strong>
          <span>Infinite Canvas · Product Video Workflow</span>
        </div>
        <div className="studio-actions">
          <button className="ghost-button" type="button"><Save size={15} /> Save</button>
          <button className="primary-button" type="button"><Plus size={15} /> New Project</button>
        </div>
      </header>

      <section className="studio-workspace">
        <aside className="tool-rail">
          <span className="tool-rail__label">ADD</span>
          <button type="button">Product</button>
          <button type="button">Brief</button>
          <button type="button">Shot</button>
          <button type="button">Image</button>
          <button type="button">Video</button>
          <button type="button">Text</button>
          <div className="tool-rail__divider" />
          <span className="tool-rail__label">PROJECT</span>
          <button type="button">Assets</button>
          <button type="button">Prompts</button>
          <button type="button">History</button>
        </aside>

        <section className="canvas-wrap">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={workflowNodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            minZoom={0.25}
            maxZoom={1.6}
          >
            <Background gap={24} size={1} />
            <MiniMap pannable zoomable />
            <Controls />
          </ReactFlow>
        </section>

        <aside className="inspector-panel">
          <div className="inspector-panel__header">
            <span>Inspector</span>
            <b>{selectedNode ? String(selectedNode.data.title ?? selectedNode.id) : 'Nothing selected'}</b>
          </div>
          {selectedNode ? (
            <div className="inspector-panel__body">
              <label>Node type</label>
              <div className="inspector-field">{selectedNode.type ?? 'default'}</div>
              <label>Status</label>
              <div className="inspector-field">{String(selectedNode.data.status ?? 'idle')}</div>
              <label>Prompt / direction</label>
              <textarea
                className="inspector-textarea"
                defaultValue={
                  selectedNode.type === 'shot'
                    ? 'Premium commercial scene. Keep exact product geometry and proportions. Natural motion, realistic materials, controlled lighting.'
                    : 'Select a shot to inspect and edit its creative direction.'
                }
              />
              <button className="primary-button inspector-button" type="button">Apply changes</button>
            </div>
          ) : (
            <div className="inspector-empty">Click a node to inspect its settings and generation prompt.</div>
          )}
        </aside>
      </section>
    </main>
  );
}
