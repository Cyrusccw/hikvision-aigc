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
import { Plus, Save, WandSparkles } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { workflowNodeTypes } from './WorkflowNodes';
import type { ProductKnowledge, Shot, Storyboard } from '@/lib/types';

type StudioConfig = {
  productUrl: string;
  specText: string;
  imageNotes: string;
  creativeIdea: string;
  language: string;
  duration: number;
  aspectRatio: string;
};

const baseNodes: Node[] = [
  {
    id: 'product',
    type: 'product',
    position: { x: 80, y: 150 },
    data: {
      title: 'Product Input',
      subtitle: 'URL · Images · Spec',
      status: 'idle',
      meta: ['Awaiting product input'],
      actionLabel: 'Configure in inspector',
    },
  },
  {
    id: 'brief',
    type: 'brief',
    position: { x: 80, y: 430 },
    data: {
      title: 'Creative Brief',
      subtitle: 'Video idea & output settings',
      status: 'ready',
      meta: ['15s', '16:9', 'English'],
      actionLabel: 'Configure in inspector',
    },
  },
  {
    id: 'storyboard',
    type: 'storyboard',
    position: { x: 480, y: 285 },
    data: {
      title: 'AI Storyboard',
      subtitle: 'Product knowledge + creative brief',
      status: 'idle',
      description: 'Analyze the product first, then generate a storyboard.',
      actionLabel: 'Generate from inspector',
    },
  },
  {
    id: 'final',
    type: 'finalCut',
    position: { x: 1920, y: 285 },
    data: {
      title: 'Final Cut',
      subtitle: 'Approved shot videos will appear here',
      status: 'idle',
      meta: ['0 shots'],
    },
  },
];

const baseEdges: Edge[] = [
  { id: 'p-s', source: 'product', target: 'storyboard', animated: true },
  { id: 'b-s', source: 'brief', target: 'storyboard', animated: true },
];

const defaultConfig: StudioConfig = {
  productUrl: 'https://www.hikvision.com/en/products/IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2126g2-ims/',
  specText: '',
  imageNotes: '',
  creativeIdea: 'Create a premium 15-second product film. Start with a strong product hero moment, move into a realistic use scenario, and end with a confident product close.',
  language: 'English',
  duration: 15,
  aspectRatio: '16:9',
};

function buildStoryboardGraph(storyboard: Storyboard, aspectRatio: string) {
  const shotNodes: Node[] = [];
  const mediaNodes: Node[] = [];
  const graphEdges: Edge[] = [...baseEdges];
  const shots = storyboard.shots ?? [];
  const rowGap = 280;
  const startY = Math.max(30, 300 - ((shots.length - 1) * rowGap) / 2);

  shots.forEach((shot: Shot, index: number) => {
    const suffix = String(index + 1);
    const shotId = `shot-${shot.id || suffix}`;
    const imageId = `image-${shot.id || suffix}`;
    const videoId = `video-${shot.id || suffix}`;
    const y = startY + index * rowGap;

    shotNodes.push({
      id: shotId,
      type: 'shot',
      position: { x: 850, y },
      data: {
        title: `Shot ${String(index + 1).padStart(2, '0')} · ${shot.title}`,
        subtitle: shot.purpose,
        status: 'ready',
        meta: [shot.scene, shot.camera],
        duration: `${shot.duration}s`,
        variantCount: 0,
        actionLabel: 'Edit prompt in inspector',
        prompt: shot.keyframePrompt,
        videoPrompt: shot.videoPrompt,
        lighting: shot.lighting,
        action: shot.action,
      },
    });

    mediaNodes.push(
      {
        id: imageId,
        type: 'image',
        position: { x: 1250, y: y + 10 },
        data: {
          title: `Keyframe · Shot ${String(index + 1).padStart(2, '0')}`,
          subtitle: 'Seedream reference frame',
          status: 'idle',
          meta: [aspectRatio, 'Not generated'],
          actionLabel: 'Seedream integration next',
          prompt: shot.keyframePrompt,
        },
      },
      {
        id: videoId,
        type: 'video',
        position: { x: 1580, y: y + 10 },
        data: {
          title: `Video · Shot ${String(index + 1).padStart(2, '0')}`,
          subtitle: 'Seedance image-to-video',
          status: 'idle',
          duration: `${shot.duration}s`,
          meta: ['No variant yet'],
          actionLabel: 'Seedance integration next',
          prompt: shot.videoPrompt,
        },
      },
    );

    graphEdges.push(
      { id: `s-${shotId}`, source: 'storyboard', target: shotId },
      { id: `${shotId}-${imageId}`, source: shotId, target: imageId },
      { id: `${imageId}-${videoId}`, source: imageId, target: videoId },
      { id: `${videoId}-final`, source: videoId, target: 'final' },
    );
  });

  return { shotNodes, mediaNodes, graphEdges };
}

