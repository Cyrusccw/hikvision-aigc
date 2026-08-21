'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import {
  Box,
  Clapperboard,
  FileText,
  Image as ImageIcon,
  Lightbulb,
  Play,
  Sparkles,
  Video,
} from 'lucide-react';

type WorkflowNodeData = {
  title: string;
  subtitle?: string;
  status?: 'idle' | 'ready' | 'generating' | 'approved';
  meta?: string[];
  description?: string;
  actionLabel?: string;
  duration?: string;
  selected?: boolean;
  shotIndex?: number;
  variantCount?: number;
};

type WorkflowNode = Node<WorkflowNodeData>;

const statusLabel: Record<NonNullable<WorkflowNodeData['status']>, string> = {
  idle: 'Not started',
  ready: 'Ready',
  generating: 'Generating',
  approved: 'Approved',
};

function Shell({
  icon,
  data,
  children,
  source = true,
  target = true,
  wide = false,
}: {
  icon: React.ReactNode;
  data: WorkflowNodeData;
  children?: React.ReactNode;
  source?: boolean;
  target?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`workflow-node ${wide ? 'workflow-node--wide' : ''}`}>
      {target && <Handle type="target" position={Position.Left} className="workflow-handle" />}
      <div className="workflow-node__header">
        <div className="workflow-node__icon">{icon}</div>
        <div className="workflow-node__heading">
          <strong>{data.title}</strong>
          {data.subtitle && <span>{data.subtitle}</span>}
        </div>
        {data.status && (
          <span className={`status-pill status-pill--${data.status}`}>{statusLabel[data.status]}</span>
        )}
      </div>
      {data.description && <p className="workflow-node__description">{data.description}</p>}
      {children}
      {data.meta && (
        <div className="workflow-node__meta">
          {data.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
      {data.actionLabel && (
        <button className="node-action nodrag" type="button">
          <Sparkles size={13} />
          {data.actionLabel}
        </button>
      )}
      {source && <Handle type="source" position={Position.Right} className="workflow-handle" />}
    </div>
  );
}

export function ProductNode({ data }: NodeProps<WorkflowNode>) {
  return (
    <Shell icon={<Box size={17} />} data={data} target={false}>
      <div className="product-preview">
        <div className="product-preview__image"><ImageIcon size={22} /></div>
        <div>
          <b>Product source</b>
          <span>URL · Images · Spec/PDF</span>
        </div>
      </div>
    </Shell>
  );
}

export function BriefNode({ data }: NodeProps<WorkflowNode>) {
  return (
    <Shell icon={<Lightbulb size={17} />} data={data} target={false}>
      <div className="brief-quote">“Create a 15s premium product film that shows reliable performance in a real business scene.”</div>
    </Shell>
  );
}

export function StoryboardNode({ data }: NodeProps<WorkflowNode>) {
  return (
    <Shell icon={<Clapperboard size={17} />} data={data} wide>
      <div className="storyboard-summary">
        <div><b>3</b><span>Shots</span></div>
        <div><b>15s</b><span>Total</span></div>
        <div><b>EN</b><span>Language</span></div>
      </div>
    </Shell>
  );
}

export function ShotNode({ data }: NodeProps<WorkflowNode>) {
  return (
    <Shell icon={<FileText size={17} />} data={data} wide>
      <div className="shot-grid">
        <div><span>Scene</span><b>{data.meta?.[0] ?? 'Office lobby'}</b></div>
        <div><span>Camera</span><b>{data.meta?.[1] ?? 'Slow dolly-in'}</b></div>
      </div>
      <div className="shot-pipeline">
        <div><ImageIcon size={14} /><span>Reference image</span><em>Generate</em></div>
        <div className="shot-pipeline__arrow">→</div>
        <div><Video size={14} /><span>Shot video</span><em>{data.variantCount ?? 0} variants</em></div>
      </div>
    </Shell>
  );
}

export function ImageNode({ data }: NodeProps<WorkflowNode>) {
  return (
    <Shell icon={<ImageIcon size={17} />} data={data}>
      <div className="media-placeholder media-placeholder--image">
        <ImageIcon size={26} />
        <span>Keyframe candidate</span>
      </div>
    </Shell>
  );
}

export function VideoNode({ data }: NodeProps<WorkflowNode>) {
  return (
    <Shell icon={<Video size={17} />} data={data}>
      <div className="media-placeholder media-placeholder--video">
        <Play size={24} />
        <span>{data.duration ?? '5s'} preview</span>
      </div>
    </Shell>
  );
}

export function FinalCutNode({ data }: NodeProps<WorkflowNode>) {
  return (
    <Shell icon={<Clapperboard size={17} />} data={data} source={false} wide>
      <div className="timeline-strip">
        <div>01 <span>5s</span></div>
        <div>02 <span>5s</span></div>
        <div>03 <span>5s</span></div>
      </div>
      <button className="node-action node-action--dark nodrag" type="button">
        <Play size={13} /> Merge selected shots
      </button>
    </Shell>
  );
}

export const workflowNodeTypes = {
  product: ProductNode,
  brief: BriefNode,
  storyboard: StoryboardNode,
  shot: ShotNode,
  image: ImageNode,
  video: VideoNode,
  finalCut: FinalCutNode,
};
