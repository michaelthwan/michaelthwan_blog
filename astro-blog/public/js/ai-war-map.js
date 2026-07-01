// ── AI Investment War map ──
// Data-driven SVG diagram: company nodes across four industry layers,
// with equity (purple) and commercial (green) deal arrows. All coordinates
// live in a fixed 1120x700 viewBox; paths are hand-routed polylines.
(function () {
  const mount = document.getElementById('aiw-diagram');
  if (!mount) return;

  // ── Layers (background bands) ──
  const BANDS = [
    { label: 'APPLICATION', y0: 36, y1: 155 },
    { label: 'MODEL', y0: 155, y1: 312 },
    { label: 'COMPUTE', y0: 312, y1: 502 },
    { label: 'SILICON', y0: 502, y1: 660 },
  ];

  // ── Nodes ──
  // kind: 'company' (tall card), 'sub' (block inside a company card), 'solo'
  const NODES = [
    { id: 'ms', label: 'Microsoft', cap: 'hyperscaler', x: 90, y: 40, w: 132, h: 455, kind: 'company' },
    { id: 'openai', label: 'OpenAI', cap: '≈$500B val (Oct ’25)', x: 236, y: 40, w: 132, h: 265, kind: 'company' },
    { id: 'anthropic', label: 'Anthropic', cap: '$965B Series H', x: 382, y: 40, w: 132, h: 265, kind: 'company' },
    { id: 'google', label: 'Google', cap: 'the full-stack player', x: 528, y: 40, w: 132, h: 615, kind: 'company' },
    { id: 'amazon', label: 'Amazon', cap: 'hyperscaler', x: 674, y: 40, w: 132, h: 615, kind: 'company' },
    { id: 'meta', label: 'Meta', cap: '$115–135B capex ’26', x: 820, y: 40, w: 132, h: 265, kind: 'company' },
    { id: 'spacex', label: 'SpaceX · xAI', cap: '$1.25T combined', x: 966, y: 40, w: 132, h: 455, kind: 'company' },

    { id: 'azure', parent: 'ms', label: 'Azure', cap: 'cloud', x: 98, y: 325, w: 116, h: 160, kind: 'sub' },
    { id: 'chatgpt', parent: 'openai', label: 'ChatGPT', cap: 'GPT models', x: 244, y: 165, w: 116, h: 130, kind: 'sub' },
    { id: 'claude', parent: 'anthropic', label: 'Claude', cap: 'models', x: 390, y: 165, w: 116, h: 130, kind: 'sub' },
    { id: 'gemini', parent: 'google', label: 'Gemini', cap: 'models', x: 536, y: 165, w: 116, h: 130, kind: 'sub' },
    { id: 'gcloud', parent: 'google', label: 'Google Cloud', cap: '', x: 536, y: 325, w: 116, h: 160, kind: 'sub' },
    { id: 'tpu', parent: 'google', label: 'TPU', cap: 'custom silicon', x: 536, y: 515, w: 116, h: 130, kind: 'sub' },
    { id: 'aws', parent: 'amazon', label: 'AWS', cap: 'cloud', x: 682, y: 325, w: 116, h: 160, kind: 'sub' },
    { id: 'trainium', parent: 'amazon', label: 'Trainium', cap: 'custom silicon', x: 682, y: 515, w: 116, h: 130, kind: 'sub' },
    { id: 'llama', parent: 'meta', label: 'Llama', cap: 'open weights', x: 828, y: 165, w: 116, h: 130, kind: 'sub' },
    { id: 'grok', parent: 'spacex', label: 'Grok', cap: 'models', x: 974, y: 165, w: 116, h: 130, kind: 'sub' },
    { id: 'colossus', parent: 'spacex', label: 'Colossus', cap: 'Memphis DC', x: 974, y: 325, w: 116, h: 160, kind: 'sub' },

    { id: 'oracle', label: 'Oracle', cap: 'OCI', x: 236, y: 325, w: 132, h: 75, kind: 'solo' },
    { id: 'stargate', label: 'Stargate', cap: '$500B project', x: 236, y: 412, w: 132, h: 73, kind: 'solo' },
    { id: 'nvidia', label: 'NVIDIA', cap: 'sells to everyone', x: 90, y: 515, w: 280, h: 130, kind: 'solo' },
    { id: 'broadcom', label: 'Broadcom', cap: 'custom ASICs', x: 382, y: 515, w: 132, h: 130, kind: 'solo' },
    { id: 'amd', label: 'AMD', cap: 'Instinct GPUs', x: 820, y: 515, w: 132, h: 130, kind: 'solo' },
    { id: 'intel', label: 'Intel', cap: 'foundry wildcard', x: 966, y: 515, w: 132, h: 130, kind: 'solo' },
  ];

  const NODE_INFO = {
    ms: 'Anchor investor in OpenAI since 2019 — and, since January 2026, an Anthropic shareholder too. Microsoft hedges across both frontier labs while Azure sells the compute underneath them.',
    openai: 'The center of gravity. OpenAI raised from Microsoft, Nvidia and SoftBank while committing well over a trillion dollars to Oracle, Microsoft, AMD and Broadcom for compute.',
    anthropic: 'The maker of Claude is the only lab funded by three rival hyperscalers — Amazon, Google and Microsoft — and it buys cloud capacity from all of them.',
    google: 'The only player that owns every layer: Gemini models, Google Cloud, and TPUs co-designed with Broadcom. It also holds up to $40B of Anthropic.',
    amazon: 'Anthropic’s biggest early backer. AWS plus Trainium is the most credible alternative stack to Nvidia for frontier training.',
    meta: 'Buys from everyone — Nvidia GPUs, Broadcom custom chips, even Google TPUs are in talks — to feed open-weight Llama. 2026 capex guidance: $115–135B.',
    spacex: 'After absorbing xAI in February 2026, SpaceX rents Colossus supercomputer capacity to Google — and even to rival Anthropic.',
    nvidia: 'The kingmaker. Stakes in OpenAI, Anthropic, xAI and Intel — money that largely returns as GPU purchase orders.',
    oracle: 'Stargate founding partner. A single $300B OpenAI contract turned Oracle Cloud Infrastructure into a hyperscaler overnight.',
    stargate: 'The $500B AI-infrastructure venture of SoftBank, OpenAI, Oracle and MGX. Roughly 7 GW planned, expanding to the UAE, Norway and Argentina.',
    broadcom: 'The quiet winner: it co-designs custom accelerators for Google, Meta and OpenAI, and powers Anthropic’s TPU ramp.',
    amd: 'Its 6 GW OpenAI supply deal is paid partly in AMD’s own equity — warrants for roughly 10% of the company.',
    intel: 'Took $5B from Nvidia in September 2025 alongside a US government stake. The foundry wildcard of the map.',
  };

  // ── Deals ──
  // type 'eq' (equity: A holds a stake in B) or 'co' (commercial: A pays B).
  // pts: hand-routed polyline in viewBox coordinates, arrowhead at the end.
  const DEALS = [
    // Equity
    { id: 'e-ms-openai', from: 'ms', to: 'openai', type: 'eq', amount: '27% stake', title: 'Microsoft → OpenAI', body: 'Roughly $13.8B invested since 2019 converted into a 27% stake (≈$135B) when OpenAI became a public benefit corporation in October 2025. Microsoft keeps IP access through 2032, but the April 2026 deal ended exclusivity and revenue sharing.', pts: [[222, 88], [236, 88]] },
    { id: 'e-nvda-openai', from: 'nvidia', to: 'openai', type: 'eq', amount: 'up to $100B', title: 'Nvidia → OpenAI', body: 'Nvidia invests progressively as each of 10 GW of Nvidia systems is deployed. The largest of the "circular" deals: Nvidia’s cash comes back as GPU orders.', pts: [[234, 515], [234, 150], [236, 150]] },
    { id: 'e-amzn-anthropic', from: 'amazon', to: 'anthropic', type: 'eq', amount: '$13B + $20B pledged', title: 'Amazon → Anthropic', body: '$13B invested, another $20B pledged on commercial milestones. A large share of Amazon’s recent "blowout" AI earnings came from marking up this stake.', pts: [[740, 40], [740, 16], [430, 16], [430, 40]] },
    { id: 'e-goog-anthropic', from: 'google', to: 'anthropic', type: 'eq', amount: 'up to $40B', title: 'Google → Anthropic', body: 'The largest single commitment to an AI lab outside Microsoft–OpenAI. Google holds a minority, non-controlling stake.', pts: [[528, 88], [514, 88]] },
    { id: 'e-ms-anthropic', from: 'ms', to: 'anthropic', type: 'eq', amount: '≈$5B', title: 'Microsoft → Anthropic', body: 'January 2026: Microsoft invests in its flagship partner’s biggest rival, as part of a ~$15B round with Nvidia at a $350B valuation, tied to Anthropic buying Azure capacity.', pts: [[140, 40], [140, 28], [410, 28], [410, 40]] },
    { id: 'e-nvda-anthropic', from: 'nvidia', to: 'anthropic', type: 'eq', amount: '≈$10B', title: 'Nvidia → Anthropic', body: 'Same January 2026 round. In parallel, Anthropic committed roughly $30B of Azure capacity running Nvidia systems — investor, supplier and beneficiary at once.', pts: [[360, 515], [360, 507], [379, 507], [379, 200], [382, 200]] },
    { id: 'e-openai-amd', from: 'openai', to: 'amd', type: 'eq', amount: 'warrants ≈10%', title: 'OpenAI → AMD', body: 'AMD supplies 6 GW of Instinct GPUs — and granted OpenAI warrants for up to ~160M shares (≈10% of AMD), vesting on deployment milestones. The supplier pays its customer in equity.', pts: [[350, 40], [350, 24], [810, 24], [810, 560], [820, 560]] },
    { id: 'e-nvda-intel', from: 'nvidia', to: 'intel', type: 'eq', amount: '$5B', title: 'Nvidia → Intel', body: 'September 2025 stake, plus co-development of x86 CPUs with NVLink for AI data centers.', pts: [[300, 645], [300, 662], [1000, 662], [1000, 645]] },
    { id: 'e-nvda-xai', from: 'nvidia', to: 'spacex', type: 'eq', amount: '$2B', title: 'Nvidia → xAI', body: 'Nvidia joined xAI’s $20B Series E (January 2026, $230B valuation). Weeks later SpaceX absorbed xAI in an all-stock deal valuing the pair at $1.25T.', pts: [[200, 645], [200, 668], [1109, 668], [1109, 250], [1098, 250]] },
    { id: 'e-openai-stargate', from: 'openai', to: 'stargate', type: 'eq', amount: 'founding equity', title: 'OpenAI → Stargate', body: 'Stargate LLC is owned by SoftBank, OpenAI, Oracle and MGX, targeting $500B of AI infrastructure over four years.', pts: [[236, 270], [224, 270], [224, 448], [236, 448]] },
    { id: 'e-oracle-stargate', from: 'oracle', to: 'stargate', type: 'eq', amount: 'founding equity', title: 'Oracle → Stargate', body: 'Oracle is both an equity partner in Stargate and its lead infrastructure builder.', pts: [[320, 400], [320, 412]] },
    // Commercial (payer → payee)
    { id: 'c-openai-oracle', from: 'openai', to: 'oracle', type: 'co', amount: '$300B / 5 yrs', title: 'OpenAI pays Oracle', body: 'Confirmed September 2025: OpenAI buys $300B of Oracle Cloud compute over five years. Oracle’s backlog exploded — and so did its borrowing to build the data centers.', pts: [[270, 305], [270, 325]] },
    { id: 'c-openai-azure', from: 'openai', to: 'azure', type: 'co', amount: '$250B Azure', title: 'OpenAI pays Microsoft', body: 'Part of the October 2025 restructuring: a $250B Azure commitment. In exchange, Microsoft gave up its right of first refusal on OpenAI’s compute.', pts: [[236, 120], [231, 120], [231, 380], [214, 380]] },
    { id: 'c-anthropic-aws', from: 'anthropic', to: 'aws', type: 'co', amount: '$100B / decade', title: 'Anthropic pays Amazon', body: 'AWS is Anthropic’s primary training partner — over $100B committed to Amazon chips and cloud, including the Trainium-powered Project Rainier cluster.', pts: [[470, 40], [470, 20], [667, 20], [667, 400], [682, 400]] },
    { id: 'c-anthropic-gcloud', from: 'anthropic', to: 'gcloud', type: 'co', amount: '$200B / 5 yrs', title: 'Anthropic pays Google', body: '$200B of Google Cloud over five years, plus up to 5 GW of next-generation TPUs (built with Broadcom) starting 2027.', pts: [[514, 270], [521, 270], [521, 380], [536, 380]] },
    { id: 'c-anthropic-azure', from: 'anthropic', to: 'azure', type: 'co', amount: '≈$30B', title: 'Anthropic pays Microsoft', body: 'Bought alongside the Microsoft/Nvidia investment. Claude now runs on all three hyperscalers.', pts: [[382, 312], [227, 312], [227, 335], [214, 335]] },
    { id: 'c-openai-broadcom', from: 'openai', to: 'broadcom', type: 'co', amount: '10 GW custom chips', title: 'OpenAI pays Broadcom', body: 'Co-designed accelerators at 10 GW scale — OpenAI’s hedge against Nvidia dependence.', pts: [[352, 305], [352, 318], [371, 318], [371, 503], [390, 503], [390, 515]] },
    { id: 'c-google-broadcom', from: 'google', to: 'broadcom', type: 'co', amount: 'TPU co-design', title: 'Google pays Broadcom', body: 'Broadcom has co-developed every TPU generation; 2026 contract scale is estimated around $46B as Google ramps external TPU sales.', pts: [[536, 580], [514, 580]] },
    { id: 'c-meta-broadcom', from: 'meta', to: 'broadcom', type: 'co', amount: 'multi-GW to 2029', title: 'Meta pays Broadcom', body: 'Custom AI silicon partnership extended through 2029, starting above one gigawatt of accelerators.', pts: [[820, 280], [814, 280], [814, 656], [450, 656], [450, 645]] },
    { id: 'c-meta-nvidia', from: 'meta', to: 'nvidia', type: 'co', amount: '“millions” of GPUs', title: 'Meta pays Nvidia', body: 'February 2026 expansion covering Grace Blackwell and future Vera Rubin platforms — reportedly worth tens of billions.', pts: [[820, 180], [818, 180], [818, 674], [150, 674], [150, 645]] },
    { id: 'c-anthropic-spacex', from: 'anthropic', to: 'spacex', type: 'co', amount: 'Colossus 1 lease', title: 'Anthropic pays SpaceX', body: 'May 2026: SpaceX leased the entire 300 MW, 220,000-GPU Colossus 1 site in Memphis to Anthropic — Musk renting his supercomputer to a direct rival.', pts: [[450, 40], [450, 12], [1032, 12], [1032, 40]] },
    { id: 'c-google-spacex', from: 'google', to: 'spacex', type: 'co', amount: '$920M / month', title: 'Google pays SpaceX', body: 'October 2026 through June 2029: about 110,000 Nvidia GPUs of Colossus capacity for Google.', pts: [[620, 40], [620, 8], [1060, 8], [1060, 40]] },
  ];

  const nodeById = {};
  NODES.forEach(n => { nodeById[n.id] = n; });
  const companyOf = id => { const n = nodeById[id]; return n && n.parent ? n.parent : id; };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ── Build SVG ──
  let svg = '<svg viewBox="0 0 1120 700" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of AI investment and commercial deals">';
  svg += '<defs>'
    + '<marker id="aiw-arr-eq" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="aiw-arrhead-eq"/></marker>'
    + '<marker id="aiw-arr-co" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="aiw-arrhead-co"/></marker>'
    + '</defs>';

  // Layer bands
  BANDS.forEach((b, i) => {
    svg += `<rect x="0" y="${b.y0}" width="1120" height="${b.y1 - b.y0}" class="aiw-band ${i % 2 ? 'alt' : ''}"/>`;
    if (i > 0) svg += `<line x1="0" y1="${b.y0}" x2="1120" y2="${b.y0}" class="aiw-band-line"/>`;
    const cy = (b.y0 + b.y1) / 2;
    svg += `<text x="24" y="${cy}" class="aiw-band-label" transform="rotate(-90 24 ${cy})" text-anchor="middle">${b.label}</text>`;
  });

  // Nodes
  NODES.forEach(n => {
    const cls = n.kind === 'sub' ? 'aiw-node aiw-sub' : 'aiw-node aiw-card';
    svg += `<g class="${cls}" data-node="${n.id}">`;
    svg += `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="8"/>`;
    const cx = n.x + n.w / 2;
    if (n.kind === 'company') {
      svg += `<text x="${cx}" y="76" class="aiw-name" text-anchor="middle">${esc(n.label)}</text>`;
      if (n.cap) svg += `<text x="${cx}" y="96" class="aiw-cap" text-anchor="middle">${esc(n.cap)}</text>`;
    } else {
      const cy = n.y + n.h / 2 + (n.cap ? -3 : 4);
      svg += `<text x="${cx}" y="${cy}" class="aiw-name ${n.kind === 'sub' ? 'sm' : ''}" text-anchor="middle">${esc(n.label)}</text>`;
      if (n.cap) svg += `<text x="${cx}" y="${cy + 17}" class="aiw-cap" text-anchor="middle">${esc(n.cap)}</text>`;
    }
    svg += '</g>';
  });

  // Deal edges (drawn above nodes)
  DEALS.forEach(d => {
    const pline = d.pts.map(p => p.join(',')).join(' ');
    svg += `<g class="aiw-edge aiw-${d.type}" data-deal="${d.id}">`
      + `<polyline points="${pline}" class="aiw-edge-line" marker-end="url(#aiw-arr-${d.type})"/>`
      + `<polyline points="${pline}" class="aiw-edge-hit"/>`
      + '</g>';
  });

  svg += '</svg>';
  mount.innerHTML = svg;

  // ── Controls ──
  const controls = document.getElementById('aiw-controls');
  const nEq = DEALS.filter(d => d.type === 'eq').length;
  const nCo = DEALS.filter(d => d.type === 'co').length;
  controls.innerHTML =
    `<button type="button" class="aiw-toggle aiw-toggle-eq on" data-type="eq"><span class="aiw-swatch eq"></span>Equity investment (${nEq})</button>`
    + `<button type="button" class="aiw-toggle aiw-toggle-co on" data-type="co"><span class="aiw-swatch co"></span>Commercial deal (${nCo})</button>`
    + '<span class="aiw-hint">Arrows follow the money · click a company or an arrow</span>';

  const panel = document.getElementById('aiw-panel');
  const svgEl = mount.querySelector('svg');
  const filters = { eq: true, co: true };
  let selected = null; // {kind:'node'|'deal', id}

  const dealsOf = companyId =>
    DEALS.filter(d => companyOf(d.from) === companyId || companyOf(d.to) === companyId);

  function typeBadge(t) {
    return t === 'eq'
      ? '<span class="aiw-badge eq">Equity</span>'
      : '<span class="aiw-badge co">Commercial</span>';
  }

  function renderPanel() {
    if (!selected) {
      panel.innerHTML = '<p class="aiw-panel-hint">Select a company to see every deal it is part of, or click an arrow for the specific terms. Use the toggles above to isolate equity stakes or commercial contracts.</p>';
      return;
    }
    if (selected.kind === 'node') {
      const id = selected.id;
      const n = nodeById[id];
      const list = dealsOf(id).filter(d => filters[d.type]);
      let html = `<h4 class="aiw-panel-title">${esc(n.label)}</h4>`;
      if (NODE_INFO[id]) html += `<p class="aiw-panel-desc">${NODE_INFO[id]}</p>`;
      html += list.map(d =>
        `<button type="button" class="aiw-deal-row" data-deal="${d.id}">`
        + `<span class="aiw-dot ${d.type}"></span>`
        + `<span class="aiw-deal-title">${esc(d.title)}</span>`
        + `<span class="aiw-deal-amt">${esc(d.amount)}</span>`
        + '</button>'
      ).join('');
      panel.innerHTML = html;
      panel.querySelectorAll('.aiw-deal-row').forEach(btn => {
        btn.addEventListener('click', () => select({ kind: 'deal', id: btn.dataset.deal }));
      });
    } else {
      const d = DEALS.find(x => x.id === selected.id);
      const from = nodeById[companyOf(d.from)], to = nodeById[companyOf(d.to)];
      panel.innerHTML =
        `<div class="aiw-panel-route">${typeBadge(d.type)} <strong>${esc(from.label)}</strong> → <strong>${esc(to.label)}</strong></div>`
        + `<div class="aiw-panel-amt">${esc(d.amount)}</div>`
        + `<p class="aiw-panel-desc">${d.body}</p>`;
    }
  }

  function applyState() {
    // filters
    svgEl.querySelectorAll('.aiw-edge').forEach(g => {
      const d = DEALS.find(x => x.id === g.dataset.deal);
      g.classList.toggle('aiw-off', !filters[d.type]);
    });
    // selection highlight / dim
    const active = new Set();
    if (selected) {
      if (selected.kind === 'deal') {
        const d = DEALS.find(x => x.id === selected.id);
        active.add(d.id);
        active.add(companyOf(d.from)); active.add(companyOf(d.to));
        active.add(d.from); active.add(d.to);
      } else {
        active.add(selected.id);
        dealsOf(selected.id).forEach(d => {
          if (!filters[d.type]) return;
          active.add(d.id);
          active.add(companyOf(d.from)); active.add(companyOf(d.to));
          active.add(d.from); active.add(d.to);
        });
      }
    }
    svgEl.querySelectorAll('.aiw-node').forEach(g => {
      g.classList.toggle('aiw-dim', !!selected && !active.has(g.dataset.node));
      g.classList.toggle('aiw-active', !!selected && active.has(g.dataset.node));
    });
    svgEl.querySelectorAll('.aiw-edge').forEach(g => {
      g.classList.toggle('aiw-dim', !!selected && !active.has(g.dataset.deal));
      g.classList.toggle('aiw-sel', !!selected && active.has(g.dataset.deal));
    });
    renderPanel();
  }

  function select(next) {
    selected = (selected && next && selected.kind === next.kind && selected.id === next.id) ? null : next;
    applyState();
  }

  // ── Events ──
  svgEl.querySelectorAll('.aiw-node').forEach(g => {
    g.addEventListener('click', e => {
      e.stopPropagation();
      select({ kind: 'node', id: companyOf(g.dataset.node) });
    });
  });
  svgEl.querySelectorAll('.aiw-edge').forEach(g => {
    g.addEventListener('click', e => {
      e.stopPropagation();
      select({ kind: 'deal', id: g.dataset.deal });
    });
  });
  svgEl.addEventListener('click', () => select(null));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && selected) select(null);
  });
  controls.querySelectorAll('.aiw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.type;
      filters[t] = !filters[t];
      btn.classList.toggle('on', filters[t]);
      applyState();
    });
  });

  applyState();
})();
