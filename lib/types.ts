export type ProductInput = {
  url?: string;
  images: string[];
  specText?: string;
  creativeIdea?: string;
  language: string;
};

export type ProductKnowledge = {
  name: string;
  category: string;
  keyFeatures: string[];
  userBenefits: string[];
  scenarios: string[];
  visualElements: string[];
  productConstraints: string[];
};

export type Shot = {
  id: string;
  title: string;
  duration: number;
  purpose: string;
  scene: string;
  action: string;
  camera: string;
  lighting: string;
  keyframePrompt: string;
  videoPrompt: string;
  referenceImageUrl?: string;
  videoUrl?: string;
  selected: boolean;
};

export type Storyboard = {
  title: string;
  totalDuration: number;
  language: string;
  shots: Shot[];
};
