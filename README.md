# Hikvision AIGC Studio

Internal infinite-canvas AIGC platform for product video creation.

## Target workflow

1. Product input: product images, spec text/PDF-derived text, official product URL.
2. Product understanding: extract factual product knowledge and generation constraints.
3. Creative brief: user enters a video idea, target language, duration and format.
4. AI storyboard: generate independent shots with purpose, scene, action, camera, lighting and prompts.
5. Keyframe generation: each shot can independently create one or more reference images.
6. Shot video generation: approved reference image becomes the visual anchor for image-to-video generation.
7. Shot selection: users can regenerate, compare and select approved shot variants.
8. Final cut: selected shots are ordered, merged, then exported as one video.

## Product principles

- Infinite canvas first, inspired by node-based creative workspaces.
- AI should do the first 80%; designers retain control over every shot.
- Product facts and creative interpretation are separated.
- Each shot is an independent unit: reference image, prompt, video variants and approval state.
- Prompt library and generation history should reduce repeated trial-and-error.
- Model adapters remain replaceable: DeepSeek for reasoning, Seedream-class image models for keyframes, Seedance-class models for video.

## V1 architecture

- Next.js + TypeScript
- Vercel deployment
- XYFlow infinite canvas
- DeepSeek product/storyboard APIs
- Seedream adapter (next)
- Seedance adapter (next)
- Postgres/Neon persistence (next)
- Blob/object storage for media (next)
- FFmpeg-based final composition via asynchronous render worker/service (planned)

## Current branch

`feat/infinite-canvas-v1`

This branch establishes the Vercel-first scaffold, domain model and first infinite-canvas prototype.