export default function StudioCanvas() {
  const [nodes, setNodes] = useState<Node[]>(baseNodes);
  const [edges, setEdges] = useState<Edge[]>(baseEdges);
  const [selectedId, setSelectedId] = useState<string | null>('product');
  const [config, setConfig] = useState<StudioConfig>(defaultConfig);
  const [productKnowledge, setProductKnowledge] = useState<ProductKnowledge | null>(null);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [busy, setBusy] = useState<'analyze' | 'storyboard' | null>(null);
  const [message, setMessage] = useState('Start by configuring Product Input.');

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

  const updateNode = useCallback((id: string, patch: Record<string, unknown>) => {
    setNodes((current) => current.map((node) => (
      node.id === id ? { ...node, data: { ...node.data, ...patch } } : node
    )));
  }, []);

  async function analyzeProduct() {
    setBusy('analyze');
    setMessage('Analyzing product facts and generation constraints...');
    updateNode('product', { status: 'generating', meta: ['Analyzing...'] });
    try {
      const response = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: config.productUrl,
          specText: config.specText,
          imageNotes: config.imageNotes,
          language: config.language,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Product analysis failed');
      setProductKnowledge(data);
      updateNode('product', {
        status: 'approved',
        title: data.name || 'Product Input',
        subtitle: data.category || 'Product knowledge ready',
        meta: [
          `${data.keyFeatures?.length ?? 0} features`,
          `${data.scenarios?.length ?? 0} scenarios`,
          'Knowledge ready',
        ],
      });
      updateNode('storyboard', { status: 'ready', description: 'Product knowledge is ready. Generate the storyboard from your creative brief.' });
      setMessage('Product analysis completed. Now generate the storyboard.');
      setSelectedId('storyboard');
    } catch (error) {
      updateNode('product', { status: 'ready', meta: ['Analysis failed', 'Check API settings'] });
      setMessage(error instanceof Error ? error.message : 'Product analysis failed');
    } finally {
      setBusy(null);
    }
  }

  async function generateStoryboard() {
    if (!productKnowledge) {
      setMessage('Please analyze the product before generating a storyboard.');
      setSelectedId('product');
      return;
    }
    setBusy('storyboard');
    setMessage('Directing storyboard and writing shot prompts...');
    updateNode('storyboard', { status: 'generating', description: 'Generating independently executable shots...' });
    try {
      const response = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productKnowledge,
          creativeIdea: config.creativeIdea,
          language: config.language,
          duration: config.duration,
          aspectRatio: config.aspectRatio,
        }),
      });
      const data: Storyboard & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || 'Storyboard generation failed');
      setStoryboard(data);
      const graph = buildStoryboardGraph(data, config.aspectRatio);
      setNodes((current) => {
        const fixed = current.filter((node) => ['product', 'brief', 'storyboard', 'final'].includes(node.id));
        return [
          ...fixed.map((node) => {
            if (node.id === 'storyboard') return {
              ...node,
              data: {
                ...node.data,
                status: 'approved',
                title: data.title || 'AI Storyboard',
                description: `${data.shots.length} independently generatable shots · ${data.totalDuration}s`,
                meta: [`${data.shots.length} shots`, `${data.totalDuration}s`, data.language],
              },
            };
            if (node.id === 'final') return {
              ...node,
              position: { x: 1940, y: 285 },
              data: {
                ...node.data,
                status: 'ready',
                meta: [`${data.totalDuration}s timeline`, `${data.shots.length} shots`],
              },
            };
            return node;
          }),
          ...graph.shotNodes,
          ...graph.mediaNodes,
        ];
      });
      setEdges(graph.graphEdges);
      updateNode('brief', { status: 'approved', meta: [`${config.duration}s`, config.aspectRatio, config.language] });
      setMessage(`Storyboard ready: ${data.shots.length} shots. Select any shot to inspect its prompts.`);
      setSelectedId(graph.shotNodes[0]?.id ?? 'storyboard');
    } catch (error) {
      updateNode('storyboard', { status: 'ready', description: 'Generation failed. Review the brief or API settings and try again.' });
      setMessage(error instanceof Error ? error.message : 'Storyboard generation failed');
    } finally {
      setBusy(null);
    }
  }

  function updateSelectedPrompt(value: string) {
    if (!selectedId) return;
    updateNode(selectedId, { prompt: value });
  }

  const promptValue = selectedNode ? String(selectedNode.data.prompt ?? selectedNode.data.videoPrompt ?? '') : '';

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div className="studio-brand">
          <strong>Hikvision AIGC Studio</strong>
          <span>Infinite Canvas · Product → Storyboard → Keyframe → Video → Final Cut</span>
        </div>
        <div className="studio-actions">
          <span className="studio-message">{message}</span>
          <button className="ghost-button" type="button"><Save size={15} /> Save</button>
          <button className="primary-button" type="button"><Plus size={15} /> New Project</button>
        </div>
      </header>

      <section className="studio-workspace">
        <aside className="tool-rail">
          <span className="tool-rail__label">WORKFLOW</span>
          <button type="button" onClick={() => setSelectedId('product')}>1 · Product</button>
          <button type="button" onClick={() => setSelectedId('brief')}>2 · Brief</button>
          <button type="button" onClick={() => setSelectedId('storyboard')}>3 · Storyboard</button>
          <button type="button" disabled>4 · Keyframes</button>
          <button type="button" disabled>5 · Videos</button>
          <button type="button" onClick={() => setSelectedId('final')}>6 · Final Cut</button>
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
            fitViewOptions={{ padding: 0.1 }}
            minZoom={0.2}
            maxZoom={1.7}
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

          {selectedNode?.id === 'product' && (
            <div className="inspector-panel__body">
              <label>Official product URL</label>
              <input className="inspector-input" value={config.productUrl} onChange={(event) => setConfig({ ...config, productUrl: event.target.value })} placeholder="https://www.hikvision.com/..." />
              <label>Spec / product copy</label>
              <textarea className="inspector-textarea inspector-textarea--compact" value={config.specText} onChange={(event) => setConfig({ ...config, specText: event.target.value })} placeholder="Paste key specifications or extracted PDF text here." />
              <label>Product image notes</label>
              <textarea className="inspector-textarea inspector-textarea--compact" value={config.imageNotes} onChange={(event) => setConfig({ ...config, imageNotes: event.target.value })} placeholder="Optional: describe reference images, installation angle, product appearance constraints..." />
              <button className="primary-button inspector-button" type="button" onClick={analyzeProduct} disabled={busy !== null}>
                <WandSparkles size={14} /> {busy === 'analyze' ? 'Analyzing...' : 'Analyze Product'}
              </button>
              {productKnowledge && (
                <div className="knowledge-card">
                  <b>{productKnowledge.name}</b>
                  <span>{productKnowledge.category}</span>
                  <p>{productKnowledge.keyFeatures.slice(0, 4).join(' · ')}</p>
                </div>
              )}
            </div>
          )}

          {selectedNode?.id === 'brief' && (
            <div className="inspector-panel__body">
              <label>Video creative idea</label>
              <textarea className="inspector-textarea" value={config.creativeIdea} onChange={(event) => setConfig({ ...config, creativeIdea: event.target.value })} />
              <label>Target language</label>
              <select className="inspector-input" value={config.language} onChange={(event) => setConfig({ ...config, language: event.target.value })}>
                {['English', 'Chinese', 'Spanish', 'French', 'Arabic', 'Indonesian', 'Thai', 'Vietnamese', 'Portuguese'].map((language) => <option key={language}>{language}</option>)}
              </select>
              <div className="inspector-two-col">
                <div><label>Duration</label><select className="inspector-input" value={config.duration} onChange={(event) => setConfig({ ...config, duration: Number(event.target.value) })}><option value={15}>15s</option><option value={30}>30s</option><option value={60}>60s</option></select></div>
                <div><label>Ratio</label><select className="inspector-input" value={config.aspectRatio} onChange={(event) => setConfig({ ...config, aspectRatio: event.target.value })}><option>16:9</option><option>9:16</option><option>1:1</option></select></div>
              </div>
              <button className="primary-button inspector-button" type="button" onClick={() => setSelectedId('storyboard')}>Continue to Storyboard</button>
            </div>
          )}

          {selectedNode?.id === 'storyboard' && (
            <div className="inspector-panel__body">
              <label>Product knowledge</label>
              <div className="inspector-field">{productKnowledge ? `${productKnowledge.name} · ${productKnowledge.keyFeatures.length} grounded features` : 'Not analyzed yet'}</div>
              <label>Creative brief</label>
              <div className="inspector-field inspector-field--multiline">{config.creativeIdea}</div>
              <button className="primary-button inspector-button" type="button" onClick={generateStoryboard} disabled={busy !== null || !productKnowledge}>
                <WandSparkles size={14} /> {busy === 'storyboard' ? 'Directing...' : storyboard ? 'Regenerate Storyboard' : 'Generate Storyboard'}
              </button>
            </div>
          )}

          {selectedNode && selectedNode.type === 'shot' && (
            <div className="inspector-panel__body">
              <label>Scene</label><div className="inspector-field">{String((selectedNode.data.meta as string[] | undefined)?.[0] ?? '')}</div>
              <label>Camera</label><div className="inspector-field">{String((selectedNode.data.meta as string[] | undefined)?.[1] ?? '')}</div>
              <label>Keyframe prompt</label>
              <textarea className="inspector-textarea" value={promptValue} onChange={(event) => updateSelectedPrompt(event.target.value)} />
              <label>Video prompt</label>
              <textarea className="inspector-textarea" value={String(selectedNode.data.videoPrompt ?? '')} onChange={(event) => updateNode(selectedNode.id, { videoPrompt: event.target.value })} />
              <button className="primary-button inspector-button" type="button" disabled>Generate Keyframe · Next step</button>
            </div>
          )}

          {selectedNode && ['image', 'video'].includes(selectedNode.type ?? '') && (
            <div className="inspector-panel__body">
              <label>Generation prompt</label>
              <textarea className="inspector-textarea" value={promptValue} onChange={(event) => updateSelectedPrompt(event.target.value)} />
              <div className="inspector-field">Model adapter is reserved. Seedream / Seedance connection will be implemented next.</div>
            </div>
          )}

          {selectedNode?.id === 'final' && (
            <div className="inspector-panel__body">
              <label>Timeline status</label>
              <div className="inspector-field">{storyboard ? `${storyboard.shots.length} shot slots · ${storyboard.totalDuration}s` : 'Generate storyboard first'}</div>
              <div className="inspector-field inspector-field--multiline">Final render will accept only user-approved video variants. Ordering, trim and merge are the next production phase.</div>
            </div>
          )}

          {!selectedNode && <div className="inspector-empty">Click a workflow node to edit its settings.</div>}
        </aside>
      </section>
    </main>
  );
}
