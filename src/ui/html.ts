export function renderHTML(data: any) {
  const results = (data?.results ?? []) as any[];

  const rows = results
    .map((r) => {
      const m = r.metrics ?? {};
      const score = Number.isFinite(r.score) ? r.score : 0;

      return `
      <tr>
        <td class="sym">
          <div class="symbox">
            <div class="ticker">${escapeHTML(r.symbol ?? "—")}</div>
            <div class="sub">$${fmt(m.price)}</div>
          </div>
        </td>
        <td class="score">
          <div class="bar" style="--val:${clamp(score, 0, 100)}">
            <span>${clamp(score, 0, 100)}</span>
          </div>
        </td>
        <td>${num(m.rsi14, 1)} ${badgeRSI(m.rsi14)}</td>
        <td>${pct(m.hv60)} ${badgeHV(m.hv60)}</td>
        <td>${pct(m.mdd1y)} ${badgeMDD(m.mdd1y)}</td>
        <td>${r?.options?.ivRank ?? "—"}</td>
        <td>${r.pass ? badge("PASS", "ok") : badge("WATCH", "warn")}</td>
        <td class="rationale">${r.rationale ? escapeHTML(r.rationale) : badge('rationale pending…', 'warn')}</td>
      </tr>`;
    })
    .join("\n");

  return `<!doctype html>
<html data-theme="light">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>LEAPS Picks</title>
  <style>
    :root{
      --bg:#0b1020; --bg2:#0e1430; --card:#121933; --ink:#e8ecff; --sub:#a7b0d8;
      --ok:#16a34a; --warn:#f59f00; --bad:#ef4444; --acc:#7c3aed; --line:#1f2a4a; --muted:#94a3b8;
      --thead:#0e1430; --table:#0c1226;
    }
    [data-theme="light"]{
      --bg:#f6f7fb; --bg2:#ffffff; --card:#ffffff; --ink:#0f172a; --sub:#5b647f;
      --ok:#16a34a; --warn:#b45309; --bad:#dc2626; --acc:#4f46e5; --line:#e5e7eb; --muted:#6b7280;
      --thead:#f3f4f6; --table:#ffffff;
    }
    *{box-sizing:border-box}
    body{margin:0;background:radial-gradient(60% 100% at 50% 0%,var(--bg2),var(--bg));color:var(--ink);font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Helvetica,Arial}
    .wrap{max-width:1200px;margin:32px auto;padding:0 20px}
    .hero{
      display:flex;align-items:center;justify-content:space-between;
      border:1px solid var(--line);border-radius:16px;padding:18px 20px;
      background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(0,0,0,0));
      backdrop-filter: blur(6px);box-shadow:0 10px 30px rgba(0,0,0,.08)
    }
    .title{font-size:22px;font-weight:800;letter-spacing:.2px}
    .subtitle{color:var(--sub);font-size:12px;margin-top:6px}
    .controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .pill{border:1px solid var(--line);background:var(--card);color:var(--ink);padding:8px 10px;border-radius:999px}
    .pill input{all:unset;width:200px}
    .btn{cursor:pointer;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:8px 12px;border-radius:10px;transition:.2s transform}
    .btn:hover{border-color:var(--acc);transform:translateY(-1px)}
    .btn.primary{background:linear-gradient(135deg,var(--acc),#22c55e);color:white;border:none}
    .meta{display:flex;gap:16px;align-items:center;margin-top:10px;color:var(--muted);font-size:12px}

    table{width:100%;border-collapse:separate;border-spacing:0;background:var(--table);border:1px solid var(--line);border-radius:14px;overflow:hidden;margin-top:18px}
    thead th{
      position:sticky;top:0;background:var(--thead);text-align:left;font-weight:700;
      font-size:12px;color:var(--muted);letter-spacing:.3px;padding:10px;border-bottom:1px solid var(--line);cursor:pointer
    }
    tbody td{padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:top}
    tbody tr{transition:transform .08s ease, background .15s}
    tbody tr:hover{background:rgba(124,58,237,.06);transform:scale(1.003)}
    .sym .symbox{display:flex;flex-direction:column;gap:2px}
    .ticker{font-weight:800;font-size:14px;letter-spacing:.3px}
    .sub{color:var(--sub);font-size:12px}
    .score .bar{--val:0; height:20px;border-radius:8px;position:relative;background:rgba(124,58,237,.15);outline:1px solid rgba(124,58,237,.2);overflow:hidden}
    .score .bar::before{content:"";position:absolute;inset:0;width:calc(var(--val)*1%);background:linear-gradient(90deg,var(--acc),#22c55e);border-radius:8px;box-shadow:0 0 12px rgba(79,70,229,.35);transition:width .3s}
    .score .bar span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-weight:800;text-shadow:0 1px 0 rgba(0,0,0,.18)}
    .badge{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:999px;font-size:11px;border:1px solid transparent;white-space:nowrap}
    .b-ok{background:rgba(34,197,94,.16);color:var(--ok);border-color:rgba(34,197,94,.25)}
    .b-warn{background:rgba(245,158,11,.16);color:var(--warn);border-color:rgba(245,158,11,.25)}
    .b-bad{background:rgba(239,68,68,.16);color:var(--bad);border-color:rgba(239,68,68,.25)}
    .rationale{max-width:520px}
    .footer{margin:16px 0;color:var(--muted);font-size:12px}
    .hidden{display:none}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <div>
        <div class="title">LEAPS Candidates</div>
        <div class="subtitle">Last run: ${data?.ts ?? "—"} • Click headers to sort • Search to filter</div>
      </div>
      <div class="controls">
        <label class="pill">🔎 <input id="q" placeholder="Filter symbols & text…" /></label>
        <button id="refresh" class="btn primary" title="Run refresh now">⚡ Run</button>
        <button id="copycsv" class="btn" title="Copy CSV">📄 CSV</button>
        <button id="copyjson" class="btn" title="Copy JSON">🧾 JSON</button>
        <button id="toggle" class="btn" title="Toggle light/dark">🌓 Theme</button>
      </div>
    </div>

    <table id="t">
      <thead>
        <tr>
          <th data-k="symbol">Symbol</th>
          <th data-k="score" data-n>Score</th>
          <th data-k="rsi" data-n>RSI(14)</th>
          <th data-k="hv" data-n>HV60</th>
          <th data-k="mdd" data-n>MDD(1y)</th>
          <th data-k="ivr" data-n>IV Rank</th>
          <th data-k="pass">Status</th>
          <th data-k="rationale">Rationale</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="8" class="sub" style="padding:16px">No results yet. Hit <b>⚡ Run</b> or call <code>/run?all=1</code>.</td></tr>`}
      </tbody>
    </table>

    <div class="meta">
      <span>Rows: <b id="rc">${results.length}</b></span>
      <span>Theme: <b id="th">light</b></span>
    </div>
    <div class="footer">Pro tip: tweak your universe and thresholds in <code>src/config.ts</code>.</div>
  </div>

