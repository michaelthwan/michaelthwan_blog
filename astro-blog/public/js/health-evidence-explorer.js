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
  var TIER_LABEL_ZH = {
    A: '隨機對照試驗的統合分析',
    B: '單一樣本充足的隨機對照試驗',
    C: '前瞻性世代研究',
    D: '橫斷面、動物或機轉推論'
  };

  function tierLabel(tier) {
    if (state.lang === 'zh-TW' && TIER_LABEL_ZH[tier]) return TIER_LABEL_ZH[tier];
    return TIER_LABEL[tier] || 'Unclassified';
  }
  var USE_ORDER = { S: 0, A: 1, B: 2, C: 3, D: 4, E: 5, NULL: 6 };

  var state = { data: null, mode: 'goal', filter: '', selectedEdge: null, lang: 'en', i18n: null,
                labelCount: 8, zoomX: 100, zoomY: 100, openTier: null };
  var el = {};

  var LANG_KEY = 'hx-lang';

  // Interface strings only. The data layer is translated separately, and three fields are
  // deliberately never translated: `verbatim`, because its whole purpose is to be the
  // paper's own sentence that a reader can check; `key_results`, for the same reason; and
  // `effect`, which is statistical notation rather than prose.
  var UI = {
    en: {
      shellTitle: 'Health Explorer',
      legend: 'Legend',
      byGoal: 'By goal — what moves this?',
      byBehavior: 'By behavior — what does this do?',
      filter: 'Filter goals, markers, behaviors…',
      expandAll: 'Expand all',
      collapseAll: 'Collapse all',
      reach: 'Reach against direction',
      widest: 'widest: ',
      stats: 'What the statistics mean',
      cut: 'Candidate rows that did not make it',
      goals: 'goals', markers: 'markers', behaviors: 'behaviors', edges: 'edges',
      goalsChip: 'goals',
      papers: 'papers', nulls: 'null results', cutN: 'cut',
      rows: 'rows', markersShort: 'markers', papersShort: 'papers',
      noMatch: 'Nothing matches that filter.',
      clickRow: 'Click any row',
      clickRest: ' to read the study behind it: design, sample, the result sentence quoted verbatim, and what the finding is conditional on.',
      effectReported: 'Effect as reported', normalised: 'Normalised',
      evidence: 'Evidence', population: 'Population', conditional: 'Conditional on',
      usefulness: 'Usefulness', notRanked: 'not ranked', score: 'score ',
      resultSentence: 'Result sentence, verbatim', fromPaper: 'From the paper',
      figures: 'Figures', fullText: 'Full text on PMC', caveats: 'Caveats.',
      studiedNoEffect: 'studied, no effect',
      quoteEnglishNote: '',
      only: 'only: ', close: 'Close',
      nParticipants: 'Participants, as the paper records them:',
      nStudies: 'Pooled studies, as the paper records them:',
      nUnknown: 'Sample size was not recorded for this paper.',
      scatterX: 'net weight of evidence  (favourable minus unfavourable, scored by strength)',
      scatterY: 'distinct markers moved',
      scatterNet: 'net',
      axisNet: 'net weight of evidence  (favourable minus unfavourable, scored by strength)',
      axisMarkers: 'distinct markers moved',
      axisLabels: 'names shown',
      zoomXLabel: 'across', zoomYLabel: 'up',
      offScale: 'off this range',
      resetZoom: 'reset zoom',
      quadGood: 'favourable evidence outweighs',
      quadBad: 'unfavourable outweighs',
      jumpLabel: 'See this from the other side:',
      jumpBehavior: 'everything this behaviour touches',
      favourable: 'favourable', unfavourable: 'unfavourable', nullShort: 'null',
      scatterAria: 'Each behaviour family plotted by the net weight of its evidence against how many distinct markers it moves',
      scatterNote: 'Right means the favourable evidence outweighs the unfavourable, scored by how strong each row is - a meta-analysis moves the total far more than a cross-sectional study. Up means the family touches many different markers. Top right is a broad, well-evidenced benefit; top left is a broad harm; near zero with a high marker count means the good and bad rows cancel, which is contested rather than neutral. Dot size is the number of rows. The horizontal scale is a square root, because one family reaches +99 while most sit between -10 and +10 and a linear axis flattened them into a stripe.',
      flagCoi: 'conflict', flagReview: 'disputed', flagErratum: 'erratum', flagConcern: 'concern',
      coiHead: 'Conflict of interest.', reviewHead: 'Disputed on review.',
      independentReview: 'independent verification',
      noticeHead: 'This paper carries a correction notice.',
      noticeBody: 'PubMed links it to a published correction, so the figure quoted here may be one that was later amended. Check the source before relying on it.',
      noticeTitle: 'PubMed correction notice: ',
      flagQuote: 'check quote',
      quoteMissing: 'These figures are not in the quoted sentence: ',
      quoteElided: 'The quoted sentence has an ellipsis in it, so it is not a full verbatim copy.',
      quoteSpliced: 'Every word of this quote is in the abstract, but not in one unbroken run - it reads as two separate sentences joined without an ellipsis.',
      quoteUnmatched: 'Every figure in this sentence is in the abstract, but the sentence itself is not - it reads as a summary written around the numbers rather than a line copied from the paper.',
      quoteNoNumbers: 'This sentence carries no figure to check it by, and it does not appear in the abstract as written. It may be a paraphrase.',
      tierMix: 'How the rows are graded',
      tierHint: 'click a bar for its rows',
      tierNote: 'Every row, counted by its usefulness tier. The tier is derived, not measured - it adds evidence strength to where the effect ranks among rows on the same marker, then subtracts open quote flags and author conflicts. NULL is not a low grade: those are findings that were measured and came back null, which is information rather than an action. Click a bar to see which rows it counts.',
      notMeasuredTitle: 'Not measured. No trial in the cited review looked at this outcome at all, so this is a gap in the evidence rather than a finding of no effect.',
      flagFullText: 'full text',
      nFixHead: 'Sample size corrected from', nFixTo: 'to',
      provHead: 'Quote provenance.',
      elidedHead: 'This quote is not a full sentence.',
      elidedBody: 'It contains an ellipsis, so some of the original wording has been dropped. Check the source before relying on it.',
      splicedHead: 'This quote does not appear in the abstract as one sentence.',
      splicedTail: 'The figures still check out; it is the sentence that was not copied whole.',
      beyondHead: 'Quoted from the full text.',
      tierFixHead: 'Evidence tier corrected:',
      figHead: 'Quote does not carry every figure.',
      figBody: 'appear in the stated effect but not in the sentence above. They may come from the full text rather than the abstract, or the effect may overstate what this sentence supports. Treat them as unverified.',
      byVerification: 'independent verification',
      quoteBeyond: 'This sentence is not in the free abstract, so it was taken from the full paper. Checking it needs the article itself.',
      useNullTitle: 'Studied and no effect found. Real information, but not an action, so it is not ranked.',
      useTitle: 'Usefulness ',
      crossReaches: ' reaches markers under ',
      crossGoalsHere: ' of the goals here',
      notWired: 'Not wired to a goal in this dataset.',
      scatterAria: 'Each behaviour family plotted by how many goals it reaches and whether its findings are favourable or unfavourable',
      scatterTipReaches: 'reaches ',
      scatterTipGoal: ' goal',
      scatterTipGoals: ' goals',
      scatterTipAcross: ' across ',
      scatterTipRows: ' rows, ',
      scatterTipGood: ' favourable and ',
      scatterTipBad: ' unfavourable',
      tierCorrected: 'Corrected from tier ',
      tierCorrectedTo: ' to ',
      tierCorrectedOn: ' on independent review. '
    },
    'zh-TW': {
      shellTitle: '健康證據探索器',
      legend: '圖例',
      byGoal: '按目標 — 什麼會改變它？',
      byBehavior: '按行為 — 它實際做了什麼？',
      filter: '篩選目標、指標、行為…',
      expandAll: '全部展開',
      collapseAll: '全部收合',
      reach: '廣度與方向',
      widest: '最廣：',
      stats: '統計量的意思',
      cut: '未能收錄的候選條目',
      goals: '目標', markers: '指標', behaviors: '行為', edges: '條目',
      goalsChip: '個目標',
      papers: '篇論文', nulls: '陰性結果', cutN: '已剔除',
      rows: '條', markersShort: '指標', papersShort: '篇論文',
      noMatch: '沒有符合篩選的項目。',
      clickRow: '點擊任一條目',
      clickRest: '，可看到背後的研究：設計、樣本、論文原句，以及該發現的適用條件。',
      effectReported: '原文報告的效應量', normalised: '標準化後',
      evidence: '證據', population: '受試族群', conditional: '適用條件',
      usefulness: '實用度', notRanked: '不參與排名', score: '分數 ',
      resultSentence: '論文結果原句', fromPaper: '論文內容',
      figures: '圖表', fullText: 'PMC 全文', caveats: '需注意：',
      studiedNoEffect: '研究過，無效果',
      quoteEnglishNote: '引句保持英文原文，以便你核對。',
      only: '僅限：', close: '關閉',
      nParticipants: '論文記載的受試人數：',
      nStudies: '論文記載的合併研究數：',
      nUnknown: '此論文未記載樣本數。',
      scatterX: '證據淨重量（有利減不利，依證據強度計分）',
      scatterY: '觸及的不同指標數',
      scatterNet: '淨分',
      axisNet: '證據淨重量（有利減不利，依證據強度計分）',
      axisMarkers: '觸及的不同指標數',
      axisLabels: '顯示名稱',
      zoomXLabel: '橫軸範圍', zoomYLabel: '縱軸範圍',
      offScale: '個落於範圍外',
      resetZoom: '重設縮放',
      quadGood: '有利證據占優',
      quadBad: '不利證據占優',
      jumpLabel: '從另一面看：',
      jumpBehavior: '這個行為觸及的全部',
      favourable: '有利', unfavourable: '不利', nullShort: '無效果',
      scatterAria: '每個行為家族依證據淨重量與所觸及指標數繪製',
      scatterNote: '越右，代表有利證據勝過不利證據，而且依每行證據強度加權——一篇統合分析推動總分的力道遠大於一篇橫斷面研究。越上，代表觸及越多不同指標。右上角是廣泛且證據穩固的益處；左上角是廣泛的傷害；淨分近零但指標數多，代表好壞兩面互相抵消，那是有爭議而不是中性。點的大小是列數。橫軸採平方根刻度，因為有一個家族達 +99，而大多數在 -10 至 +10 之間，線性軸會把它們壓成一條線。',
      flagCoi: '利益衝突', flagReview: '有異議',
      flagErratum: '勘誤', flagConcern: '關注聲明',
      coiHead: '利益衝突：', reviewHead: '經審核後有異議：',
      independentReview: '獨立驗證',
      noticeHead: '此論文有更正通知。',
      noticeBody: 'PubMed 連結到一份已發表的更正，因此此處引用的數字可能已被修正。依據它之前請先核對原文。',
      noticeTitle: 'PubMed 更正通知：',
      flagQuote: '核對引句',
      quoteMissing: '這些數字未出現在引句中：',
      quoteElided: '引句含省略號，因此不是完整的逐字抄錄。',
      quoteSpliced: '這句的每個字都在摘要裡，但並非連貫的一段，而是兩句分開的句子在沒有省略號下被接在一起。',
      quoteUnmatched: '句中每個數字都在摘要裡，但這句本身不在，讀起來像是圓繞數字寫成的摘要，而非從論文抄下的一句。',
      quoteNoNumbers: '這句沒有可供核對的數字，而且並未以此寫法出現於摘要，可能是意譯。',
      tierMix: '各列的評級分布',
      tierHint: '點一條柱看它包含哪些列',
      tierNote: '依實用度等級統計所有列。等級是推導而來、不是測量值：證據強度加上效應量在同一指標各列中的排名，再扣掉未結案的引句標記與作者利益衝突。NULL 不是低分：那些是測過而未發現效果的結果，是資訊，不是行動建議。點一條柱即可看到它究竟數了哪些列。',
      notMeasuredTitle: '未測量。所引回顧中沒有任何試驗測過這個結局，因此這是證據的空白，而不是「測過但沒效果」。',
      flagFullText: '全文',
      nFixHead: '樣本數已修正，由', nFixTo: '改為',
      provHead: '引句來源。',
      elidedHead: '這句不是完整的句子。',
      elidedBody: '句中含省略號，部分原文已被刪去，引用前請先核對原文。',
      splicedHead: '這句並未以完整一句的形式出現於摘要。',
      splicedTail: '數字本身核對無誤，問題在於這句並非整句抄錄。',
      beyondHead: '取自論文全文。',
      tierFixHead: '證據等級已修正：',
      figHead: '引句未包含所有數字。',
      figBody: '出現於所述效果，卻不在上述句子中。它們可能來自全文而非摘要，或者效果的陳述超過此句所能支持的範圍，請視為未經核實。',
      byVerification: '獨立核驗',
      quoteBeyond: '這句不在免費摘要裡，是取自論文全文，要核對就需要原文。',
      useNullTitle: '研究過，未發現效果。是真實資訊，但不是行動建議，故不參與排名。',
      useTitle: '實用度 ',
      crossReaches: '在本資料集中觸及 ',
      crossGoalsHere: ' 個目標下的指標',
      notWired: '此資料集未將此列接到任何目標。',
      scatterAria: '各行為家族依觸及目標數，以及發現偏有利或不利，畫成散點',
      scatterNote: '愈右代表該行為出現在愈多個目標下。愈上代表列以有利為主，愈下以不利為主。點的大小是列數。這是兩件分開的事：觸及很多目標，不等於對那些目標都有益。',
      scatterTipReaches: '觸及 ',
      scatterTipGoal: ' 個目標',
      scatterTipGoals: ' 個目標',
      scatterTipAcross: '，共 ',
      scatterTipRows: ' 列，',
      scatterTipGood: ' 條有利、',
      scatterTipBad: ' 條不利',
      tierCorrected: '經獨立審核，證據等級由 ',
      tierCorrectedTo: ' 改為 ',
      tierCorrectedOn: '。'
    }
  };

  function t(key) {
    var pack = UI[state.lang] || UI.en;
    return pack[key] !== undefined ? pack[key] : UI.en[key];
  }

  // Translated node text, falling back to the English the dataset already carries. A
  // missing translation shows the original rather than an empty row.
  function tr(node, field) {
    if (!node) return '';
    if (state.lang !== 'en' && state.i18n) {
      var table = state.i18n[node.__kind];
      var hit = table && table[node.id];
      if (hit && hit[field]) return hit[field];
    }
    return node[field] || '';
  }

  // The study design is the same handful of phrases over and over - "meta-analysis of
  // RCTs" covers 72 rows - so it is translated once in a lookup table rather than carried
  // on every edge.
  function trDesign(design) {
    if (state.lang !== 'zh-TW' || !design) return design;
    var table = (state.i18n && state.i18n.designs) || {};
    return table[design] || design;
  }

  // Translated text, with the English kept underneath it.
  //
  // A quoted result sentence stays in the language the paper was written in - that is the
  // evidence, and translating it would put words in the authors' mouths. Everything else
  // is ours to translate, but the original still has to be reachable: a reader checking a
  // number against the source needs the words the source used.
  function withOriginal(translated, original) {
    if (!original || translated === original) return esc(translated || '');
    return esc(translated) + '<span class="hx-orig">' + esc(original) + '</span>';
  }

  function trEdge(edge, field) {
    if (state.lang !== 'en' && state.i18n && state.i18n.edges) {
      var table = state.i18n.edges;
      var hit = table[edgeKey(edge)] || table[edge.legacy_key];
      if (hit && hit[field]) return hit[field];
    }
    return edge[field] || '';
  }

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

  // Unique per row. The old behavior+marker+DOI key collided on eight pairs where one
  // paper reported opposing findings, so clicking one row opened the other one's study.
  function edgeKey(e) {
    return e.edge_id || (e.behavior_id + '::' + e.marker_id + '::' + ((e.paper && e.paper.doi) || ''));
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
    var key = (b && b.family) || behaviorId;
    if (state.lang !== 'en' && state.i18n && state.i18n.families && state.i18n.families[key]) {
      return state.i18n.families[key];
    }
    return famLabel(b);
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

  function groupLabel(behavior) {
    if (state.lang !== 'en' && state.i18n && state.i18n.groups) {
      var hit = state.i18n.groups[behavior.group];
      if (hit) return hit;
    }
    return behavior.group_label || behavior.group;
  }

  // A family is named by the overlay's families table, not by the behaviour that happens to
  // sit in it: "Exercise" is the family, while the behaviour underneath might be "evening
  // exercise by intensity". The scatter read family_label straight off the node and so
  // stayed English after a language switch.
  function famLabel(behavior) {
    if (!behavior) return '';
    var key = behavior.family;
    if (key && state.lang !== 'en' && state.i18n && state.i18n.families) {
      var hit = state.i18n.families[key];
      if (hit) return hit;
    }
    if (key) return behavior.family_label || behavior.name || key;
    return tr(behavior, 'name') || behavior.name || behavior.id;
  }

  function matchesFilter(text) {
    if (!state.filter) return true;
    return String(text).toLowerCase().indexOf(state.filter) !== -1;
  }

  function matchesNode(node, extraFields) {
    if (!state.filter) return true;
    if (!node) return false;
    if (matchesFilter(node.name) || matchesFilter(tr(node, 'name'))) return true;
    extraFields = extraFields || [];
    for (var i = 0; i < extraFields.length; i++) {
      var f = extraFields[i];
      if (node[f] && (matchesFilter(node[f]) || matchesFilter(tr(node, f)))) return true;
    }
    return false;
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
  var VALENCE_WORD_BY_LANG = {
    en: {
      good: 'a favourable finding',
      bad: 'an unfavourable finding',
      unclear: 'this marker has no inherently good or bad direction',
      none: 'studied, and no effect was found'
    },
    'zh-TW': {
      good: '有利的發現',
      bad: '不利的發現',
      unclear: '此指標本身沒有好壞方向',
      none: '研究過，未發現效果'
    }
  };
  var MOVED_BY_LANG = {
    en: { '+': 'raises this marker', '-': 'lowers this marker', '0': 'no measurable change' },
    'zh-TW': { '+': '使此指標上升', '-': '使此指標下降', '0': '無可測得的變化' }
  };
  var VALENCE_GLYPH = { good: '+', bad: '&minus;', unclear: '?', none: '=' };

  function dirMark(direction, edge) {
    // "Studied and nothing happened" and "nobody has studied it" are different claims, and
    // the grey mark was making the second one look like the first. The flossing row on
    // interproximal caries came from a review whose own words are that no trial assessed it.
    if (edge && edge.not_measured) {
      return '<span class="hx-dir hx-dir-gap" title="' + esc(t('notMeasuredTitle')) + '">\u2300</span>';
    }
    var v = (edge && edge.valence) ||
      (direction === null || direction === undefined ? 'none' : 'unclear');
    var movedPack = MOVED_BY_LANG[state.lang] || MOVED_BY_LANG.en;
    var wordPack = VALENCE_WORD_BY_LANG[state.lang] || VALENCE_WORD_BY_LANG.en;
    var moved = movedPack[direction === '+' ? '+' : (direction === '-' ? '-' : '0')];
    return '<span class="hx-dir hx-dir-' + esc(v) + '" title="' + esc(moved) + ' — ' +
      esc(wordPack[v] || '') + '">' + (VALENCE_GLYPH[v] || '?') + '</span>';
  }

  // Statistics actually present in this dataset, counted from it rather than guessed.
  var STAT_GLOSSARY = {
    en: [
      ['SMD', 'standardised mean difference - change expressed in standard deviations, so different instruments can be compared'],
      ['RR', 'relative risk - risk in the exposed group divided by risk in the unexposed'],
      ['HR', 'hazard ratio - the same idea over time; 1.0 means no difference'],
      ['MD', 'mean difference - the raw change, in the marker’s own units'],
      ['WMD', 'weighted mean difference - a mean difference pooled across trials'],
      ['OR', 'odds ratio - odds in one group divided by odds in the other'],
      ['ES', 'effect size - a generic standardised magnitude'],
      ['beta', 'regression coefficient - change in the outcome per unit of the exposure'],
      ['r', 'correlation coefficient - association only, from -1 to 1']
    ],
    'zh-TW': [
      ['SMD', '標準化平均差——以標準差表示變化，以便比較不同量表'],
      ['RR', '相對風險——暴露組風險除以未暴露組風險'],
      ['HR', '危害比——同一概念隨時間計算；1.0 代表無差異'],
      ['MD', '平均差——以該指標本身單位表示的原始變化'],
      ['WMD', '加權平均差——跨試驗合併後的平均差'],
      ['OR', '勝算比——一組的勝算除以另一組的勝算'],
      ['ES', '效應量——泛用的標準化幅度'],
      ['beta', '迴歸係數——暴露每增加一單位，結果改變多少'],
      ['r', '相關係數——僅表示關聯，範圍 -1 至 1']
    ]
  };

  function renderGlossary() {
    var host = document.getElementById('hx-glossary');
    if (!host) return;
    var glossary = STAT_GLOSSARY[state.lang] || STAT_GLOSSARY.en;
    var h = '<details class="hx-cutbox"><summary class="hx-cutsum">' +
      '<span class="hx-cutsum-label">' + t('stats') + '</span>' +
      '<span class="hx-tally">' + glossary.length + '</span></summary>' +
      '<ul class="hx-cutlist">';
    glossary.forEach(function (g) {
      h += '<li><span class="hx-cut-what"><code>' + esc(g[0]) + '</code></span>' +
        '<span class="hx-cut-why">' + esc(g[1]) + '</span></li>';
    });
    host.innerHTML = h + '</ul></details>';
  }

  function trWhy(w) {
    if (state.lang !== 'zh-TW' || !w) return w;
    var exact = {
      'studied, no effect found - information, not an action': '研究過，未發現效果——是資訊，不是行動建議',
      'Meta-analysis or systematic review of randomised trials (+3)': '隨機對照試驗的統合分析或系統性回顧（+3）',
      'Single adequately powered randomised trial (+2)': '單一樣本充足的隨機對照試驗（+2）',
      'Prospective cohort study (+1)': '前瞻性世代研究（+1）',
      'Cross-sectional, case-control, animal or mechanistic (+0)': '橫斷面、病例對照、動物或機轉推論（+0）',
      'no numeric effect to rank (+0)': '沒有可排名的數值效應量（+0）',
      'only scored row on this marker, so no relative ranking (+1)': '此指標僅此列有分數，故無相對排名（+1）',
      'a quote-integrity flag is open on this row (-0.5)': '此列的引句完整性標記仍開著（-0.5）',
      'an author has a stake in the result (-0.5)': '作者與此結果有利害關係（-0.5）'
    };
    if (exact[w]) return exact[w];
    var m = /^effect size ranks (\d+)(?:st|nd|rd|th) percentile among the (\d+) scored rows on this marker \(\+([0-9.]+)(, pulled toward the middle[^)]*)?\)$/.exec(w);
    if (m) {
      return '效應量在此指標 ' + m[2] + ' 條有評分的列中位於第 ' + m[1] + ' 百分位（+' + m[3] + (m[4] ? '，因為 ' + m[2] + ' 條列的比較基礎太薄，已向中間收斂' : '') + '）';
    }
    return w;
  }

  function tierBadge(tier, edge) {
    var letter = tier || '?';
    var corrected = edge && edge.tier_corrected_from;
    var title = tierLabel(letter);
    if (corrected) {
      title = t('tierCorrected') + corrected + t('tierCorrectedTo') + letter + t('tierCorrectedOn') +
        (edge.tier_note || '');
    }
    var tag = (edge && edge.evidence_tag) || TIER_TAG[letter] || letter;
    return '<span class="hx-tier hx-tier-' + esc(letter) + (corrected ? ' hx-tier-fixed' : '') +
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
    return clip(head || s, 44);
  }

  function effectBadge(edge) {
    if (edge.direction === null || edge.direction === undefined) {
      return '<span class="hx-effect hx-effect-null">' + t('studiedNoEffect') + '</span>';
    }
    if (!edge.effect) return '';
    var txt = trEdge(edge, 'effect') || edge.effect;
    var tip = txt === edge.effect ? txt : txt + '\n\n' + edge.effect;
    return '<span class="hx-effect" title="' + esc(tip) + '">' +
      esc(shortEffect(txt)) + '</span>';
  }

  // Marks an edge whose stated effect contains a figure that does not appear in its own
  // quoted sentence. Such an edge is shown, not hidden: the reader is told which number
  // the citation does not carry, rather than being handed a silent claim.
  // One flag, not three. A row can trip several quote checks at once and stacking a badge
  // for each buried the actual finding; the reasons are joined into one tooltip instead.
  function unsupportedBadge(edge) {
    var reasons = [];
    if (edge.unsupported_numbers && edge.unsupported_numbers.length) {
      reasons.push(t('quoteMissing') + edge.unsupported_numbers.join(', '));
    }
    if (edge.quote_note) {
      reasons.push(edge.quote_note);
    } else if (edge.quote_elided) {
      reasons.push(t('quoteElided'));
    } else if (edge.quote_spliced) {
      // The three cases say different things and a reader deserves the right one.
      reasons.push(edge.quote_check_kind === 'unmatched' ? t('quoteUnmatched')
                 : edge.quote_check_kind === 'no_numbers' ? t('quoteNoNumbers')
                 : t('quoteSpliced'));
    }

    var out = '';
    if (reasons.length) {
      out += '<span class="hx-warn" title="' + esc(reasons.join(' ')) + '">' + t('flagQuote') + '</span>';
    }
    if (edge.quote_beyond_abstract) {
      out += '<span class="hx-srcflag" title="' + esc(t('quoteBeyond')) + '">' + t('flagFullText') + '</span>';
    }
    if (edge.coi_note) {
      out += '<span class="hx-warn" title="' + esc(trEdge(edge, 'coi_note')) + '">' + t('flagCoi') + '</span>';
    }
    if (edge.review_note) {
      out += '<span class="hx-warn hx-warn-hot" title="' + esc(trEdge(edge, 'review_note')) + '">' +
        t('flagReview') + '</span>';
    }
    if (edge.paper_notices && edge.paper_notices.length) {
      var loud = edge.paper_notice_serious;
      out += '<span class="hx-warn' + (loud ? ' hx-warn-hot' : '') + '" title="' +
        esc(t('noticeTitle') + (edge.paper_notice_detail || edge.paper_notices.join(', '))) +
        '">' + t(loud ? 'flagConcern' : 'flagErratum') + '</span>';
    }
    return out;
  }

  // A derived convenience for ordering, not a finding. The components are listed in the
  // panel so the reader can disagree with the weighting rather than take it on faith.
  function useBadge(edge) {
    var u = edge.usefulness;
    if (!u) return '';
    if (u.tier === 'NULL') {
      return '<span class="hx-use hx-use-NULL" title="' + esc(t('useNullTitle')) + '">&ndash;</span>';
    }
    var whyTitle = (u.why || []).map(trWhy).join('; ');
    return '<span class="hx-use hx-use-' + esc(u.tier) + '" title="' +
      esc(t('useTitle') + u.tier + ' (' + t('score') + u.score + '). ' + whyTitle) + '">' +
      esc(u.tier) + '</span>';
  }

  // Sample size on the row, before anything is clicked. A tier tells you the study design
  // and this tells you how much of it there was: a meta-analysis of 1,927 people and a
  // crossover trial of 19 both read as evidence until the count is visible.
  function sampleBadge(edge) {
    var p = edge.paper || {};
    if (p.n_kind === 'participants' && p.n_label) {
      return '<span class="hx-n" title="' + esc(t('nParticipants') + ' ' + String(p.n)) + '">n=' +
        esc(p.n_label) + '</span>';
    }
    if (p.n_kind === 'studies' && p.n_label) {
      return '<span class="hx-n" title="' + esc(t('nStudies') + ' ' + String(p.n)) + '">k=' +
        esc(p.n_label) + '</span>';
    }
    return '<span class="hx-n hx-n-unknown" title="' + esc(t('nUnknown')) + '">n=?</span>';
  }

  function leafRow(edge, label, extraClass) {
    return '<li><button class="hx-leaf' + (extraClass ? ' ' + extraClass : '') +
      '" data-edge="' + esc(edgeKey(edge)) + '">' +
      useBadge(edge) + dirMark(edge.direction, edge) +
      '<span class="hx-leaf-name">' + esc(label) + '</span>' +
      effectBadge(edge) + tierBadge(edge.evidence_tier, edge) + sampleBadge(edge) +
      unsupportedBadge(edge) +
      (edge.conditional_on ? '<span class="hx-cond" title="' + esc(trEdge(edge, 'conditional_on')) +
        '">' + t('only') + esc(clip(trEdge(edge, 'conditional_on'), 130)) + '</span>' : '') +
      '</button></li>';
  }

  /* ---------- full trees ---------- */

  function renderAllGoals() {
    var out = '';
    var shown = 0;

    state.data.nodes.goals.forEach(function (goal) {
      var markers = markersForGoal(goal.id);
      var sections = '';
      var goalHit = matchesNode(goal, ['definition']);
      var rowsShown = 0;

      markers.forEach(function (marker) {
        var edges = edgesForMarker(marker.id).slice().sort(sortEdges);
        var rows = '';
        edges.forEach(function (e) {
          var b = byId(state.data.nodes.behaviors, e.behavior_id);
          var name = b ? tr(b, 'name') : e.behavior_id;
          if (goalHit || matchesNode(marker, ['unit']) || matchesNode(b, ['dose_or_intensity'])) {
            rows += leafRow(e, name);
            rowsShown++;
          }
        });
        if (!rows) return;
        sections += '<li class="hx-branch"><div class="hx-marker">' +
          '<span class="hx-marker-name">' + esc(tr(marker, 'name')) + '</span>' +
          (marker.unit ? '<span class="hx-unit">' + esc(tr(marker, 'unit')) + '</span>' : '') +
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
        '<span class="hx-goalname">' + esc(tr(goal, 'name')) + '</span>' +
        '<span class="hx-tally">' + markers.length + ' ' + t('markersShort') + ' &middot; ' + rowsShown +
        ' ' + t('rows') + ' &middot; ' + Object.keys(papers).length + ' ' + t('papersShort') + '</span>' +
        '<span class="hx-goaldef">' + esc(tr(goal, 'definition')) + '</span>' +
        '</summary><ul class="hx-branches">' + sections + '</ul></details>';
    });

    return out || '<p class="hx-empty">' + t('noMatch') + '</p>';
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
      var hit = matchesNode(bh, ['dose_or_intensity']) || edgesForBehavior(bh.id).some(function (e) {
        var m = byId(state.data.nodes.markers, e.marker_id);
        if (!m) return false;
        if (matchesNode(m, ['unit'])) return true;
        return (m.goal_ids || []).some(function (gid) {
          return matchesNode(byId(state.data.nodes.goals, gid), ['definition']);
        });
      });
      if (hit) groupCounts[bh.group] = (groupCounts[bh.group] || 0) + 1;
    });

    var lastGroup = null;

    behaviors.forEach(function (bh) {
      var edges = edgesForBehavior(bh.id).slice().sort(sortEdges);
      if (!edges.length) return;
      var behaviorHit = matchesNode(bh, ['dose_or_intensity']);
      var sections = '';

      edges.forEach(function (e) {
        var marker = byId(state.data.nodes.markers, e.marker_id);
        var mname = marker ? tr(marker, 'name') : e.marker_id;
        var goalIds = ((marker && marker.goal_ids) || []).slice();
        var rank = {};
        state.data.nodes.goals.forEach(function (g, i) { rank[g.id] = i; });
        goalIds.sort(function (a, b) {
          return (rank[a] !== undefined ? rank[a] : 99) - (rank[b] !== undefined ? rank[b] : 99);
        });
        var goalNames = goalIds.map(function (gid) {
          var g = byId(state.data.nodes.goals, gid);
          return g ? tr(g, 'name') : gid;
        });

        if (!(behaviorHit || matchesNode(marker, ['unit']) ||
            goalIds.some(function (gid) { return matchesNode(byId(state.data.nodes.goals, gid), ['definition']); }))) return;

        var rows = '';
        goalNames.forEach(function (gn) {
          rows += leafRow(e, gn, 'hx-leaf-goal');
        });
        if (!rows) rows = '<li class="hx-empty">' + t('notWired') + '</li>';

        sections += '<li class="hx-branch"><div class="hx-marker">' +
          dirMark(e.direction, e) +
          '<span class="hx-marker-name">' + esc(mname) + '</span>' +
          (marker && marker.unit ? '<span class="hx-unit">' + esc(tr(marker, 'unit')) + '</span>' : '') +
          effectBadge(e) + tierBadge(e.evidence_tier, e) + sampleBadge(e) +
          (e.conditional_on ? '<span class="hx-cond" title="' + esc(trEdge(e, 'conditional_on')) +
            '">' + t('only') + esc(clip(trEdge(e, 'conditional_on'), 130)) + '</span>' : '') +
          '</div><ul class="hx-leaves">' + rows + '</ul></li>';
      });

      if (!sections) return;

      if (bh.group !== lastGroup) {
        lastGroup = bh.group;
        out += '<h4 class="hx-group">' + esc(groupLabel(bh)) +
          '<span class="hx-tally">' + (groupCounts[bh.group] || 0) + '</span></h4>';
      }

      // The goal count that used to sit here belonged to the whole behaviour FAMILY, not
      // to this row: "x13 goals" appeared beside acute aerobic exercise, which reaches
      // one. Only the tooltip said whose 13 it was, so the badge misread far more often
      // than it informed.
      out += '<details class="hx-section"' + (state.filter ? ' open' : '') +
        '><summary class="hx-goalbar">' +
        '<span class="hx-goalname">' + esc(tr(bh, 'name')) + '</span>' +
        '<span class="hx-tally">' + edges.length + ' ' + t('markersShort') + '</span>' +
        '<span class="hx-goaldef">' + esc(tr(bh, 'dose_or_intensity')) + '</span>' +
        '</summary><ul class="hx-branches">' + sections + '</ul></details>';
    });

    return out || '<p class="hx-empty">' + t('noMatch') + '</p>';
  }

  /* ---------- evidence panel ---------- */

  function renderPanel(edge) {
    if (!edge) {
      return '<div class="hx-panel-empty"><p><strong>' + t('clickRow') + '</strong>' +
        t('clickRest') + '</p></div>';
    }

    var b = byId(state.data.nodes.behaviors, edge.behavior_id);
    var m = byId(state.data.nodes.markers, edge.marker_id);
    var p = edge.paper || {};
    var doiUrl = p.doi ? ('https://doi.org/' + String(p.doi).replace(/^https?:\/\/doi\.org\//, '')) : null;

    var h = '<div class="hx-panel-head"><span class="hx-panel-edge">' +
      esc(b ? tr(b, 'name') : edge.behavior_id) + ' ' + dirMark(edge.direction, edge) + ' ' +
      esc(m ? tr(m, 'name') : edge.marker_id) + '</span></div>';

    h += '<dl class="hx-facts">';
    if (edge.effect) {
      h += '<dt>' + t('effectReported') + '</dt><dd>' +
        withOriginal(trEdge(edge, 'effect') || edge.effect, edge.effect) + '</dd>';
    }
    if (edge.effect_normalized !== undefined && edge.effect_normalized !== null && edge.effect_normalized !== '') {
      h += '<dt>' + t('normalised') + '</dt><dd>' + esc(edge.effect_normalized) +
        (edge.normalization_method ? ' <span class="hx-muted">(' + esc(edge.normalization_method) + ')</span>' : '') +
        '</dd>';
    }
    if (edge.usefulness) {
      h += '<dt>' + t('usefulness') + '</dt><dd>' + useBadge(edge) + ' ' +
        (edge.usefulness.tier === 'NULL'
          ? t('notRanked')
          : t('score') + esc(edge.usefulness.score)) +
        '<ul class="hx-why">' +
        (edge.usefulness.why || []).map(function (w) { return '<li>' + esc(trWhy(w)) + '</li>'; }).join('') +
        '</ul></dd>';
    }
    h += '<dt>' + t('evidence') + '</dt><dd>' + tierBadge(edge.evidence_tier, edge) + ' ' +
      esc(tierLabel(edge.evidence_tier)) +
      (p.design ? ' <span class="hx-muted">&middot; ' + esc(trDesign(p.design)) + '</span>' : '') +
      (p.n ? ' <span class="hx-muted">&middot; n = ' + esc(p.n) + '</span>' : '') + '</dd>';
    if (edge.population) h += '<dt>' + t('population') + '</dt><dd>' + withOriginal(trEdge(edge, 'population'), edge.population) + '</dd>';
    if (edge.conditional_on) h += '<dt>' + t('conditional') + '</dt><dd class="hx-cond-strong">' + withOriginal(trEdge(edge, 'conditional_on'), edge.conditional_on) + '</dd>';
    h += '</dl>';

    if (edge.verbatim) {
      h += '<h5 class="hx-subhead">' + t('resultSentence') + '</h5>' +
        (t('quoteEnglishNote') ? '<p class="hx-quotenote">' + t('quoteEnglishNote') + '</p>' : '') +
        '<blockquote class="hx-verbatim">' + esc(edge.verbatim) + '</blockquote>';
    }

    if (edge.quote_note) {
      h += '<p class="hx-warnbox"><strong>' + t('provHead') + '</strong> ' +
        esc(trEdge(edge, 'quote_note')) +
        (edge.verified_note_source ? ' <span class="hx-muted">(' + t('byVerification') + ')</span>' : '') +
        '</p>';
    } else if (edge.quote_elided) {
      h += '<p class="hx-warnbox"><strong>' + t('elidedHead') + '</strong> ' +
        t('elidedBody') + '</p>';
    } else if (edge.quote_spliced) {
      // 28 rows reach here. The badge on the row said so; the study panel said nothing,
      // which is the one place a reader has stopped to look closely.
      h += '<p class="hx-warnbox"><strong>' + t('splicedHead') + '</strong> ' +
        (edge.quote_check_kind === 'unmatched' ? t('quoteUnmatched')
         : edge.quote_check_kind === 'no_numbers' ? t('quoteNoNumbers')
         : t('quoteSpliced')) + ' ' + t('splicedTail') + '</p>';
    } else if (edge.quote_beyond_abstract) {
      h += '<p class="hx-note"><strong>' + t('beyondHead') + '</strong> ' +
        t('quoteBeyond') + '</p>';
    }

    if (edge.coi_note) {
      h += '<p class="hx-warnbox"><strong>' + t('coiHead') + '</strong> ' + esc(trEdge(edge, 'coi_note')) + '</p>';
    }

    if (edge.review_note) {
      h += '<p class="hx-warnbox hx-warnbox-hot"><strong>' + t('reviewHead') + '</strong> ' +
        esc(trEdge(edge, 'review_note')) + ' <span class="hx-muted">(' + t('independentReview') + ')</span></p>';
    }

    if (edge.paper_notices && edge.paper_notices.length) {
      h += '<p class="hx-warnbox' + (edge.paper_notice_serious ? ' hx-warnbox-hot' : '') +
        '"><strong>' + t('noticeHead') + '</strong> ' + t('noticeBody') +
        (edge.paper_notice_detail ? ' ' + esc(edge.paper_notice_detail) : '') + '</p>';
    }

    if (edge.tier_corrected_from) {
      h += '<p class="hx-fixbox"><strong>' + t('tierFixHead') + ' ' +
        esc(edge.tier_corrected_from) + ' ' + t('nFixTo') + ' ' + esc(edge.evidence_tier) + '.</strong> ' +
        esc(trEdge(edge, 'tier_note') || '') +
        ' <span class="hx-muted">(' + t('byVerification') + ')</span></p>';
    }

    // A corrected badge says nothing unless it says what it used to say. Both the old
    // figure and the reason are shown, because a reader who saw the earlier number
    // deserves to know it changed rather than finding a different one quietly in place.
    if (edge.n_corrected_from) {
      h += '<p class="hx-fixbox"><strong>' + t('nFixHead') + ' ' +
        esc(edge.n_corrected_from) + ' ' + t('nFixTo') + ' ' +
        esc((edge.paper && edge.paper.n_label) || '') + '.</strong> ' +
        esc(trEdge(edge, 'review_note') || '') +
        ' <span class="hx-muted">(' + t('byVerification') + ')</span></p>';
    }

    if (edge.unsupported_numbers && edge.unsupported_numbers.length) {
      h += '<p class="hx-warnbox"><strong>' + t('figHead') + '</strong> ' +
        esc(edge.unsupported_numbers.join(', ')) + ' ' + t('figBody') + '</p>';
    }

    var extra = paperExtras(p.doi);

    var passage = edge.key_results || (extra && extra.results_passage);
    if (passage) {
      h += '<h5 class="hx-subhead">' + t('fromPaper') + '</h5>' +
        '<p class="hx-passage">' + esc(passage) + '</p>';
    }

    var figures = (extra && extra.figures) || [];
    if (figures.length) {
      h += '<h5 class="hx-subhead">' + t('figures') + '</h5>';
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
        esc(t('fullText')) + '</a>' + (extra.license ? ' <span class="hx-muted">&middot; ' + esc(extra.license) + '</span>' : '') +
        '</p>';
    }
    if (edge.caveats) h += '<p class="hx-caveat"><strong>' + t('caveats') + '</strong> ' + withOriginal(trEdge(edge, 'caveats'), edge.caveats) + '</p>';

    var goals = ((m && m.goal_ids) || []).map(function (gid) {
      var g = byId(state.data.nodes.goals, gid);
      return g ? tr(g, 'name') : gid;
    });
    h += '<div class="hx-jump"><span class="hx-jump-label">' + t('jumpLabel') + '</span>' +
      '<button class="hx-jumpbtn" data-jump="behavior" data-q="' +
      esc(b ? b.name : edge.behavior_id) + '">' + t('jumpBehavior') + '</button>';
    goals.forEach(function (name) {
      h += '<button class="hx-jumpbtn" data-jump="goal" data-q="' + esc(name) + '">' +
        esc(name) + '</button>';
    });
    h += '</div>';

    return h;
  }

  /* ---------- wiring ---------- */

  // showModal brings Escape, focus trapping and an inert background with it; the fallback
  // keeps the detail reachable if <dialog> is unsupported.
  function openPanel() {
    el.panel.innerHTML = renderPanel(state.selectedEdge);
    if (!el.modal) return;
    if (typeof el.modal.showModal === 'function') {
      if (!el.modal.open) el.modal.showModal();
    } else {
      el.modal.setAttribute('open', '');
    }
    el.panel.scrollTop = 0;
  }

  function closePanel() {
    if (!el.modal) return;
    if (typeof el.modal.close === 'function') el.modal.close();
    else el.modal.removeAttribute('open');
  }

  // Chrome that lives in the markup rather than in a render function.
  function applyChrome() {
    var m = el.root.querySelectorAll('.hx-mode');
    if (m[0]) m[0].textContent = t('byGoal');
    if (m[1]) m[1].textContent = t('byBehavior');
    var filt = document.getElementById('hx-filter');
    if (filt) filt.setAttribute('placeholder', t('filter'));
    var tog = el.root.querySelectorAll('.hx-toggle');
    if (tog[0]) tog[0].textContent = t('expandAll');
    if (tog[1]) tog[1].textContent = t('collapseAll');
    var close = document.getElementById('hx-close');
    if (close) close.setAttribute('aria-label', t('close'));
    var title = document.getElementById('hx-shell-title');
    if (title) title.textContent = t('shellTitle');
    var legend = document.getElementById('hx-legend-label');
    if (legend) legend.textContent = t('legend');
    Array.prototype.forEach.call(document.querySelectorAll('.hx-legend-body, .hx-langbody'), function (node) {
      node.hidden = node.getAttribute('data-lang') !== state.lang;
    });
    document.documentElement.setAttribute('data-hx-lang', state.lang);
  }

  // The translation file is fetched once, on first switch, so English readers never pay
  // for it. A failed fetch leaves the English text in place rather than blanking the page.
  function setLang(lang) {
    if (lang === state.lang) return;
    var apply = function () {
      state.lang = lang;
      try { localStorage.setItem(LANG_KEY, lang); } catch (err) { /* private mode */ }
      Array.prototype.forEach.call(document.querySelectorAll('.hx-lang'), function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-lang') === lang);
      });
      applyChrome();
      renderCounts(state.data);
      var lev = document.getElementById('hx-leverage');
      if (lev) lev.innerHTML = '';
      renderLeverage(state.data);
      renderTierChart(state.data);
      renderGlossary();
      renderCutList(state.data);
      render();
      if (state.selectedEdge && el.modal && el.modal.open) openPanel();
    };
    if (lang === 'en' || state.i18n) { apply(); return; }
    fetch('/data/health-evidence.zh-TW.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) { state.i18n = json; apply(); })
      .catch(function () { apply(); });
  }

  // Jump from a row to the same subject seen from the other side.
  //
  // The graph has always been walkable both ways, but only from the top: you picked a mode
  // and started over. From inside a study you now cross directly - a behaviour row carries
  // you to the goals it feeds, a goal row to everything else that behaviour touches - with
  // the filter pre-set and the matching section already open, so the thing you were reading
  // about is on screen rather than somewhere in a list of fourteen.
  function jumpTo(mode, filterText) {
    state.mode = mode;
    state.filter = (filterText || '').trim().toLowerCase();
    var box = document.getElementById('hx-filter');
    if (box) box.value = filterText || '';
    closePanel();
    render();
    Array.prototype.forEach.call(el.root.querySelectorAll('.hx-section'), function (d) {
      d.open = true;
    });
    var shell = document.getElementById('hx-shell-scroll') || el.tree;
    if (shell && shell.scrollTo) shell.scrollTo({ top: 0, behavior: 'smooth' });
    else if (el.tree && el.tree.scrollIntoView) el.tree.scrollIntoView({ block: 'nearest' });
  }

  function render() {
    el.tree.innerHTML = state.mode === 'goal' ? renderAllGoals() : renderAllBehaviors();
    Array.prototype.forEach.call(el.root.querySelectorAll('.hx-mode'), function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-mode') === state.mode);
    });
  }

  function bind() {
    var head = document.querySelector('.hx-shell-head');
    if (head) {
      head.addEventListener('click', function (ev) {
        var lang = ev.target.closest && ev.target.closest('.hx-lang');
        if (lang) setLang(lang.getAttribute('data-lang'));
      });
    }

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

      var jump = ev.target.closest && ev.target.closest('.hx-jumpbtn');
      if (jump) {
        jumpTo(jump.getAttribute('data-jump'), jump.getAttribute('data-q'));
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
        openPanel();
        if (window.matchMedia('(max-width: 820px)').matches) {
          el.panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    // The chart lives outside #hx-explorer, so its controls never reach a listener
    // delegated from there - the sliders needed this, and so does the reset button.
    document.addEventListener('click', function (ev) {
      var reset = ev.target.closest && ev.target.closest('#hx-zoom-reset');
      if (reset) resetZoom();
    });

    document.addEventListener('input', function (ev) {
      var id = ev.target && ev.target.id;
      if (id !== 'hx-axis-n' && id !== 'hx-zoom-x' && id !== 'hx-zoom-y') return;
      var v = parseInt(ev.target.value, 10);
      if (id === 'hx-axis-n') state.labelCount = isNaN(v) ? 0 : v;
      if (id === 'hx-zoom-x') state.zoomX = isNaN(v) ? 100 : v;
      if (id === 'hx-zoom-y') state.zoomY = isNaN(v) ? 100 : v;
      // Redraw the chart only. Re-rendering the whole box replaced the slider mid-drag,
      // which detached the element the pointer was holding and stopped the drag dead.
      var readout = ev.target.parentNode.querySelector('.hx-axisn');
      if (readout) readout.textContent = id === 'hx-axis-n' ? state.labelCount : v + '%';
      // The chart-only redraw leaves the control row alone, so this button's state has to
      // be updated by hand - it stayed disabled after a zoom and swallowed the click.
      var reset = document.getElementById('hx-zoom-reset');
      if (reset) reset.disabled = state.zoomX === 100 && state.zoomY === 100;
      redrawScatter();
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
      '<span class="hx-cutsum-label">' + t('cut') + '</span>' +
      '<span class="hx-tally">' + data.cut.length + '</span></summary>' +
      '<ul class="hx-cutlist">';
    var zhCut = (state.lang !== 'en' && state.i18n && state.i18n.cut) || [];
    data.cut.forEach(function (c, i) {
      var loc = zhCut[i] || {};
      var what = loc.label || c.label || c.candidate || ((c.behavior || '') + (c.marker ? ' -> ' + c.marker : ''));
      h += '<li><span class="hx-cut-what">' + esc(what) + '</span>' +
        '<span class="hx-cut-why">' + esc(loc.reason || c.reason || '') + '</span></li>';
    });
    host.innerHTML = h + '</ul></details>';
  }

  // Weight against breadth, for every behaviour family at once.
  //
  // x sums each row's usefulness score, added when the finding was favourable and
  // subtracted when it was not, so a meta-analysis moves the total far more than a
  // cross-sectional study. y counts distinct markers. Broad benefit lands right, broad harm
  // left, and a family whose good and bad rows cancel sits near zero with a high marker
  // count - contested rather than quietly averaged.
  //
  // Two drawing decisions. The x scale is a signed square root, because exercise reaches
  // +99 while most families sit between -10 and +10 and a linear axis flattened them into a
  // stripe. And the names live in gutters either side, joined to their dot by a leader
  // line: most of the dots crowd near the origin, so a label placed beside its dot either
  // covers a neighbour or gets dropped. A column of names sorted by height reads cleanly no
  // matter how dense the middle gets.
  function renderLeverage(data) {
    var host = document.getElementById('hx-leverage');
    if (!host) return;

    var fams = {};
    data.edges.forEach(function (e) {
      var b = byId(data.nodes.behaviors, e.behavior_id) || {};
      var key = b.family || e.behavior_id;
      if (!fams[key]) {
        fams[key] = { label: famLabel(b) || e.behavior_id,
                      net: 0, markers: {}, goals: {}, papers: {},
                      rows: 0, good: 0, bad: 0, nulls: 0 };
      }
      var f = fams[key];
      f.rows++;
      f.markers[e.marker_id] = true;
      var mk = byId(data.nodes.markers, e.marker_id);
      ((mk && mk.goal_ids) || []).forEach(function (g) { f.goals[g] = true; });
      var doi = (e.paper || {}).doi;
      if (doi) f.papers[doi] = true;
      var u = e.usefulness || {};
      var score = typeof u.score === 'number' ? u.score : 0;
      if (e.valence === 'good') { f.net += score; f.good++; }
      else if (e.valence === 'bad') { f.net -= score; f.bad++; }
      else if (e.valence === 'none') { f.nulls++; }
    });

    var pts = Object.keys(fams).map(function (k) {
      var f = fams[k];
      var scored = f.good + f.bad;
      return { label: f.label, net: Math.round(f.net * 10) / 10,
               markers: Object.keys(f.markers).length,
               goals: Object.keys(f.goals).length,
               papers: Object.keys(f.papers).length,
               goodRate: scored ? Math.round(f.good / scored * 100) : 0,
               rows: f.rows, good: f.good, bad: f.bad, nulls: f.nulls };
    });
    if (!pts.length) { host.innerHTML = ''; return; }

    var W = 1000, H = 470, GL = 150, GR = 150, T = 34, B = 52;
    var PL = GL, PR = W - GR;
    // The axes mean one thing and keep meaning it. Letting a reader swap the metrics made
    // the quadrants meaningless half the time - "goals reached" has no negative side, so
    // there was nothing for the favourable and unfavourable halves to divide.
    var fullX = Math.max.apply(null, pts.map(function (p) { return Math.abs(p.net); })) || 1;
    var fullY = Math.max.apply(null, pts.map(function (p) { return p.markers; })) || 1;

    // Zooming crops the domain rather than rescaling everything into it. One family reaches
    // +99 and drags the axis with it; pulling the range in lets the crowd near zero spread
    // out, and whatever falls outside is counted underneath instead of being quietly
    // dropped or piled against the edge.
    var xMax = Math.max(3, fullX * (state.zoomX / 100));
    var yMax = Math.max(2, Math.ceil(fullY * (state.zoomY / 100)));
    var offscale = pts.filter(function (p) {
      return Math.abs(p.net) > xMax + 0.001 || p.markers > yMax;
    });
    var shown = pts.filter(function (p) { return offscale.indexOf(p) === -1; });
    if (!shown.length) { shown = pts; offscale = []; }

    var sq = function (v) { return (v < 0 ? -1 : 1) * Math.sqrt(Math.abs(v)); };
    var sqMax = sq(xMax) || 1;
    var x = function (n) { return PL + (sq(n) + sqMax) / (2 * sqMax) * (PR - PL); };
    var y = function (m) { return (H - B) - (m / yMax) * (H - B - T); };
    var zeroX = x(0);
    var rad = function (rows) { return Math.max(2.8, Math.min(9, 2 + Math.sqrt(rows) * 1.35)); };

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" class="hx-scatter" ' +
      'aria-label="' + esc(t('scatterAria')) + '">';

    svg += '<rect class="hx-quad hx-quad-good" x="' + zeroX + '" y="' + T +
      '" width="' + (PR - zeroX) + '" height="' + (H - B - T) + '"/>';
    svg += '<rect class="hx-quad hx-quad-bad" x="' + PL + '" y="' + T +
      '" width="' + (zeroX - PL) + '" height="' + (H - B - T) + '"/>';
    svg += '<text class="hx-quadlabel" x="' + (PR - 8) + '" y="' + (T - 12) + '">' +
      esc(t('quadGood')) + '</text>';
    svg += '<text class="hx-quadlabel hx-anchor-start" x="' + (PL + 8) + '" y="' + (T - 12) + '">' +
      esc(t('quadBad')) + '</text>';

    svg += '<line class="hx-ax" x1="' + zeroX + '" y1="' + T + '" x2="' + zeroX + '" y2="' + (H - B) + '"/>';
    svg += '<line class="hx-ax" x1="' + PL + '" y1="' + (H - B) + '" x2="' + PR + '" y2="' + (H - B) + '"/>';

    var ticks = [-xMax, -25, -10, 0, 10, 25, xMax].filter(function (v, i, a) {
      return Math.abs(v) <= xMax && a.indexOf(v) === i;
    }).map(function (v) { return Math.round(v * 10) / 10; });
    ticks.forEach(function (v) {
      svg += '<line class="hx-gridline" x1="' + x(v) + '" y1="' + T + '" x2="' + x(v) + '" y2="' + (H - B) + '"/>';
      svg += '<text class="hx-tick" x="' + x(v) + '" y="' + (H - B + 17) + '">' +
        (v > 0 ? '+' : '') + Math.round(v) + '</text>';
    });
    svg += '<text class="hx-axlabel" x="' + ((PL + PR) / 2) + '" y="' + (H - 10) + '">' +
      esc(t('axisNet')) + '</text>';
    [0, Math.round(yMax / 2), yMax].forEach(function (v) {
      svg += '<text class="hx-tick hx-anchor-end" x="' + (PL - 9) + '" y="' + (y(v) + 4) + '">' + v + '</text>';
    });

    shown.forEach(function (p) {
      p.cx = x(p.net); p.cy = y(p.markers); p.r = rad(p.rows);
      p.cls = p.net > 1 ? 'hx-pt-good' : (p.net < -1 ? 'hx-pt-bad' : 'hx-pt-flat');
      p.weight = Math.abs(p.net) + p.markers * 1.5;
    });

    shown.forEach(function (p) {
      svg += '<circle class="hx-pt ' + p.cls + '" cx="' + p.cx + '" cy="' + p.cy + '" r="' + p.r + '">' +
        '<title>' + esc(p.label) + ': ' + esc(t('scatterNet')) + ' ' + (p.net > 0 ? '+' : '') + p.net +
        ', ' + p.markers + ' ' + esc(t('markersShort')) + ', ' + p.rows + ' ' + esc(t('rows')) +
        ' (' + p.good + ' ' + esc(t('favourable')) + ', ' + p.bad + ' ' + esc(t('unfavourable')) +
        (p.nulls ? ', ' + p.nulls + ' ' + esc(t('nullShort')) : '') + ')</title></circle>';
    });

    // Each side gets as many names as fit at a fixed line height, strongest first.
    // 15px lines: the text box is a little taller than the glyphs, and at 13 the boxes of
    // adjacent names touched even though the letters did not.
    var slot = 15, top = T + 4, bottom = H - B - 4;
    // Eight a side. Forty leader lines turned the chart into a spider web, and the names
    // that mattered were no easier to find than the ones that did not. Everything else
    // still answers on hover.
    var capacity = Math.min(state.labelCount, Math.floor((bottom - top) / slot));
    var ranked = shown.slice().sort(function (a, b) { return b.weight - a.weight; });
    var left = [], right = [];
    ranked.forEach(function (p) {
      var side = p.cx < (PL + PR) / 2 ? left : right;
      if (side.length < capacity) side.push(p);
    });

    // Sort by height, then push apart so no two names share a line.
    var layout = function (list) {
      list.sort(function (a, b) { return a.cy - b.cy; });
      list.forEach(function (p, i) { p.ly = Math.max(top + i * slot, p.cy); });
      for (var i = list.length - 1; i > 0; i--) {
        if (list[i].ly > bottom - (list.length - 1 - i) * slot) {
          list[i].ly = bottom - (list.length - 1 - i) * slot;
        }
        if (list[i].ly - list[i - 1].ly < slot) list[i - 1].ly = list[i].ly - slot;
      }
      return list;
    };

    layout(left).forEach(function (p) {
      svg += '<polyline class="hx-leader" points="' + (GL - 8) + ',' + p.ly + ' ' +
        (GL - 2) + ',' + p.ly + ' ' + (p.cx - p.r - 2) + ',' + p.cy + '"/>';
      svg += '<text class="hx-gutlabel hx-anchor-end" x="' + (GL - 12) + '" y="' + (p.ly + 3.5) + '">' +
        esc(clip(p.label, 22)) + '</text>';
    });
    layout(right).forEach(function (p) {
      svg += '<polyline class="hx-leader" points="' + (PR + 8) + ',' + p.ly + ' ' +
        (PR + 2) + ',' + p.ly + ' ' + (p.cx + p.r + 2) + ',' + p.cy + '"/>';
      svg += '<text class="hx-gutlabel hx-anchor-start" x="' + (PR + 12) + '" y="' + (p.ly + 3.5) + '">' +
        esc(clip(p.label, 22)) + '</text>';
    });

    svg += '<text class="hx-axlabel" transform="translate(16,' + ((T + H - B) / 2) +
      ') rotate(-90)">' + esc(t('axisMarkers')) + '</text>';
    if (offscale.length) {
      svg += '<text class="hx-offscale" x="' + PR + '" y="' + (H - B + 34) + '">' +
        offscale.length + ' ' + esc(t('offScale')) + ': ' +
        esc(offscale.slice(0, 3).map(function (p) { return p.label; }).join(', ')) +
        (offscale.length > 3 ? '\u2026' : '') + '</text>';
    }
    svg += '</svg>';

    var byNet = pts.slice().sort(function (a, b) { return b.net - a.net; });
    var best = byNet[0], worst = byNet[byNet.length - 1];
    var summary = esc(best.label) + ' ' + (best.net > 0 ? '+' : '') + best.net +
      ' \u00b7 ' + esc(worst.label) + ' ' + worst.net;

    var existing = host.querySelector('.hx-scatterhost');
    if (existing) {
      // Chart-only redraw: the slider the pointer is on stays exactly where it is.
      existing.innerHTML = svg;
      return;
    }

    host.innerHTML = '<details class="hx-cutbox" open><summary class="hx-cutsum">' +
      '<span class="hx-cutsum-label">' + t('reach') + '</span>' +
      '<span class="hx-lev-top">' + summary + '</span>' +
      '<span class="hx-tally">' + pts.length + '</span></summary>' +
      '<div class="hx-scatterwrap">' +
      '<div class="hx-axisbar">' +
        '<label class="hx-axisrange">' + t('zoomXLabel') +
          ' <input id="hx-zoom-x" type="range" min="5" max="100" step="5" value="' + state.zoomX + '">' +
          '<span class="hx-axisn">' + state.zoomX + '%</span></label>' +
        '<label class="hx-axisrange">' + t('zoomYLabel') +
          ' <input id="hx-zoom-y" type="range" min="20" max="100" step="5" value="' + state.zoomY + '">' +
          '<span class="hx-axisn">' + state.zoomY + '%</span></label>' +
        '<label class="hx-axisrange">' + t('axisLabels') +
          ' <input id="hx-axis-n" type="range" min="0" max="20" step="1" value="' + state.labelCount + '">' +
          '<span class="hx-axisn">' + state.labelCount + '</span></label>' +
        '<button class="hx-toggle hx-zoomreset" id="hx-zoom-reset"' +
          (state.zoomX === 100 && state.zoomY === 100 ? ' disabled' : '') + '>' +
          t('resetZoom') + '</button>' +
      '</div>' +
      '<div class="hx-scatterhost">' + svg + '</div>' +
      '<p class="hx-scatternote">' + t('scatterNote') + '</p></div></details>';
  }

  var TIER_ORDER = ['S', 'A', 'B', 'C', 'D', 'E', 'NULL'];

  // How the 320 rows fall across the usefulness tiers.
  //
  // The tier is a derived sort key, and a reader has no way to tell whether an "A" is one
  // row in twenty or one in three until the shape of the whole is in front of them. Bars
  // run horizontally because seven labelled categories read better down the side than
  // crushed under an x-axis, and because the counts span 10 to 96 - the disparity is the
  // point. Clicking a bar opens the rows it counts, so the number is never a dead end.
  function renderTierChart(data) {
    var host = document.getElementById('hx-tiers');
    if (!host) return;

    var buckets = {};
    TIER_ORDER.forEach(function (k) { buckets[k] = []; });
    data.edges.forEach(function (e) {
      var tier = (e.usefulness && e.usefulness.tier) || 'NULL';
      (buckets[tier] || (buckets[tier] = [])).push(e);
    });

    var max = 0;
    TIER_ORDER.forEach(function (k) { max = Math.max(max, buckets[k].length); });
    if (!max) { host.innerHTML = ''; return; }

    var bars = '';
    TIER_ORDER.forEach(function (tier) {
      var rows = buckets[tier];
      var open = state.openTier === tier;
      var pct = (rows.length / max) * 100;
      bars += '<button class="hx-tierrow' + (open ? ' is-open' : '') + '" data-tier="' +
        esc(tier) + '" aria-expanded="' + (open ? 'true' : 'false') + '" title="' +
        esc(tierLabel(tier)) + '">' +
        '<span class="hx-use hx-use-' + esc(tier) + '">' +
        (tier === 'NULL' ? '\u2013' : esc(tier)) + '</span>' +
        '<span class="hx-tierbar hx-use-' + esc(tier) + '" style="width:' +
        Math.max(pct, 0.6) + '%"></span>' +
        '<span class="hx-tiern">' + rows.length + '</span>' +
        '</button>';
      if (open) {
        bars += '<ul class="hx-tierlist">' + rows.map(function (e) {
          return leafRow(e, tierRowLabel(e));
        }).join('') + '</ul>';
      }
    });

    var openRows = state.openTier ? (buckets[state.openTier] || []).length : 0;
    host.innerHTML = '<details class="hx-cutbox" open><summary class="hx-cutsum">' +
      '<span class="hx-cutsum-label">' + t('tierMix') + '</span>' +
      '<span class="hx-lev-top">' + (state.openTier
        ? esc(state.openTier) + ' \u00b7 ' + openRows + ' ' + esc(t('rows'))
        : esc(t('tierHint'))) + '</span>' +
      '<span class="hx-tally">' + data.edges.length + '</span></summary>' +
      '<div class="hx-scatterwrap"><div class="hx-tierchart">' + bars + '</div>' +
      '<p class="hx-tiernote">' + t('tierNote') + '</p></div></details>';
  }

  // "behaviour -> marker", which is what identifies a row once it is out of its tree.
  function tierRowLabel(edge) {
    var b = byId(state.data.nodes.behaviors, edge.behavior_id);
    var m = byId(state.data.nodes.markers, edge.marker_id);
    return (b ? tr(b, 'name') : edge.behavior_id) + ' \u2192 ' +
           (m ? tr(m, 'name') : edge.marker_id);
  }

  // Redraw the plot in place, leaving the controls untouched.
  function redrawScatter() {
    if (state.data) renderLeverage(state.data);
  }

  function redrawTiers() {
    if (state.data) renderTierChart(state.data);
  }

  document.addEventListener('click', function (ev) {
    if (!ev.target.closest) return;
    var host = ev.target.closest('#hx-tiers');
    if (!host) return;

    var row = ev.target.closest('.hx-tierrow');
    if (row) {
      var tier = row.getAttribute('data-tier');
      state.openTier = state.openTier === tier ? null : tier;
      redrawTiers();
      return;
    }

    // A row revealed under a bar opens the same study panel the tree opens, so the chart
    // is a way into the evidence rather than a separate read-only view.
    var leaf = ev.target.closest('.hx-leaf');
    if (leaf) {
      var key = leaf.getAttribute('data-edge');
      for (var i = 0; i < state.data.edges.length; i++) {
        if (edgeKey(state.data.edges[i]) === key) {
          state.selectedEdge = state.data.edges[i];
          break;
        }
      }
      Array.prototype.forEach.call(host.querySelectorAll('.hx-leaf'), function (x) {
        x.classList.remove('is-selected');
      });
      leaf.classList.add('is-selected');
      openPanel();
    }
  });

  // Full rebuild, so the sliders snap back to 100 rather than keeping stale positions.
  function resetZoom() {
    state.zoomX = 100;
    state.zoomY = 100;
    var host = document.getElementById('hx-leverage');
    if (host) host.innerHTML = '';
    redrawScatter();
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
      '<span><strong>' + data.nodes.goals.length + '</strong> ' + t('goals') + '</span>' +
      '<span><strong>' + data.nodes.markers.length + '</strong> ' + t('markers') + '</span>' +
      '<span><strong>' + data.nodes.behaviors.length + '</strong> ' + t('behaviors') + '</span>' +
      '<span><strong>' + data.edges.length + '</strong> ' + t('edges') + '</span>' +
      '<span><strong>' + Object.keys(papers).length + '</strong> ' + t('papers') + '</span>' +
      '<span><strong>' + nulls + '</strong> ' + t('nulls') + '</span>' +
      '<span><strong>' + data.cut.length + '</strong> ' + t('cutN') + '</span>';
  }

  function init() {
    el.root = document.getElementById('hx-explorer');
    if (!el.root) return;
    el.tree = document.getElementById('hx-tree');
    el.panel = document.getElementById('hx-panel');
    el.modal = document.getElementById('hx-modal');

    var closeBtn = document.getElementById('hx-close');
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    // A backdrop click lands on the dialog element itself, never on its contents.
    if (el.modal) {
      el.modal.addEventListener('click', function (ev) {
        var jump = ev.target.closest && ev.target.closest('.hx-jumpbtn');
        if (jump) {
          jumpTo(jump.getAttribute('data-jump'), jump.getAttribute('data-q'));
          return;
        }
        if (ev.target === el.modal) closePanel();
      });
    }

    fetch('/data/health-evidence.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (raw) {
        state.data = normalize(raw);
        // Node kind is needed to pick the right translation table.
        state.data.nodes.goals.forEach(function (n) { n.__kind = 'goals'; });
        state.data.nodes.markers.forEach(function (n) { n.__kind = 'markers'; });
        state.data.nodes.behaviors.forEach(function (n) { n.__kind = 'behaviors'; });
        renderCounts(state.data);
        renderLeverage(state.data);
        renderTierChart(state.data);
        renderGlossary();
        renderCutList(state.data);
        bind();
        applyChrome();
        render();

        var saved = null;
        try { saved = localStorage.getItem(LANG_KEY); } catch (err) { /* private mode */ }
        if (saved && saved !== 'en') setLang(saved);
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
