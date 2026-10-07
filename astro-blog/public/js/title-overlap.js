// Interactives for the title-overlap post: skill picker, then pay explorer.
// Skill picker reads /data/title-skills.json (prevalence per title) and /data/title-comp.json
// (posted pay). Score for a title = share of its 15 most-requested skills that
// the reader ticks, weighted by how often postings ask for each skill.
(function () {
    var root = document.getElementById('tov-picker');
    if (!root) return;

    var TOP_K = 15;
    var NAMES = {
        software_engineer: 'Software Eng', fde: 'FDE',
        data_engineer: 'Data Eng', data_scientist: 'Data Scientist',
        ml_engineer: 'ML Eng', ai_engineer: 'AI Eng', mlops_engineer: 'MLOps Eng',
        analytics_engineer: 'Analytics Eng', data_analyst: 'Data Analyst',
        business_analyst: 'Business Analyst'
    };
    var GROUPS = {
        languages: 'Languages', data_engineering: 'Data engineering',
        ml_modelling: 'ML and modelling', llm_genai: 'LLM and GenAI',
        cloud_infra: 'Cloud and infra', product_analytics: 'Product and analytics',
        soft_skills: 'Ways of working'
    };
    var PRESETS = {
        'Analyst': ['sql', 'dashboards_reporting', 'tableau', 'data_analysis', 'stakeholder_communication', 'spreadsheets'],
        'Software dev': ['python', 'java', 'distributed_systems', 'kubernetes', 'aws', 'api_design'],
        'ML practitioner': ['python', 'machine_learning', 'pytorch', 'deep_learning', 'statistics']
    };

    Promise.all([
        fetch('/data/title-skills.json').then(function (r) { return r.json(); }),
        fetch('/data/title-comp.json').then(function (r) { return r.json(); }),
        // Product logos are optional decoration; the picker works without them.
        fetch('/data/title-icons.json').then(function (r) { return r.json(); })
            .catch(function () { return []; })
    ]).then(function (res) { build(res[0], res[1], res[2]); })
      .catch(function () {
          root.querySelector('.tov-picker-desc').textContent = 'Could not load the skill data.';
      });

    function build(skills, comp, icons) {
        var titles = skills.titles;
        var prev = skills.prevalence;
        var hasIcon = {};
        icons.forEach(function (s) { hasIcon[s] = true; });

        // Each title's top skills and their weights.
        var top = {};
        var offered = {};
        titles.forEach(function (t) {
            var ids = Object.keys(prev[t].any).sort(function (a, b) {
                return prev[t].any[b] - prev[t].any[a];
            });
            top[t] = ids.slice(0, TOP_K);
            ids.slice(0, 25).forEach(function (s) { offered[s] = true; });
        });

        var desc = root.querySelector('.tov-picker-desc');
        desc.textContent = 'Tick what you can do. The list holds every skill that is among the 25 most requested for at least one title.';

        var tools = document.createElement('div');
        tools.className = 'tov-picker-tools';
        Object.keys(PRESETS).forEach(function (name) {
            tools.appendChild(button('Example: ' + name, function () { setChecked(PRESETS[name]); }));
        });
        tools.appendChild(button('Clear', function () { setChecked([]); }));
        root.appendChild(tools);

        var grid = document.createElement('div');
        grid.className = 'tov-groups';
        Object.keys(GROUPS).forEach(function (g) {
            var ids = Object.keys(offered).filter(function (s) {
                return skills.skills[s].group === g;
            }).sort(function (a, b) {
                return skills.skills[a].label.localeCompare(skills.skills[b].label);
            });
            if (!ids.length) return;
            var col = document.createElement('div');
            var name = document.createElement('div');
            name.className = 'tov-group-name';
            name.textContent = GROUPS[g];
            col.appendChild(name);
            ids.forEach(function (s) {
                var label = document.createElement('label');
                label.className = 'tov-skill';
                var box = document.createElement('input');
                box.type = 'checkbox';
                box.value = s;
                box.addEventListener('change', render);
                label.appendChild(box);
                if (hasIcon[s]) {
                    var ico = document.createElement('span');
                    ico.className = 'tov-ico';
                    ico.setAttribute('aria-hidden', 'true');
                    ico.style.setProperty('--ico', 'url(/img/title-overlap/icons/' + s + '.svg)');
                    label.appendChild(ico);
                }
                label.appendChild(document.createTextNode(skills.skills[s].label));
                col.appendChild(label);
            });
            grid.appendChild(col);
        });
        root.appendChild(grid);

        var head = document.createElement('div');
        head.className = 'tov-result-title';
        head.textContent = 'Match with each title, and its US posted base pay (median)';
        root.appendChild(head);
        var out = document.createElement('div');
        out.className = 'dv';
        root.appendChild(out);

        function setChecked(list) {
            grid.querySelectorAll('input').forEach(function (b) {
                b.checked = list.indexOf(b.value) >= 0;
            });
            render();
        }

        function render() {
            var have = {};
            grid.querySelectorAll('input:checked').forEach(function (b) { have[b.value] = true; });
            var rows = titles.map(function (t) {
                var total = 0, got = 0;
                top[t].forEach(function (s) {
                    total += prev[t].any[s];
                    if (have[s]) got += prev[t].any[s];
                });
                var pay = comp.postings[t + '|US'].all.median_mid;
                return { t: t, score: total ? got / total : 0, pay: pay };
            }).sort(function (a, b) { return b.score - a.score || (b.pay || 0) - (a.pay || 0); });

            out.innerHTML = '';
            rows.forEach(function (r) {
                var pct = Math.round(100 * r.score);
                var row = document.createElement('div');
                row.className = 'dv-row';
                row.innerHTML =
                    '<div class="dv-label">' + NAMES[r.t] + '</div>' +
                    '<div class="dv-bar"><div class="dv-track"><div class="dv-fill blue" style="width:' +
                    Math.max(0, pct) + '%"></div></div>' +
                    '<span class="dv-val"><b>' + pct + '%</b> match &middot; ' +
                    (r.pay ? '$' + Math.round(r.pay / 1000) + 'k base' : 'n/a') + '</span></div>';
                out.appendChild(row);
            });
        }

        render();
    }

    function button(text, onClick) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = text;
        b.addEventListener('click', onClick);
        return b;
    }
})();

