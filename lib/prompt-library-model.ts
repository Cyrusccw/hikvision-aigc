export type PromptCategory =
  | 'hero-shot'
  | 'installation'
  | 'night-scene'
  | 'retail'
  | 'warehouse'
  | 'feature-demo'
  | 'corporate';

export type PromptTemplate = {
  id: string;
  name: string;
  category: PromptCategory;
  style: string;
  camera: string;
  lighting: string;
  prompt: string;
  successCount: number;
  createdAt: string;
};

export type PromptContext = {
  productCategory?: string;
  feature?: string;
  scene?: string;
  style?: string;
};
