
/**
 * Pluggable options provider interface. Start with a stub that marks feasibility unknown/OK,
 * then wire to a real provider (Polygon, Finnhub, Tradier, broker API) later.
 */

import { config } from '../config';

export type OptionSnapshot = {
  expiry: string;
  strike: number;
  mid: number;
  delta?: number;
  openInterest?: number;
  bid?: number;
  ask?: number;
  iv?: number;
};

export interface OptionsProvider {
  getChain(symbol: string, expiryMinMonths: number, expiryMaxMonths: number): Promise<OptionSnapshot[]>;
}

export class StubOptionsProvider implements OptionsProvider {
  async getChain(_symbol: string): Promise<OptionSnapshot[]> {
    return []; // Empty => downstream will skip strict checks gracefully.
  }
}

export function basicOptionsChecks(chain: OptionSnapshot[]) {
  const th = config.thresholds;
  if (!chain || chain.length === 0) {
    return { ivRank: undefined, oiOk: true, spreadOk: true, targetDeltaOk: true };
  }
  const target = chain.find((c) => (c.delta ?? 0.7) >= th.targetDeltaMin && (c.delta ?? 0.7) <= th.targetDeltaMax);
  const oiOk = (target?.openInterest ?? 1000) >= th.minOI;
  const spreadPct =
    target && target.bid && target.ask ? (target.ask - target.bid) / ((target.ask + target.bid) / 2) : 0.03;
  const spreadOk = spreadPct <= th.maxSpreadPct;
  const ivRank = undefined; // requires provider support
  const targetDeltaOk = !!target;
  return { ivRank, oiOk, spreadOk, targetDeltaOk };
}
