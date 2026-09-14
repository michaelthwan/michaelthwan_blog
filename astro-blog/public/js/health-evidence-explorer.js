/* Health Evidence Explorer
 *
 * One tripartite graph (behavior -> marker -> goal), rendered in full, two ways:
 *   goal mode      every goal,     each expanded into markers and the behaviors that move them
 *   behavior mode  every behavior, each expanded into markers and the goals they serve
 *
 * Deliberate omissions: no aggregate score, no "total effect". Behaviors that converge on
 * one marker do not add, and the tree shows that convergence instead of hiding it in a sum.
 */
(function () {
  'use strict';

  var TIER_ORDER = { A: 0, B: 1, C: 2, D: 3 };
  var TIER_LABEL = {
    A: 'Meta-analysis of RCTs',
    B: 'Randomised trial',
    C: 'Prospective cohort',
    D: 'Cross-sectional / animal / mechanistic'
  };
  var TIER_TAG = { A: 'META-RCT', B: 'RCT', C: 'COHORT', D: 'CROSS-SEC' };
  var USE_ORDER = { S: 0, A: 1, B: 2, C: 3, D: 4, E: 5, NULL: 6 };

  var state = { data: null, mode: 'goal', filter: '', selectedEdge: null };
  var el = {};

  /* ---------- helpers ---------- */

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function tierRank(t) {
    return TIER_ORDER[t] === undefined ? 9 : TIER_ORDER[t];
  }

  // Magnitude is used only to order rows inside one marker node, never across nodes.
  function magnitude(edge) {
    var v = edge.effect_normalized;
    if (typeof v === 'number') return Math.abs(v);
    if (typeof v === 'string') {
      var m = v.match(/-?\d+(\.\d+)?/);
      if (m) return Math.abs(parseFloat(m[0]));
    }
    if (typeof edge.effect === 'string') {
      var m2 = edge.effect.match(/-?\d+(\.\d+)?/);
      if (m2) return Math.abs(parseFloat(m2[0]));
    }
    return 0;
  }

  function useRank(edge) {
    var t = (edge.usefulness || {}).tier;
    return USE_ORDER[t] === undefined ? 5 : USE_ORDER[t];
  }

  // Most useful first. Ties fall back to the score, then to raw magnitude, so the order
  // is stable and never depends on the order the extraction agents happened to write.
  function sortEdges(a, b) {
    var d = useRank(a) - useRank(b);
    if (d !== 0) return d;
    var sa = (a.usefulness || {}).score, sb = (b.usefulness || {}).score;
    if (typeof sa === 'number' && typeof sb === 'number' && sa !== sb) return sb - sa;
    var t = tierRank(a.evidence_tier) - tierRank(b.evidence_tier);
    if (t !== 0) return t;
    return magnitude(b) - magnitude(a);
  }

  function edgeKey(e) {
    return e.behavior_id + '::' + e.marker_id + '::' + ((e.paper && e.paper.doi) || '');
  }

  function markersForGoal(goalId) {
    return state.data.nodes.markers.filter(function (m) {
      return (m.goal_ids || []).indexOf(goalId) !== -1;
    });
  }

  function edgesForMarker(markerId) {
    return state.data.edges.filter(function (e) { return e.marker_id === markerId; });
  }

  function edgesForBehavior(behaviorId) {
    return state.data.edges.filter(function (e) { return e.behavior_id === behaviorId; });
  }

  function goalsForBehavior(behaviorId) {
    var seen = {};
    edgesForBehavior(behaviorId).forEach(function (e) {
      var m = byId(state.data.nodes.markers, e.marker_id);
      if (!m) return;
      (m.goal_ids || []).forEach(function (g) { seen[g] = true; });
    });
    return Object.keys(seen);
  }

  // Leverage is counted per family, not per node. "One night of sleep loss" and "three
  // nights" stay separate rows because they are different exposures, but both count
  // towards the fact that sleep loss reaches more than one goal.
  function familyOf(behaviorId) {
    var b = byId(state.data.nodes.behaviors, behaviorId);
    return (b && b.family) || behaviorId;
  }

  function familyLabel(behaviorId) {
    var b = byId(state.data.nodes.behaviors, behaviorId);
    return (b && b.family_label) || (b && b.name) || behaviorId;
  }

  function goalsForFamily(behaviorId) {
    var fam = familyOf(behaviorId);
    var seen = {};
    state.data.nodes.behaviors.forEach(function (b) {
      if (((b.family) || b.id) !== fam) return;
      goalsForBehavior(b.id).forEach(function (g) { seen[g] = true; });
    });
    return Object.keys(seen);
  }

  // Figures and long results passages are enriched per paper, keyed by DOI, so that
  // several edges citing one paper share one download rather than repeating it.
  function paperExtras(doi) {
    if (!doi || !state.data.figures_by_doi) return null;
    var key = String(doi).replace(/^https?:\/\/doi\.org\//, '');
    return state.data.figures_by_doi[key] || state.data.figures_by_doi[doi] || null;
  }

  function matchesFilter(text) {
    if (!state.filter) return true;
    return String(text).toLowerCase().indexOf(state.filter) !== -1;
  }

  /* ---------- small render pieces ---------- */

  // Direction only. These arrows were once green for up and red for down, which reads as
  // good and bad - but 31 rows here are things like smoking raising all-cause mortality,
  // where "up" is the harm. Shape carries the direction; colour carries no verdict.
  // Green plus means the study found something welcome; red minus means it found
  // something unwelcome. The sign is the verdict, not the arithmetic: aerobic exercise
  // LOWERS blood pressure and that is a green plus, because lower blood pressure is the
  // good direction. Which way the number actually moved is still on the row, in the
  // effect itself, and spelled out in the tooltip and the evidence panel.
  var VALENCE_WORD = {
    good: 'a favourable finding',
    bad: 'an unfavourable finding',
    unclear: 'this marker has no inherently good or bad direction',
    none: 'studied, and no effect was found'
  };
  var VALENCE_GLYPH = { good: '+', bad: '&minus;', unclear: '?', none: '=' };

  function dirMark(direction, edge) {
    var v = (edge && edge.valence) ||
      (direction === null || direction === undefined ? 'none' : 'unclear');
    var moved = direction === '+' ? 'raises this marker' :
      (direction === '-' ? 'lowers this marker' : 'no measurable change');
    return '<span class="hx-dir hx-dir-' + esc(v) + '" title="' + esc(moved) + ' — ' +
      esc(VALENCE_WORD[v] || '') + '">' + (VALENCE_GLYPH[v] || '?') + '</span>';
  }

  // Statistics actually present in this dataset, counted from it rather than guessed.
  var STAT_GLOSSARY = [
    ['SMD', 'standardised mean difference - change expressed in standard deviations, so different instruments can be compared'],
    ['RR', 'relative risk - risk in the exposed group divided by risk in the unexposed'],
    ['HR', 'hazard ratio - the same idea over time; 1.0 means no difference'],
    ['MD', 'mean difference - the raw change, in the marker’s own units'],
    ['WMD', 'weighted mean difference - a mean difference pooled across trials'],
    ['OR', 'odds ratio - odds in one group divided by odds in the other'],
    ['ES', 'effect size - a generic standardised magnitude'],
    ['beta', 'regression coefficient - change in the outcome per unit of the exposure'],
    ['r', 'correlation coefficient - association only, from -1 to 1']
  ];

  function renderGlossary() {
    var host = document.getElementById('hx-glossary');
    if (!host) return;
    var h = '<details class="hx-cutbox"><summary class="hx-cutsum">' +
      '<span class="hx-cutsum-label">What the statistics mean</span>' +
      '<span class="hx-tally">' + STAT_GLOSSARY.length + '</span></summary>' +
      '<ul class="hx-cutlist">';
    STAT_GLOSSARY.forEach(function (g) {
      h += '<li><span class="hx-cut-what"><code>' + esc(g[0]) + '</code></span>' +
        '<span class="hx-cut-why">' + esc(g[1]) + '</span></li>';
    });
    host.innerHTML = h + '</ul></details>';
  }

  function tierBadge(tier, edge) {
    var t = tier || '?';
    var corrected = edge && edge.tier_corrected_from;
    var title = TIER_LABEL[t] || 'Unclassified';
    if (corrected) {
      title = 'Corrected from tier ' + corrected + ' to ' + t + ' on independent review. ' +
        (edge.tier_note || '');
    }
    var tag = (edge && edge.evidence_tag) || TIER_TAG[t] || t;
    return '<span class="hx-tier hx-tier-' + esc(t) + (corrected ? ' hx-tier-fixed' : '') +
      '" title="' + esc(title) + '">' + esc(tag) + (corrected ? '*' : '') + '</span>';
  }

  // Rows carry a short form; the full text always survives in the evidence panel.
  function clip(text, max) {
    var s = String(text == null ? '' : text).trim();
    if (s.length <= max) return s;
    return s.slice(0, max - 1).replace(/[\s,;(]+$/, '') + '…';
  }

  // "WMD = -3.67 mg/L (95% CI -6.96 to -0.38), p = 0.02 for CRP; hs-CRP also…"
  // becomes "WMD = -3.67 mg/L" — the estimate, without the interval and commentary.
  function shortEffect(effect) {
    var s = String(effect == null ? '' : effect).trim();
    var head = s.split(/\s*[;(]/)[0];
    head = head.replace(/,\s*(95\s*%|p\s*[=<>]).*$/i, '').trim();
    return clip(head || s, 34);
  }

  function effectBadge(edge) {
    if (edge.direction === null || edge.direction === undefined) {
      return '<span class="hx-effect hx-effect-null">studied, no effect</span>';
    }
    if (!edge.effect) return '';
    return '<span class="hx-effect" title="' + esc(edge.effect) + '">' +
      esc(shortEffect(edge.effect)) + '</span>';
  }

  // Marks an edge whose stated effect contains a figure that does not appear in its own
  // quoted sentence. Such an edge is shown, not hidden: the reader is told which number
  // the citation does not carry, rather than being handed a silent claim.
  function unsupportedBadge(edge) {
    var out = '';
    var u = edge.unsupported_numbers;
    if (u && u.length) {
      out += '<span class="hx-warn" title="These figures are not in the quoted sentence: ' +
        esc(u.join(', ')) + '">quote incomplete</span>';
    }
    if (edge.quote_elided || edge.quote_note) {
      out += '<span class="hx-warn" title="' +
        esc(edge.quote_note || 'The quoted sentence has an ellipsis in it, so it is not a full verbatim copy') +
        '">check quote</span>';
    }
    if (edge.coi_note) {
      out += '<span class="hx-warn" title="' + esc(edge.coi_note) + '">conflict of interest</span>';
    }
    return out;
  }

  // A derived convenience for ordering, not a finding. The components are listed in the
  // panel so the reader can disagree with the weighting rather than take it on faith.
  function useBadge(edge) {
    var u = edge.usefulness;
    if (!u) return '';
    if (u.tier === 'NULL') {
      return '<span class="hx-use hx-use-NULL" title="Studied and no effect found. Real ' +
        'information, but not an action, so it is not ranked.">&ndash;</span>';
    }
    return '<span class="hx-use hx-use-' + esc(u.tier) + '" title="Usefulness ' + esc(u.tier) +
      ' (score ' + esc(u.score) + '). ' + esc((u.why || []).join('; ')) + '">' +
      esc(u.tier) + '</span>';
  }

  function crossBadge(behaviorId) {
    var n = goalsForFamily(behaviorId).length;
    if (n < 2) return '';
    return '<span class="hx-cross" title="' + esc(familyLabel(behaviorId)) +
      ' reaches markers under ' + n + ' of the goals here">&times;' + n + '</span>';
  }

  function leafRow(edge, label, extraClass) {
    return '<li><button class="hx-leaf' + (extraClass ? ' ' + extraClass : '') +
      '" data-edge="' + esc(edgeKey(edge)) + '">' +
      useBadge(edge) + dirMark(edge.direction, edge) +
      '<span class="hx-leaf-name">' + esc(label) + '</span>' +
      effectBadge(edge) + tierBadge(edge.evidence_tier, edge) + unsupportedBadge(edge) +
      (extraClass ? '' : crossBadge(edge.behavior_id)) +
      (edge.conditional_on ? '<span class="hx-cond" title="' + esc(edge.conditional_on) +
        '">only: ' + esc(clip(edge.conditional_on, 96)) + '</span>' : '') +
      '</button></li>';
  }

  /* ---------- full trees ---------- */

  function renderAllGoals() {
    var out = '';
    var shown = 0;

    state.data.nodes.goals.forEach(function (goal) {
      var markers = markersForGoal(goal.id);
      var sections = '';
      var goalHit = matchesFilter(goal.name);
      var rowsShown = 0;

      markers.forEach(function (marker) {
        var edges = edgesForMarker(marker.id).slice().sort(sortEdges);
        var rows = '';
        edges.forEach(function (e) {
          var b = byId(state.data.nodes.behaviors, e.behavior_id);
          var name = b ? b.name : e.behavior_id;
          if (goalHit || matchesFilter(marker.name) || matchesFilter(name)) {
            rows += leafRow(e, name);
            rowsShown++;
          }
        });
        if (!rows) return;
        sections += '<li class="hx-branch"><div class="hx-marker">' +
          '<span class="hx-marker-name">' + esc(marker.name) + '</span>' +
          (marker.unit ? '<span class="hx-unit">' + esc(marker.unit) + '</span>' : '') +
          '<span class="hx-count">' + edges.length + '</span>' +
          '</div><ul class="hx-leaves">' + rows + '</ul></li>';
      });

      if (!sections) return;
      shown += rowsShown;

      var papers = {};
      markers.forEach(function (m) {
        edgesForMarker(m.id).forEach(function (e) {
          if (e.paper && e.paper.doi) papers[e.paper.doi] = true;
        });
      });

      out += '<details class="hx-section"' + (state.filter ? ' open' : '') +
        '><summary class="hx-goalbar">' +
        '<span class="hx-goalname">' + esc(goal.name) + '</span>' +
        '<span class="hx-tally">' + markers.length + ' markers &middot; ' + rowsShown +
        ' rows &middot; ' + Object.keys(papers).length + ' papers</span>' +
        '<span class="hx-goaldef">' + esc(goal.definition || '') + '</span>' +
        '</summary><ul class="hx-branches">' + sections + '</ul></details>';
    });

    return out || '<p class="hx-empty">Nothing matches that filter.</p>';
  }

  function renderAllBehaviors() {
    var out = '';

    // Grouped by kind, and inside each group the behaviors that reach the most goals
    // come first, so the leverage story survives the grouping.
    var behaviors = state.data.nodes.behaviors.slice().sort(function (a, b) {
      var g = (a.group_rank === undefined ? 99 : a.group_rank) -
              (b.group_rank === undefined ? 99 : b.group_rank);
      if (g !== 0) return g;
      var d = goalsForFamily(b.id).length - goalsForFamily(a.id).length;
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    });

    // Rows surviving the filter, per group, so a heading is only drawn when it has content.
    var groupCounts = {};
    behaviors.forEach(function (bh) {
      if (!edgesForBehavior(bh.id).length) return;
      var hit = matchesFilter(bh.name) || edgesForBehavior(bh.id).some(function (e) {
        var m = byId(state.data.nodes.markers, e.marker_id);
        if (!m) return false;
        if (matchesFilter(m.name)) return true;
        return (m.goal_ids || []).some(function (gid) {
          var g = byId(state.data.nodes.goals, gid);
          return g && matchesFilter(g.name);
        });
      });
      if (hit) groupCounts[bh.group] = (groupCounts[bh.group] || 0) + 1;
    });

    var lastGroup = null;

    behaviors.forEach(function (bh) {
      var edges = edgesForBehavior(bh.id).slice().sort(sortEdges);
      if (!edges.length) return;
      var behaviorHit = matchesFilter(bh.name);
      var sections = '';

      edges.forEach(function (e) {
        var marker = byId(state.data.nodes.markers, e.marker_id);
        var mname = marker ? marker.name : e.marker_id;
        var goalIds = (marker && marker.goal_ids) || [];
        var goalNames = goalIds.map(function (gid) {
          var g = byId(state.data.nodes.goals, gid);
          return g ? g.name : gid;
        });

        if (!(behaviorHit || matchesFilter(mname) || goalNames.some(matchesFilter))) return;

        var rows = '';
        goalNames.forEach(function (gn) {
          rows += leafRow(e, gn, 'hx-leaf-goal');
        });
        if (!rows) rows = '<li class="hx-empty">Not wired to a goal in this dataset.</li>';

        sections += '<li class="hx-branch"><div class="hx-marker">' +
          dirMark(e.direction, e) +
          '<span class="hx-marker-name">' + esc(mname) + '</span>' +
          (marker && marker.unit ? '<span class="hx-unit">' + esc(marker.unit) + '</span>' : '') +
          effectBadge(e) + tierBadge(e.evidence_tier, e) +
          (e.conditional_on ? '<span class="hx-cond" title="' + esc(e.conditional_on) +
            '">only: ' + esc(clip(e.conditional_on, 96)) + '</span>' : '') +
          '</div><ul class="hx-leaves">' + rows + '</ul></li>';
      });

      if (!sections) return;

      if (bh.group !== lastGroup) {
        lastGroup = bh.group;
        out += '<h4 class="hx-group">' + esc(bh.group_label || bh.group) +
          '<span class="hx-tally">' + (groupCounts[bh.group] || 0) + '</span></h4>';
      }

      var n = goalsForFamily(bh.id).length;
      out += '<details class="hx-section"' + (state.filter ? ' open' : '') +
        '><summary class="hx-goalbar">' +
        '<span class="hx-goalname">' + esc(bh.name) + '</span>' +
        (n > 1 ? '<span class="hx-cross" title="' + esc(familyLabel(bh.id)) +
          ' reaches ' + n + ' goals">&times;' + n + ' goals</span>' : '') +
        '<span class="hx-tally">' + edges.length + ' markers</span>' +
        '<span class="hx-goaldef">' + esc(bh.dose_or_intensity || '') + '</span>' +
        '</summary><ul class="hx-branches">' + sections + '</ul></details>';
    });

    return out || '<p class="hx-empty">Nothing matches that filter.</p>';
  }

  /* ---------- evidence panel ---------- */

  function renderPanel(edge) {
    if (!edge) {
      return '<div class="hx-panel-empty"><p><strong>Click any row</strong> to read the study ' +
        'behind it: design, sample, the result sentence quoted verbatim, and what the finding ' +
        'is conditional on.</p></div>';
    }

    var b = byId(state.data.nodes.behaviors, edge.behavior_id);
    var m = byId(state.data.nodes.markers, edge.marker_id);
    var p = edge.paper || {};
    var doiUrl = p.doi ? ('https://doi.org/' + String(p.doi).replace(/^https?:\/\/doi\.org\//, '')) : null;

    var h = '<div class="hx-panel-head"><span class="hx-panel-edge">' +
      esc(b ? b.name : edge.behavior_id) + ' ' + dirMark(edge.direction, edge) + ' ' +
      esc(m ? m.name : edge.marker_id) + '</span></div>';

    h += '<dl class="hx-facts">';
    if (edge.effect) h += '<dt>Effect as reported</dt><dd>' + esc(edge.effect) + '</dd>';
    if (edge.effect_normalized !== undefined && edge.effect_normalized !== null && edge.effect_normalized !== '') {
      h += '<dt>Normalised</dt><dd>' + esc(edge.effect_normalized) +
        (edge.normalization_method ? ' <span class="hx-muted">(' + esc(edge.normalization_method) + ')</span>' : '') +
        '</dd>';
    }
    if (edge.usefulness) {
      h += '<dt>Usefulness</dt><dd>' + useBadge(edge) + ' ' +
        (edge.usefulness.tier === 'NULL'
          ? 'not ranked'
          : 'score ' + esc(edge.usefulness.score)) +
        '<ul class="hx-why">' +
        (edge.usefulness.why || []).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') +
        '</ul></dd>';
    }
    h += '<dt>Evidence</dt><dd>' + tierBadge(edge.evidence_tier, edge) + ' ' +
      esc(TIER_LABEL[edge.evidence_tier] || 'Unclassified') +
      (p.design ? ' <span class="hx-muted">&middot; ' + esc(p.design) + '</span>' : '') +
      (p.n ? ' <span class="hx-muted">&middot; n = ' + esc(p.n) + '</span>' : '') + '</dd>';
    if (edge.population) h += '<dt>Population</dt><dd>' + esc(edge.population) + '</dd>';
    if (edge.conditional_on) h += '<dt>Conditional on</dt><dd class="hx-cond-strong">' + esc(edge.conditional_on) + '</dd>';
    h += '</dl>';

    if (edge.verbatim) {
      h += '<h5 class="hx-subhead">Result sentence, verbatim</h5>' +
        '<blockquote class="hx-verbatim">' + esc(edge.verbatim) + '</blockquote>';
    }

    if (edge.quote_note) {
      h += '<p class="hx-warnbox"><strong>Quote provenance.</strong> ' + esc(edge.quote_note) +
        (edge.verified_note_source ? ' <span class="hx-muted">(independent verification)</span>' : '') +
        '</p>';
    } else if (edge.quote_elided) {
      h += '<p class="hx-warnbox"><strong>This quote is not a full sentence.</strong> ' +
        'It contains an ellipsis, so some of the original wording has been dropped. ' +
        'Check the source before relying on it.</p>';
    }

    if (edge.coi_note) {
      h += '<p class="hx-warnbox"><strong>Conflict of interest.</strong> ' + esc(edge.coi_note) + '</p>';
    }

    if (edge.tier_corrected_from) {
      h += '<p class="hx-fixbox"><strong>Evidence tier corrected: ' +
        esc(edge.tier_corrected_from) + ' to ' + esc(edge.evidence_tier) + '.</strong> ' +
        esc(edge.tier_note || '') + ' <span class="hx-muted">(independent verification)</span></p>';
    }

    if (edge.unsupported_numbers && edge.unsupported_numbers.length) {
      h += '<p class="hx-warnbox"><strong>Quote does not carry every figure.</strong> ' +
        esc(edge.unsupported_numbers.join(', ')) + ' appear in the stated effect but not in ' +
        'the sentence above. They may come from the full text rather than the abstract, or ' +
        'the effect may overstate what this sentence supports. Treat them as unverified.</p>';
    }

    var extra = paperExtras(p.doi);

    var passage = edge.key_results || (extra && extra.results_passage);
    if (passage) {
      h += '<h5 class="hx-subhead">From the paper</h5>' +
        '<p class="hx-passage">' + esc(passage) + '</p>';
    }

    var figures = (extra && extra.figures) || [];
    if (figures.length) {
      h += '<h5 class="hx-subhead">Figures</h5>';
      figures.forEach(function (f) {
        h += '<figure class="hx-fig">' +
          '<a href="' + esc(f.local_path) + '" target="_blank" rel="noopener">' +
          '<img src="' + esc(f.local_path) + '" alt="' + esc(f.label || 'Figure') + '">' +
          '</a><figcaption>' +
          (f.shows ? '<strong>' + esc(f.shows) + '</strong> ' : '') +
          '<span class="hx-figcap">' + esc(f.label ? f.label + '. ' : '') + esc(f.caption || '') + '</span>' +
          '</figcaption></figure>';
      });
    }

    if (p.title) {
      h += '<p class="hx-cite">' +
        (doiUrl ? '<a href="' + esc(doiUrl) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a>' : esc(p.title)) +
        (p.year ? ' (' + esc(p.year) + ')' : '') + '</p>';
    }
    if (extra && extra.source_url) {
      h += '<p class="hx-cite"><a href="' + esc(extra.source_url) + '" target="_blank" rel="noopener">' +
        'Full text on PMC</a>' + (extra.license ? ' <span class="hx-muted">&middot; ' + esc(extra.license) + '</span>' : '') +
        '</p>';
    }
    if (edge.caveats) h += '<p class="hx-caveat"><strong>Caveats.</strong> ' + esc(edge.caveats) + '</p>';

    return h;
  }

  /* ---------- wiring ---------- */

  function render() {
    el.tree.innerHTML = state.mode === 'goal' ? renderAllGoals() : renderAllBehaviors();
    el.panel.innerHTML = renderPanel(state.selectedEdge);
    Array.prototype.forEach.call(el.root.querySelectorAll('.hx-mode'), function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-mode') === state.mode);
    });
  }

  function bind() {
    el.root.addEventListener('click', function (ev) {
      var mode = ev.target.closest && ev.target.closest('.hx-mode');
      if (mode) {
        var next = mode.getAttribute('data-mode');
        if (next === state.mode) return;
        state.mode = next;
        state.selectedEdge = null;
        render();
        return;
      }

      var toggle = ev.target.closest && ev.target.closest('.hx-toggle');
      if (toggle) {
        var open = toggle.getAttribute('data-open') === 'true';
        Array.prototype.forEach.call(el.root.querySelectorAll('.hx-section'), function (d) {
          d.open = open;
        });
        return;
      }

      var leaf = ev.target.closest && ev.target.closest('.hx-leaf');
      if (leaf) {
        var key = leaf.getAttribute('data-edge');
        for (var i = 0; i < state.data.edges.length; i++) {
          if (edgeKey(state.data.edges[i]) === key) { state.selectedEdge = state.data.edges[i]; break; }
        }
        Array.prototype.forEach.call(el.root.querySelectorAll('.hx-leaf'), function (x) {
          x.classList.remove('is-selected');
        });
        leaf.classList.add('is-selected');
        el.panel.innerHTML = renderPanel(state.selectedEdge);
        if (window.matchMedia('(max-width: 820px)').matches) {
          el.panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    el.root.addEventListener('input', function (ev) {
      if (ev.target.id !== 'hx-filter') return;
      state.filter = ev.target.value.trim().toLowerCase();
      el.tree.innerHTML = state.mode === 'goal' ? renderAllGoals() : renderAllBehaviors();
    });
  }

  function normalize(raw) {
    var d = raw && raw.nodes ? raw : { nodes: raw, edges: (raw && raw.edges) || [] };
    d.nodes = d.nodes || {};
    d.nodes.goals = d.nodes.goals || [];
    d.nodes.markers = d.nodes.markers || [];
    d.nodes.behaviors = d.nodes.behaviors || [];
    d.edges = d.edges || [];
    // Extractors have written the cut list under several names; accept all of them.
    d.cut = d.cut || d.cut_candidates || d.cuts || [];
    return d;
  }

  // Collapsed by default: the cut list is a long accountability record, not something
  // every reader needs open. It was previously over half the height of the whole page.
  function renderCutList(data) {
    var host = document.getElementById('hx-cut');
    if (!host || !data.cut.length) return;
    var h = '<details class="hx-cutbox"><summary class="hx-cutsum">' +
      '<span class="hx-cutsum-label">Candidate rows that did not make it</span>' +
      '<span class="hx-tally">' + data.cut.length + '</span></summary>' +
      '<ul class="hx-cutlist">';
    data.cut.forEach(function (c) {
      var what = c.label || c.candidate || ((c.behavior || '') + (c.marker ? ' -> ' + c.marker : ''));
      h += '<li><span class="hx-cut-what">' + esc(what) + '</span>' +
        '<span class="hx-cut-why">' + esc(c.reason || '') + '</span></li>';
    });
    host.innerHTML = h + '</ul></details>';
  }

  // A behavior family that shows up under many goals is doing more work than one that
  // appears once. This strip is computed from the graph, not asserted: it simply counts
  // how many goals each family reaches, and lists the ones that reach more than one.
  function renderLeverage(data) {
    var host = document.getElementById('hx-leverage');
    if (!host) return;

    var markerGoals = {};
    data.nodes.markers.forEach(function (m) { markerGoals[m.id] = m.goal_ids || []; });

    var byFamily = {};
    data.edges.forEach(function (e) {
      var b = byId(data.nodes.behaviors, e.behavior_id) || {};
      var fam = b.family || e.behavior_id;
      var label = b.family_label || b.name || e.behavior_id;
      if (!byFamily[fam]) byFamily[fam] = { label: label, goals: {}, edges: 0 };
      byFamily[fam].edges++;
      (markerGoals[e.marker_id] || []).forEach(function (g) { byFamily[fam].goals[g] = true; });
    });

    var rows = Object.keys(byFamily).map(function (f) {
      var r = byFamily[f];
      return { label: r.label, goals: Object.keys(r.goals).length, edges: r.edges };
    }).filter(function (r) { return r.goals > 1; })
      .sort(function (a, b) { return b.goals - a.goals || b.edges - a.edges; });

    if (!rows.length) { host.innerHTML = ''; return; }

    var max = rows[0].goals;
    var h = '<div class="hx-lev-head">Reaches more than one goal</div><ul class="hx-levlist">';
    rows.forEach(function (r) {
      h += '<li><span class="hx-lev-name">' + esc(r.label) + '</span>' +
        '<span class="hx-lev-bar"><i style="width:' + Math.round(r.goals / max * 100) + '%"></i></span>' +
        '<span class="hx-lev-n">' + r.goals + ' goals</span>' +
        '<span class="hx-lev-e">' + r.edges + ' rows</span></li>';
    });
    host.innerHTML = h + '</ul>';
  }

  function renderCounts(data) {
    var host = document.getElementById('hx-counts');
    if (!host) return;
    var papers = {};
    var nulls = 0;
    data.edges.forEach(function (e) {
      if (e.paper && e.paper.doi) papers[e.paper.doi] = true;
      if (e.direction === null || e.direction === undefined) nulls++;
    });
    host.innerHTML =
      '<span><strong>' + data.nodes.goals.length + '</strong> goals</span>' +
      '<span><strong>' + data.nodes.markers.length + '</strong> markers</span>' +
      '<span><strong>' + data.nodes.behaviors.length + '</strong> behaviors</span>' +
      '<span><strong>' + data.edges.length + '</strong> edges</span>' +
      '<span><strong>' + Object.keys(papers).length + '</strong> papers</span>' +
      '<span><strong>' + nulls + '</strong> null results</span>' +
      '<span><strong>' + data.cut.length + '</strong> cut</span>';
  }

  function init() {
    el.root = document.getElementById('hx-explorer');
    if (!el.root) return;
    el.tree = document.getElementById('hx-tree');
    el.panel = document.getElementById('hx-panel');

    fetch('/data/health-evidence.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (raw) {
        state.data = normalize(raw);
        renderCounts(state.data);
        renderLeverage(state.data);
        renderGlossary();
        renderCutList(state.data);
        bind();
        render();
      })
      .catch(function (err) {
        el.tree.innerHTML = '<p class="hx-empty">Could not load the dataset (' + esc(err.message) + ').</p>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
