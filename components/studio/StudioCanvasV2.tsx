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

type Config = {
  productUrl: string;
  specText: string;
  imageNotes: string;
  creativeIdea: string;
  language: string;
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
};

type Busy = 'analyze' | 'storyboard' | 'keyframe' | null;

const configDefault: Config = {
  productUrl: 'https://www.hikvision.com/en/products/IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2126g2-ims/',
  specText: '',
  imageNotes: '',
  creativeIdea: 'Create a premium product film that opens with a strong product hero moment, demonstrates value in a realistic use scene, and ends with confident product presence.',
  language: 'English',
  duration: 15,
  aspectRatio: '16:9',
};

const fixedNodes: Node[] = [
  { id: 'product', type: 'product', position: { x: 80, y: 140 }, data: { title: 'Product Input', subtitle: 'URL · Images · Spec', status: 'idle', meta: ['Awaiting input'], actionLabel: 'Configure in inspector' } },
  { id: 'brief', type: 'brief', position: { x: 80, y: 430 }, data: { title: 'Creative Brief', subtitle: 'Idea · Language · Format', status: 'ready', meta: ['15s', '16:9', 'English'], briefText: configDefault.creativeIdea, actionLabel: 'Configure in inspector' } },
  { id: 'storyboard', type: 'storyboard', position: { x: 470, y: 285 }, data: { title: 'AI Storyboard', subtitle: 'Product knowledge + creative brief', status: 'idle', description: 'Analyze product first, then generate a storyboard.', actionLabel: 'Generate in inspector', shotCount: 0, totalDuration: 0, language: '—' } },
  { id: 'final', type: 'finalCut', position: { x: 1940, y: 285 }, data: { title: 'Final Cut', subtitle: 'Select approved shot videos', status: 'idle', timeline: [] } },
];

const fixedEdges: Edge[] = [
  { id: 'product-storyboard', source: 'product', target: 'storyboard', animated: true },
  { id: 'brief-storyboard', source: 'brief', target: 'storyboard', animated: true },
];

function graphFromStoryboard(storyboard: Storyboard, ratio: Config['aspectRatio']) {
  const nodes: Node[] = [];
  const edges: Edge[] = [...fixedEdges];
  const gap = 280;
  const top = Math.max(30, 300 - ((storyboard.shots.length - 1) * gap) / 2);

  storyboard.shots.forEach((shot: Shot, index) => {
    const key = shot.id || String(index + 1);
    const shotId = `shot-${key}`;
    const imageId = `image-${key}`;
    const videoId = `video-${key}`;
    const y = top + index * gap;
    nodes.push(
      {
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
          prompt: shot.keyframePrompt,
          videoPrompt: shot.videoPrompt,
          imageNodeId: imageId,
          videoNodeId: videoId,
          actionLabel: 'Generate keyframe in inspector',
        },
      },
      {
        id: imageId,
        type: 'image',
        position: { x: 1240, y: y + 10 },
        data: {
          title: `Keyframe · Shot ${String(index + 1).padStart(2, '0')}`,
          subtitle: 'Seedream reference frame',
          status: 'idle',
          meta: [ratio, 'Not generated'],
          prompt: shot.keyframePrompt,
          parentShotId: shotId,
          videoNodeId: videoId,
          actionLabel: 'Generate / regenerate in inspector',
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
          meta: ['Waiting for keyframe'],
          prompt: shot.videoPrompt,
          parentShotId: shotId,
          imageNodeId: imageId,
          actionLabel: 'Seedance integration next',
        },
      },
    );
    edges.push(
      { id: `storyboard-${shotId}`, source: 'storyboard', target: shotId },
      { id: `${shotId}-${imageId}`, source: shotId, target: imageId },
      { id: `${imageId}-${videoId}`, source: imageId, target: videoId },
      { id: `${videoId}-final`, source: videoId, target: 'final' },
    );
  });
  return { nodes, edges };
}

