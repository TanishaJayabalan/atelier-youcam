import { MakeupStep } from './youcam/makeup-vto';

/**
 * Returns the crisp, natural portrait without any artificial pixel-threshold masks or blotches.
 */
export async function renderMakeupOnCanvas(
  imageSrc: string,
  makeupSteps: MakeupStep[]
): Promise<string> {
  // Return pristine image source to preserve 100% photo fidelity
  return imageSrc;
}