// Pay explorer, from /data/title-comp.json. Every bar names what it measures:
//   Posted base   - midpoints of base-salary ranges disclosed in 2026 postings
//   levels.fyi base / levels.fyi TC - self-reported base and total compensation
// Each bar is a box plot: P10-P90 whisker, P25-P75 box, median tick.
// Filters: country, level (postings only; levels.fyi has no per-level data, so
// its bars are faded and labelled "all levels" when a level is chosen), titles.
(function () {
    var root = document.getElementById('tov-pay-explorer');
    if (!root) return;

    var NAMES = {
        software_engineer: 'Software Eng', fde: 'FDE',
        data_engineer: 'Data Eng', data_scientist: 'Data Scientist',
        ml_engineer: 'ML Eng', ai_engineer: 'AI Eng', mlops_engineer: 'MLOps Eng',
        analytics_engineer: 'Analytics Eng', data_analyst: 'Data Analyst',
        business_analyst: 'Business Analyst'
    };
    var LEVELS = [['all', 'All levels'], ['junior_mid', 'Junior/Mid'], ['senior', 'Senior'], ['staff_plus', 'Staff+']];
    var SERIES = [
        { key: 'post', label: 'Posted base', cls: 'tov-pe-s-post' },
        { key: 'lvbase', label: 'levels.fyi base', cls: 'tov-pe-s-lvbase' },
        { key: 'lvtc', label: 'levels.fyi TC', cls: 'tov-pe-s-lvtc' }
    ];

    fetch('/data/title-comp.json').then(function (r) { return r.json(); })
        .then(build)
        .catch(function () { root.textContent = 'Could not load the pay data.'; });

    function build(comp) {
        var state = { country: 'US', level: 'all', on: {}, show: { post: true, lvbase: true, lvtc: true } };
        comp.titles.forEach(function (t) { state.on[t] = true; });

        var controls = document.createElement('div');
        controls.className = 'tov-pe-controls';
        controls.appendChild(select('Country', [['US', 'United States (USD)'], ['CA', 'Canada (CAD)']], 'country'));
        controls.appendChild(select('Level (posted base only)', LEVELS, 'level'));
        root.appendChild(controls);

        var series = document.createElement('div');
        series.className = 'tov-pe-chips';
        SERIES.forEach(function (s) {
            series.appendChild(chip(s.label, s.cls, function (on) { state.show[s.key] = on; }));
        });
        controls.appendChild(series);

        var chips = document.createElement('div');
        chips.className = 'tov-pe-chips';
        comp.titles.forEach(function (t) {
            chips.appendChild(chip(NAMES[t], '', function (on) { state.on[t] = on; }));
        });
        root.appendChild(chips);

        var out = document.createElement('div');
        out.className = 'tov-pe-rows';
        root.appendChild(out);
        var note = document.createElement('div');
        note.className = 'dv-note';
        root.appendChild(note);

        function chip(text, cls, onToggle) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'tov-pe-chip on ' + cls;
            b.textContent = text;
            b.setAttribute('aria-pressed', 'true');
            b.addEventListener('click', function () {
                var on = !b.classList.contains('on');
                b.classList.toggle('on', on);
                b.setAttribute('aria-pressed', String(on));
                onToggle(on);
                render();
            });
            return b;
        }

        function select(label, options, key) {
            var wrap = document.createElement('label');
            wrap.className = 'tov-pe-select';
            wrap.appendChild(document.createTextNode(label));
            var s = document.createElement('select');
            options.forEach(function (o) {
                var opt = document.createElement('option');
                opt.value = o[0];
                opt.textContent = o[1];
                s.appendChild(opt);
            });
            s.value = state[key];
            s.addEventListener('change', function () { state[key] = s.value; render(); });
            wrap.appendChild(s);
            return wrap;
        }

        function k(x) { return Math.round(x / 1000) + 'k'; }

        // One distribution per series, as {p10, p25, med, p75, p90, n, flag, note}.
        function distFor(t, key) {
            var cc = t + '|' + state.country;
            if (key === 'post') {
                var e = comp.postings[cc];
                var c = state.level === 'all' ? e.all : e.by_seniority[state.level];
                if (!c.median_mid) return { n: c.n, empty: 'n=' + c.n + ', too few' };
                return { p10: c.p10_mid, p25: c.p25_mid, med: c.median_mid, p75: c.p75_mid, p90: c.p90_mid,
                         n: c.n, flag: c.status === 'very_low_n' ? 'very low n' : c.status === 'low_n' ? 'low n' : '' };
            }
            if (state.level !== 'all') {
                // Per-level levels.fyi: submissions from the posting-sample employers'
                // company pages, company levels mapped to the three tiers. Titles
                // without a levels.fyi family or focus tag have none, and are hidden.
                var byTier = (comp.levels_fyi_by_tier[cc] || {})[state.level];
                if (!byTier || byTier.status === 'dropped') return { skip: true };
                var dt = byTier[key === 'lvbase' ? 'base' : 'total'];
                return { p10: dt.p10, p25: dt.p25, med: dt.median, p75: dt.p75, p90: dt.p90, n: byTier.n,
                         flag: byTier.status === 'very_low_n' ? 'very low n' : byTier.status === 'low_n' ? 'low n' : '',
                         faded: false,
                         // Flag cells where one employer supplies half or more of the submissions.
                         note: byTier.n_companies + ' cos' + (byTier.top_company_share >= 0.5 ?
                             ', ' + Math.round(100 * byTier.top_company_share) + '% from ' + byTier.top_company : '') };
            }
            var lv = comp.levels_fyi[cc];
            if (!lv || !lv.dist) return { empty: 'no page' };
            var d = lv.dist[key === 'lvbase' ? 'base' : 'total'];
            if (lv.n < 7) return { n: lv.n, empty: 'n=' + lv.n + ', too few' };
            return { p10: d.p10, p25: d.p25, med: d.median, p75: d.p75, p90: d.p90, n: lv.n,
                     flag: lv.n < 20 ? 'very low n' : lv.n < 40 ? 'low n' : '',
                     faded: false, note: '' };
        }

        function render() {
            var titles = comp.titles.filter(function (t) { return state.on[t]; });
            // Series the reader switched on; distFor() skips titles with no per-level data.
            var keys = SERIES.filter(function (s) {
                return state.show[s.key];
            });
            var vmax = 0;
            titles.forEach(function (t) {
                keys.forEach(function (s) {
                    var d = distFor(t, s.key);
                    if (d.p90) vmax = Math.max(vmax, d.p90);
                });
            });
            // x-axis: the smallest step that keeps the scale to about six ticks.
            var step = [25000, 50000, 100000, 200000].filter(function (st) { return vmax / st <= 6; })[0] || 200000;
            vmax = Math.ceil(vmax / step) * step || step;
            var ticks = [];
            for (var tv = 0; tv <= vmax; tv += step) ticks.push(tv);
            var gridHtml = ticks.slice(1, -1).map(function (tv) {
                return '<div class="tov-pe-grid" style="left:' + (100 * tv / vmax).toFixed(2) + '%"></div>';
            }).join('');
            function axisRow() {
                var a = document.createElement('div');
                a.className = 'tov-pe-axis';
                a.setAttribute('aria-hidden', 'true');
                a.innerHTML = '<span></span><span></span><div class="tov-pe-scale">' + ticks.map(function (tv, i) {
                    var edge = i === 0 ? ' tov-pe-tick-first' : i === ticks.length - 1 ? ' tov-pe-tick-last' : '';
                    return '<span class="tov-pe-tick' + edge + '" style="left:' + (100 * tv / vmax).toFixed(2) + '%">' +
                        (tv === 0 ? '0' : k(tv)) + '</span>';
                }).join('') + '</div><span></span>';
                return a;
            }
            // Sort by posted base median when shown, else by the first visible series.
            var sortKey = state.show.post ? 'post' : (keys[0] ? keys[0].key : 'post');
            titles.sort(function (a, b) {
                return (distFor(b, sortKey).med || -1) - (distFor(a, sortKey).med || -1);
            });

            out.innerHTML = '';
            out.appendChild(axisRow());
            titles.forEach(function (t) {
                var group = document.createElement('div');
                group.className = 'tov-pe-group';
                var name = document.createElement('div');
                name.className = 'tov-pe-title';
                name.textContent = NAMES[t];
                group.appendChild(name);
                keys.forEach(function (s) {
                    var d = distFor(t, s.key);
                    if (d.skip) return;
                    var row = document.createElement('div');
                    row.className = 'tov-pe-row ' + s.cls + (d.faded ? ' tov-pe-faded' : '') +
                        (d.flag === 'very low n' ? ' tov-pe-thin' : '');
                    var html = '<span class="tov-pe-series">' + s.label + '</span><div class="tov-pe-track">' + gridHtml;
                    if (!d.empty) {
                        var pc = function (x) { return (100 * x / vmax).toFixed(2) + '%'; };
                        html += '<div class="tov-pe-whisker" style="left:' + pc(d.p10) + ';width:' + pc(d.p90 - d.p10) + '"></div>' +
                            '<div class="tov-pe-box" style="left:' + pc(d.p25) + ';width:' + pc(Math.max(d.p75 - d.p25, vmax * 0.004)) + '"></div>' +
                            '<div class="tov-pe-med" style="left:' + pc(d.med) + '"></div>';
                    }
                    html += '</div><span class="tov-pe-val">' + (d.empty ? d.empty :
                        '<b>' + k(d.med) + '</b> <span class="tov-muted">' + k(d.p25) + '-' + k(d.p75) + ' n=' + d.n + '</span>' +
                        (d.flag ? ' <span class="tov-flag' + (d.flag === 'very low n' ? ' tov-flag-strong' : '') + '">' + d.flag + '</span>' : '') +
                        (d.note ? ' <span class="tov-flag">' + d.note + '</span>' : '')) + '</span>';
                    row.innerHTML = html;
                    row.querySelector('.tov-pe-track').title = s.label + ', ' + NAMES[t] + ': P10 ' + (d.p10 ? k(d.p10) : '-') + ', P25 ' +
                        (d.p25 ? k(d.p25) : '-') + ', median ' + (d.med ? k(d.med) : '-') + ', P75 ' +
                        (d.p75 ? k(d.p75) : '-') + ', P90 ' + (d.p90 ? k(d.p90) : '-');
                    group.appendChild(row);
                });
                name.style.gridRow = 'span ' + Math.max(1, group.querySelectorAll('.tov-pe-row').length);
                out.appendChild(group);
            });
            out.appendChild(axisRow());

            var cur = state.country === 'CA' ? 'CAD' : 'USD';
            note.innerHTML = 'Annual pay in ' + cur + ', scale 0 to ' + k(vmax) + '. Thin line: P10 to P90; box: P25 to P75; tick: median. ' +
                '<b>Base</b> is salary only; <b>TC</b> (total compensation) adds equity and bonus. ' +
                'Posted base is the midpoint of each posting\'s disclosed range. ' +
                'Cells with fewer than 7 data points are not drawn; 7 to 19 are faded and marked very low n.' +
                (state.level !== 'all' ? ' With a level selected, levels.fyi bars use submissions (offers 2025-2026) from company pages of the employers in the posting sample, with each company level (e.g. Amazon SDE II) mapped to Junior/Mid, Senior or Staff+. Titles levels.fyi does not split out (FDE, AI, MLOps, Analytics Eng) show posted base only.' : '');
        }

        render();
    }
})();
