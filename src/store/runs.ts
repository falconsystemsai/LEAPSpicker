
import { getJSON, putJSON } from './kvCache';

const LAST_RUN_KEY = 'runs:last';

export async function saveRun(env: any, data: any) {
  await putJSON(env.leapspicker, LAST_RUN_KEY, data, 7 * 24 * 60 * 60);
}

export async function loadLastRun(env: any) {
  const val = await getJSON(env.leapspicker, LAST_RUN_KEY);
  return val ?? { ts: null, results: [] };
}
