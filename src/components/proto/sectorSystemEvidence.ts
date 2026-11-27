import { sectorWorkExamples, workScene } from '../../data/propuesta/workScenes';
import { pageCaseCandidates } from './caseSelection';
import type { Story } from './isoData';

export function sectorSystemEvidence(stories: Story[], sector: string, code: string) {
  const relevant = stories.filter(story => story.sectorSlug === sector && story.serviceCodes.includes(code));
  const example = sectorWorkExamples[sector]?.[code];
  if (example) {
    const matched = relevant.find(story => story.id === example.id);
    const caseScene = workScene(example, matched);
    return { story: caseScene ? matched : undefined, example, caseScene };
  }
  const candidates = pageCaseCandidates(relevant, sector, code);
  return { story: candidates.find(story => story.documentedScope) || candidates[0] };
}
