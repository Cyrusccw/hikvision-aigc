export type GenerationStatus =
  | 'draft'
  | 'analyzing'
  | 'ready'
  | 'generating'
  | 'approved'
  | 'failed';

export type MediaVariant = {
  id: string;
  url?: string;
  prompt: string;
  provider?: string;
  selected: boolean;
  createdAt: string;
};

export type CreativeShot = {
  id: string;
  order: number;
  title: string;
  duration: number;
  purpose: string;

  scene: string;
  action: string;
  camera: string;
  lighting: string;

  imagePrompt: string;
  videoPrompt: string;

  keyframes: MediaVariant[];
  videos: MediaVariant[];

  selectedKeyframeId?: string;
  selectedVideoId?: string;
  status: GenerationStatus;
};

export type CreativeProject = {
  id: string;
  name: string;
  language: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  duration: number;

  productId?: string;
  productKnowledge?: unknown;
  creativeBrief?: string;

  shots: CreativeShot[];

  status: GenerationStatus;
  createdAt: string;
  updatedAt: string;
};
