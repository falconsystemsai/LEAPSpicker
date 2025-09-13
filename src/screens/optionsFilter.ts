
import { basicOptionsChecks, StubOptionsProvider } from '../providers/optionsProvider';
import { scoreCandidate } from '../metrics/scoring';

export async function optionsFeasibility(env: any, equityResults: any[]) {
  const provider = new StubOptionsProvider();
  const out: any[] = [];
  for (const r of equityResults) {
    try {
      // In stub mode we don't actually fetch a chain; integrate real provider later.
      const checks = basicOptionsChecks([]);
      const score = scoreCandidate(r.metrics, checks);
      out.push({ ...r, score, options: checks });
    } catch (e) {
      console.log('optionsFilter error:', (e as Error).message);
      out.push({ ...r, options: { ivRank: undefined, oiOk: true, spreadOk: true, targetDeltaOk: true } });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