<script>
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$= (s, r=document) => Array.from(r.querySelectorAll(s));
  const table = $('#t');
  const tbody = table.querySelector('tbody');
  const rows = $$('tbody tr', table);
  const rc = $('#rc');
  const th = $('#th');
  const q = $('#q');
  const toggle = $('#toggle');
  const refresh = $('#refresh');
  const copycsv = $('#copycsv');
  const copyjson = $('#copyjson');

  // Click-to-sort
  let sortKey = 'score', sortDir = -1;
  $$('thead th', table).forEach(thEl => {
    thEl.addEventListener('click', () => {
      const k = thEl.dataset.k;
      const numeric = 'n' in thEl.dataset;
      if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = (k === 'symbol' || k === 'rationale') ? 1 : -1; }
      const idx = Array.from(thEl.parentNode.children).indexOf(thEl);
      const getv = (tr) => {
        const td = tr.children[idx];
        if (!numeric) return td.textContent.trim().toUpperCase();
        const num = td.textContent.replace(/[^-0-9.]/g,'');
        return parseFloat(num || '0');
      };
      const copy = Array.from(tbody.children);
      copy.sort((a,b)=> (getv(a) > getv(b) ? 1 : -1) * sortDir);
      copy.forEach(r=>tbody.appendChild(r));
    });
  });

  // Filter
  q.addEventListener('input', () => {
    const term = q.value.trim().toUpperCase();
    let visible = 0;
    rows.forEach(row => {
      const txt = row.textContent.toUpperCase();
      const show = !term || txt.includes(term);
      row.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    rc.textContent = String(visible);
  });

  // Theme toggle (persist in sessionStorage)
  const root = document.documentElement;
  const saved = sessionStorage.getItem('theme');
  if (saved) root.setAttribute('data-theme', saved), th.textContent = saved;
  toggle.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', cur);
    sessionStorage.setItem('theme', cur);
    th.textContent = cur;
  });

  // Run refresh (opens /run in a new tab to avoid blocking UI)
  refresh.addEventListener('click', () => {
    window.open('/run?all=1', '_blank');
  });

  // Copy CSV / JSON
  const toCSV = () => {
    const hdr = ['symbol','score','price','rsi14','hv60','mdd1y','ivRank','status','rationale'];
    const lines = [hdr.join(',')];
    Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td =>
        td.innerText.replace(/\\s+/g, ' ').trim()
      );
      if (!cells.length) return;
      const symCell = cells[0] || '';
      const score = cells[1] || '';
      const rsi = cells[2] || '';
      const hv = cells[3] || '';
      const mdd = cells[4] || '';
      const ivr = cells[5] || '';
      const status = cells[6] || '';
      const rationale = cells[7] || '';
      const priceMatch = symCell.match(/\\$(\\d[\\d.,]*)/);
      const symbol = symCell.split('\\n')[0].trim().split(' ')[0];
      const price = priceMatch ? priceMatch[1] : '';
      const row = [symbol, score, price, rsi, hv, mdd, ivr, status, rationale.replace(/"/g, '""')];
      lines.push(row.map(function(v){ return '"' + v + '"'; }).join(','));
    });
    return lines.join('\\n');
  };
  copycsv.addEventListener('click', async () => {
    const csv = toCSV();
    await navigator.clipboard.writeText(csv);
    copycsv.textContent = '✅ Copied CSV';
    setTimeout(()=> copycsv.textContent = '📄 CSV', 1200);
  });
  copyjson.addEventListener('click', async () => {
    const pre = ${JSON.stringify(JSON.stringify(data ?? { ts:null, results:[] }, null, 2))};
    await navigator.clipboard.writeText(pre);
    copyjson.textContent = '✅ Copied JSON';
    setTimeout(()=> copyjson.textContent = '🧾 JSON', 1200);
  });
})();
</script>
</body>
</html>`;
}

/* ---------- helpers ---------- */

function badge(text: string, kind: "ok" | "warn" | "bad") {
  const cls = kind === "ok" ? "b-ok" : kind === "warn" ? "b-warn" : "b-bad";
  return `<span class="badge ${cls}">${text}</span>`;
}
function badgeRSI(v?: number) {
  if (!isFiniteNum(v)) return "";
  if (v < 35) return badge("OVERSOLD", "warn");
  if (v > 70) return badge("OVERBOUGHT", "warn");
  if (v >= 40 && v <= 65) return badge("IN BAND", "ok");
  return "";
}
function badgeHV(v?: number) {
  if (!isFiniteNum(v)) return "";
  if (v < 0.25) return badge("LOW VOL", "ok");
  if (v > 0.60) return badge("HIGH VOL", "warn");
  return "";
}
function badgeMDD(v?: number) {
  if (!isFiniteNum(v)) return "";
  if (v > -0.15) return badge("SHALLOW DD", "ok");
  if (v < -0.40) return badge("DEEP DD", "warn");
  return "";
}

function isFiniteNum(n: any): n is number { return typeof n === "number" && Number.isFinite(n); }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
function fmt(n: number | undefined) { return isFiniteNum(n) ? n.toFixed(2) : "—"; }
function num(n: number | undefined, d=1) { return isFiniteNum(n) ? n.toFixed(d) : "—"; }
function pct(n: number | undefined) { return isFiniteNum(n) ? (n*100).toFixed(1) + "%" : "—"; }
function escapeHTML(s: string) { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)); }
