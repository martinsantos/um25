import { pageCaseCandidates, selectCaseProjects } from './caseSelection';
import { destacados, type Story } from './isoData';
import { CASOS_SERVICIO, casosDe } from './relato';

export function serviceCaseCollection(stories: Story[], code: string) {
  const own = stories.filter(story => story.serviceCodes.includes(code));
  const casos = casosDe(CASOS_SERVICIO[code] || []);
  const eligible = pageCaseCandidates(own, undefined, code);
  const rankedCases = destacados(eligible, eligible.length);
  const selectedCases = selectCaseProjects(casos, stories, rankedCases, code === '102' ? 2 : 4);
  return { own, casos, rankedCases, selectedCases };
}