export default function StudioCanvasV2() {
  const [nodes, setNodes] = useState<Node[]>(fixedNodes);
  const [edges, setEdges] = useState<Edge[]>(fixedEdges);
  const [selectedId, setSelectedId] = useState<string | null>('product');
  const [config, setConfig] = useState<Config>(configDefault);
  const [knowledge, setKnowledge] = useState<ProductKnowledge | null>(null);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState('Start with Product Input.');

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) ?? null, [nodes, selectedId]);
  const updateNode = useCallback((id: string, data: Record<string, unknown>) => {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, ...data } } : node));
  }, []);
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((n) => applyNodeChanges(changes, n)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((e) => applyEdgeChanges(changes, e)), []);
  const onConnect = useCallback((connection: Connection) => setEdges((e) => addEdge(connection, e)), []);

  const applyBrief = () => {
    updateNode('brief', { briefText: config.creativeIdea, meta: [`${config.duration}s`, config.aspectRatio, config.language], status: 'approved' });
    setSelectedId('storyboard');
  };

  async function analyze() {
    setBusy('analyze'); setMessage('Analyzing product facts...');
    updateNode('product', { status: 'generating', meta: ['Analyzing...'] });
    try {
      const response = await fetch('/api/analyze-product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: config.productUrl, specText: config.specText, imageNotes: config.imageNotes, language: config.language }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Product analysis failed');
      setKnowledge(data);
      updateNode('product', { title: data.name || 'Product', subtitle: data.category || 'Knowledge ready', status: 'approved', meta: [`${data.keyFeatures?.length ?? 0} features`, `${data.scenarios?.length ?? 0} scenarios`, data.sourceMeta?.urlRead ? 'URL read' : 'Manual source'] });
      updateNode('storyboard', { status: 'ready', description: 'Product knowledge is grounded and ready for creative direction.' });
      setSelectedId('brief'); setMessage('Product ready. Add your creative idea.');
    } catch (error) {
      updateNode('product', { status: 'ready', meta: ['Analysis failed'] });
      setMessage(error instanceof Error ? error.message : 'Product analysis failed');
    } finally { setBusy(null); }
  }

  async function directStoryboard() {
    if (!knowledge) { setSelectedId('product'); setMessage('Analyze the product first.'); return; }
    applyBrief(); setBusy('storyboard'); setMessage('Directing storyboard...');
    updateNode('storyboard', { status: 'generating', description: 'Writing independent keyframe and video prompts...' });
    try {
      const response = await fetch('/api/storyboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productKnowledge: knowledge, creativeIdea: config.creativeIdea, language: config.language, duration: config.duration, aspectRatio: config.aspectRatio }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Storyboard generation failed');
      const sb = data as Storyboard;
      setStoryboard(sb);
      const graph = graphFromStoryboard(sb, config.aspectRatio);
      const timeline = sb.shots.map((shot, index) => ({ label: String(index + 1).padStart(2, '0'), duration: shot.duration }));
      setNodes((current) => {
        const kept = current.filter((node) => ['product', 'brief', 'storyboard', 'final'].includes(node.id));
        return [...kept.map((node) => {
          if (node.id === 'storyboard') return { ...node, data: { ...node.data, title: sb.title, status: 'approved', description: `${sb.shots.length} independent shots ready for keyframe generation.`, shotCount: sb.shots.length, totalDuration: sb.totalDuration, language: sb.language, meta: [] } };
          if (node.id === 'final') return { ...node, data: { ...node.data, status: 'ready', timeline, meta: [`${sb.totalDuration}s`, `${sb.shots.length} shot slots`] } };
          return node;
        }), ...graph.nodes];
      });
      setEdges(graph.edges); setSelectedId(graph.nodes.find((n) => n.type === 'shot')?.id ?? 'storyboard');
      setMessage(`Storyboard ready: ${sb.shots.length} shots. Generate a keyframe for each shot.`);
    } catch (error) {
      updateNode('storyboard', { status: 'ready', description: 'Generation failed. Review inputs and try again.' });
      setMessage(error instanceof Error ? error.message : 'Storyboard generation failed');
    } finally { setBusy(null); }
  }

  async function generateKeyframe() {
    if (!selected || !['shot', 'image'].includes(selected.type ?? '')) return;
    const imageId = selected.type === 'image' ? selected.id : String(selected.data.imageNodeId ?? '');
    const imageNode = nodes.find((n) => n.id === imageId);
    const prompt = String(selected.data.prompt ?? imageNode?.data.prompt ?? '');
    if (!imageId || !prompt) { setMessage('No keyframe prompt found for this shot.'); return; }
    setBusy('keyframe'); setMessage('Generating keyframe...'); updateNode(imageId, { status: 'generating', meta: [config.aspectRatio, 'Generating...'] });
    try {
      const response = await fetch('/api/generate-keyframe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, aspectRatio: config.aspectRatio, productConstraints: knowledge?.productConstraints ?? [], referenceImages: [] }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Keyframe generation failed');
      const result = data.images?.[0];
      if (!result?.url) throw new Error('No keyframe returned');
      updateNode(imageId, { status: 'approved', imageUrl: result.url, meta: [config.aspectRatio, result.provider === 'mock' ? 'Preview mode' : 'Generated'], provider: result.provider });
      const videoId = String((imageNode?.data.videoNodeId ?? selected.data.videoNodeId) || '');
      if (videoId) updateNode(videoId, { status: 'ready', meta: ['Keyframe ready', 'Video not generated'] });
      if (selected.type === 'shot') updateNode(selected.id, { status: 'approved' });
      setSelectedId(imageId); setMessage(result.provider === 'mock' ? 'Keyframe workflow works. Configure Seedream API for real image generation.' : 'Keyframe generated. Ready for Seedance.');
    } catch (error) {
      updateNode(imageId, { status: 'ready', meta: [config.aspectRatio, 'Generation failed'] });
      setMessage(error instanceof Error ? error.message : 'Keyframe generation failed');
    } finally { setBusy(null); }
  }

  const prompt = selected ? String(selected.data.prompt ?? '') : '';
  const setPrompt = (value: string) => selected && updateNode(selected.id, { prompt: value });

  return (
    <main className="studio-shell">
      <header className="studio-topbar">
        <div className="studio-brand"><strong>Hikvision AIGC Studio</strong><span>Product → Storyboard → Keyframe → Video → Final Cut</span></div>
        <div className="studio-actions"><span className="studio-message">{message}</span><button className="ghost-button"><Save size={15}/> Save</button><button className="primary-button"><Plus size={15}/> New Project</button></div>
      </header>
      <section className="studio-workspace">
        <aside className="tool-rail">
          <span className="tool-rail__label">WORKFLOW</span>
          {['product','brief','storyboard','final'].map((id, index) => <button key={id} onClick={() => setSelectedId(id)}>{index + 1} · {id === 'final' ? 'Final Cut' : id[0].toUpperCase() + id.slice(1)}</button>)}
          <div className="tool-rail__divider"/><span className="tool-rail__label">PROJECT</span><button>Assets</button><button>Prompts</button><button>History</button>
        </aside>
        <section className="canvas-wrap">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={workflowNodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_, node) => setSelectedId(node.id)} onPaneClick={() => setSelectedId(null)} fitView fitViewOptions={{ padding: .1 }} minZoom={.2} maxZoom={1.7}>
            <Background gap={24} size={1}/><MiniMap pannable zoomable/><Controls/>
          </ReactFlow>
        </section>
        <aside className="inspector-panel">
          <div className="inspector-panel__header"><span>Inspector</span><b>{selected ? String(selected.data.title ?? selected.id) : 'Nothing selected'}</b></div>
          {selected?.id === 'product' && <div className="inspector-panel__body">
            <label>Official product URL</label><input className="inspector-input" value={config.productUrl} onChange={(e) => setConfig({...config, productUrl:e.target.value})}/>
            <label>Spec / product copy</label><textarea className="inspector-textarea inspector-textarea--compact" value={config.specText} onChange={(e) => setConfig({...config, specText:e.target.value})}/>
            <label>Product image notes</label><textarea className="inspector-textarea inspector-textarea--compact" value={config.imageNotes} onChange={(e) => setConfig({...config, imageNotes:e.target.value})}/>
            <button className="primary-button inspector-button" disabled={busy !== null} onClick={analyze}><WandSparkles size={14}/>{busy === 'analyze' ? 'Analyzing...' : 'Analyze Product'}</button>
            {knowledge && <div className="knowledge-card"><b>{knowledge.name}</b><span>{knowledge.category}</span><p>{knowledge.keyFeatures.slice(0,4).join(' · ')}</p></div>}
          </div>}
          {selected?.id === 'brief' && <div className="inspector-panel__body">
            <label>Video creative idea</label><textarea className="inspector-textarea" value={config.creativeIdea} onChange={(e) => setConfig({...config, creativeIdea:e.target.value})}/>
            <label>Target language</label><select className="inspector-input" value={config.language} onChange={(e) => setConfig({...config, language:e.target.value})}>{['English','Chinese','Spanish','French','Arabic','Indonesian','Thai','Vietnamese','Portuguese'].map((x)=><option key={x}>{x}</option>)}</select>
            <div className="inspector-two-col"><div><label>Duration</label><select className="inspector-input" value={config.duration} onChange={(e)=>setConfig({...config,duration:Number(e.target.value)})}><option value={15}>15s</option><option value={30}>30s</option><option value={60}>60s</option></select></div><div><label>Ratio</label><select className="inspector-input" value={config.aspectRatio} onChange={(e)=>setConfig({...config,aspectRatio:e.target.value as Config['aspectRatio']})}><option>16:9</option><option>9:16</option><option>1:1</option></select></div></div>
            <button className="primary-button inspector-button" onClick={applyBrief}>Continue to Storyboard</button>
          </div>}
          {selected?.id === 'storyboard' && <div className="inspector-panel__body">
            <label>Product knowledge</label><div className="inspector-field">{knowledge ? `${knowledge.name} · ${knowledge.keyFeatures.length} grounded features` : 'Not analyzed yet'}</div>
            <label>Creative brief</label><div className="inspector-field inspector-field--multiline">{config.creativeIdea}</div>
            <button className="primary-button inspector-button" disabled={busy !== null || !knowledge} onClick={directStoryboard}><WandSparkles size={14}/>{busy === 'storyboard' ? 'Directing...' : storyboard ? 'Regenerate Storyboard' : 'Generate Storyboard'}</button>
          </div>}
          {selected?.type === 'shot' && <div className="inspector-panel__body">
            <label>Scene</label><div className="inspector-field">{String((selected.data.meta as string[] | undefined)?.[0] ?? '')}</div><label>Camera</label><div className="inspector-field">{String((selected.data.meta as string[] | undefined)?.[1] ?? '')}</div>
            <label>Keyframe prompt</label><textarea className="inspector-textarea" value={prompt} onChange={(e)=>setPrompt(e.target.value)}/><label>Video prompt</label><textarea className="inspector-textarea" value={String(selected.data.videoPrompt ?? '')} onChange={(e)=>updateNode(selected.id,{videoPrompt:e.target.value})}/>
            <button className="primary-button inspector-button" disabled={busy !== null} onClick={generateKeyframe}><WandSparkles size={14}/>{busy === 'keyframe' ? 'Generating...' : 'Generate Keyframe'}</button>
          </div>}
          {selected?.type === 'image' && <div className="inspector-panel__body"><label>Keyframe prompt</label><textarea className="inspector-textarea" value={prompt} onChange={(e)=>setPrompt(e.target.value)}/><button className="primary-button inspector-button" disabled={busy !== null} onClick={generateKeyframe}><WandSparkles size={14}/>{busy === 'keyframe' ? 'Generating...' : 'Generate Variation'}</button><div className="inspector-field">{selected.data.provider === 'mock' ? 'Preview mode: add Seedream API credentials for real generation.' : 'Approved keyframe becomes the visual anchor for Seedance.'}</div></div>}
          {selected?.type === 'video' && <div className="inspector-panel__body"><label>Video prompt</label><textarea className="inspector-textarea" value={prompt} onChange={(e)=>setPrompt(e.target.value)}/><div className="inspector-field">Seedance image-to-video adapter is the next integration.</div></div>}
          {selected?.id === 'final' && <div className="inspector-panel__body"><label>Timeline</label><div className="inspector-field">{storyboard ? `${storyboard.shots.length} shot slots · ${storyboard.totalDuration}s` : 'Generate storyboard first'}</div><div className="inspector-field inspector-field--multiline">Only approved video variants will be selectable for the final render.</div></div>}
          {!selected && <div className="inspector-empty">Click a node to edit its settings.</div>}
        </aside>
      </section>
    </main>
  );
}
