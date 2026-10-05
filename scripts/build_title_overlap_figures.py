"""Render the data figures of the title-overlap post from the analysis JSON.

The post markdown holds marker pairs
    <!-- tov:fig NAME -->  ...generated HTML...  <!-- /tov:fig NAME -->
and this script replaces the content between each pair, so every number in a
figure comes straight from astro-blog/public/data/title-*.json and the prose
around it is left alone. Re-run after any change to the data.

Run: python scripts/build_title_overlap_figures.py
"""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "astro-blog", "public", "data")
POST = os.path.join(ROOT, "astro-blog", "src", "content", "posts", "title-overlap.md")

NAMES = {"software_engineer": "Software Eng", "fde": "FDE",
         "data_engineer": "Data Eng", "data_scientist": "Data Scientist",
         "ml_engineer": "ML Eng", "ai_engineer": "AI Eng", "mlops_engineer": "MLOps Eng",
         "analytics_engineer": "Analytics Eng", "data_analyst": "Data Analyst",
         "business_analyst": "Business Analyst"}


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


ICON_DIR = os.path.join(ROOT, "astro-blog", "public", "img", "title-overlap", "icons")
ICON_URL = "/img/title-overlap/icons/%s.svg"
# Product logos (Simple Icons 16.34.0) for skills that are a specific tool.
ICONS = {f[:-4] for f in os.listdir(ICON_DIR) if f.endswith(".svg")} if os.path.isdir(ICON_DIR) else set()


def icon(sid):
    return ('<span class="tov-ico" style="--ico:url(%s)" aria-hidden="true"></span>' % (ICON_URL % sid)
            if sid in ICONS else "")


def heat(v, text, vmax=1.0):
    x = max(0.0, min(1.0, v / vmax)) if vmax else 0.0
    cls = "heat hot" if x >= 0.6 else "heat"
    return '<td class="%s" style="--v:%.2f">%s</td>' % (cls, x, text)


def dbar(v, vmax, text):
    return '<td class="dbar" style="--v:%.2f">%s</td>' % (max(0.0, min(1.0, v / vmax)), text)


def leaf_order(tree, titles):
    """Dendrogram leaf order, so similar titles sit together. Merge steps name
    their children by title or by 'c<k>' for the k-th node (k = n + step)."""
    node = {"c%d" % (len(titles) + i): (s["left"], s["right"]) for i, s in enumerate(tree)}

    def walk(label):
        if label not in node:
            return [label]
        left, right = node[label]
        return walk(left) + walk(right)

    return walk("c%d" % (len(titles) + len(tree) - 1)) if tree else list(titles)


def fig_heatmap(skills, analysis, order, k=28):
    """Skills x titles prevalence (required or preferred). Rows: the k skills
    with the largest spread across titles, grouped by the title where they peak."""
    prev = skills["prevalence"]
    ids = list(skills["skills"])
    spread = []
    for s in ids:
        vals = [prev[t]["any"][s] for t in order]
        spread.append((max(vals) - min(vals), s))
    top = [s for _, s in sorted(spread, reverse=True)[:k]]
    top.sort(key=lambda s: (order.index(max(order, key=lambda t: prev[t]["any"][s])),
                            -max(prev[t]["any"][s] for t in order)))
    head = "".join('<th class="tov-vh"><span>%s</span></th>' % NAMES[t] for t in order)
    rows = []
    for s in top:
        cells = "".join(heat(prev[t]["any"][s], "%d" % round(100 * prev[t]["any"][s]))
                        for t in order)
        rows.append('<tr><th class="tov-rowh">%s%s</th>%s</tr>'
                    % (icon(s), skills["skills"][s]["label"], cells))
    n = "".join("<td>%d</td>" % prev[t]["n"] for t in order)
    return ('<div class="tov-scroll"><table class="tov-heat">\n<thead><tr><th></th>%s</tr></thead>\n'
            '<tbody>\n%s\n<tr class="tov-n"><th class="tov-rowh">JDs (n)</th>%s</tr>\n</tbody></table></div>'
            % (head, "\n".join(rows), n))


def fig_core(skills, analysis):
    prev, order = skills["prevalence"], skills["titles"]
    rows = []
    for d in analysis["near_core"][:8]:
        s = d["skill"]
        vals = [prev[t]["any"][s] for t in order]
        lo, hi = min(vals), max(vals)
        rows.append(
            '<div class="dv-row"><div class="dv-label">%s</div><div class="dv-bar">'
            '<div class="dv-track tov-range"><div class="dv-fill blue" style="margin-left:%.1f%%;width:%.1f%%" '
            'title="%s: lowest title %d%%, highest %d%%"></div></div>'
            '<span class="dv-val"><b>%d%%</b> to %d%%</span></div></div>'
            % (skills["skills"][s]["label"], 100 * lo, max(0.6, 100 * (hi - lo)),
               skills["skills"][s]["label"], round(100 * lo), round(100 * hi),
               round(100 * lo), round(100 * hi)))
    return ('<div class="dv">\n<div class="dv-title">Share of JDs asking for the skill: '
            'lowest title to highest title (required or preferred)</div>\n%s\n</div>' % "\n".join(rows))


def fig_signatures(skills, analysis, order):
    rows = []
    for t in order:
        sig = analysis["signatures"].get(t, [])[:4]
        cells = "; ".join("%s%s <span class=\"tov-muted\">%d%% vs %d%%</span>"
                          % (icon(d["skill"]), skills["skills"][d["skill"]]["label"],
                             round(100 * d["p_title"]),
                             round(100 * d["p_rest"])) for d in sig)
        rows.append("<tr><th>%s</th><td>%s</td></tr>" % (NAMES[t], cells))
    return ('<div class="tov-scroll"><table class="tov-table">\n<thead><tr><th>Title</th>'
            '<th>Signature skills <span class="tov-muted">(this title vs all others)</span></th>'
            '</tr></thead>\n<tbody>\n%s\n</tbody></table></div>' % "\n".join(rows))


def fig_similarity(analysis, order):
    sim = analysis["similarity"]
    idx = {t: i for i, t in enumerate(sim["titles"])}
    head = "".join('<th class="tov-vh"><span>%s</span></th>' % NAMES[t] for t in order)
    rows = []
    for a in order:
        cells = []
        for b in order:
            v = sim["cosine"][idx[a]][idx[b]]
            if a == b:
                cells.append('<td class="tov-diag"></td>')
            else:
                # Scale from 0.4 (unrelated in this set) to 1.0 so contrast is visible.
                cells.append(heat(max(0.0, v - 0.4), "%.2f" % v, 0.6))
        rows.append('<tr><th class="tov-rowh">%s</th>%s</tr>' % (NAMES[a], "".join(cells)))
    return ('<div class="tov-scroll"><table class="tov-heat tov-sim">\n<thead><tr><th></th>%s</tr></thead>\n'
            '<tbody>\n%s\n</tbody></table></div>' % (head, "\n".join(rows)))


def pair_rows(analysis, comp):
    """Every title pair, higher posted-base title first, with three US pay gaps:
    posted base, levels.fyi base and levels.fyi TC (each median over median)."""
    sim = analysis["similarity"]
    idx = {t: i for i, t in enumerate(sim["titles"])}

    def meds(t):
        lv = comp["levels_fyi"]["%s|US" % t].get("dist", {})
        return (comp["postings"]["%s|US" % t]["all"].get("median_mid"),
                lv.get("base", {}).get("median"), lv.get("total", {}).get("median"))

    def gap(x, y):
        return (x / y - 1) if x and y else None

    out = []
    ts = sim["titles"]
    for i, t1 in enumerate(ts):
        for t2 in ts[i + 1:]:
            hi, lo = t1, t2
            ma, mb = meds(hi), meds(lo)
            if ma[0] and mb[0] and mb[0] > ma[0]:
                hi, lo, ma, mb = lo, hi, mb, ma
            out.append({"a": hi, "b": lo, "cos": sim["cosine"][idx[t1]][idx[t2]],
                        "post_gap": gap(ma[0], mb[0]), "lv_base_gap": gap(ma[1], mb[1]),
                        "lv_tc_gap": gap(ma[2], mb[2])})
    return sorted(out, key=lambda d: -d["cos"])


def fig_disagree(analysis, comp, k=10):
    rows = []
    pairs = pair_rows(analysis, comp)[:k]
    gmax = max(abs(d["post_gap"] or 0) for d in pairs) or 1

    def pct(v):
        return '<td class="tov-num">%+d%%</td>' % round(100 * v) if v is not None else "<td>-</td>"

    for d in pairs:
        rows.append("<tr><th>%s <span class=\"tov-muted\">over</span> %s</th>%s%s%s%s</tr>" % (
            NAMES[d["a"]], NAMES[d["b"]], heat(max(0.0, d["cos"] - 0.4), "%.2f" % d["cos"], 0.6),
            dbar(abs(d["post_gap"] or 0), gmax, "+%d%%" % round(100 * d["post_gap"])),
            pct(d["lv_base_gap"]), pct(d["lv_tc_gap"])))
    return ('<div class="tov-scroll"><table class="tov-table">\n<thead><tr>'
            '<th>Pair (higher posted base first)</th><th>Skill similarity</th>'
            '<th>Posted base gap</th><th>levels.fyi base gap</th><th>levels.fyi TC gap</th>'
            '</tr></thead>\n<tbody>\n%s\n</tbody></table></div>' % "\n".join(rows))


def write_thumbnail(analysis, order):
    """Card thumbnail: the real similarity matrix in clustering order, with the
    two title families outlined."""
    sim = analysis["similarity"]
    idx = {t: i for i, t in enumerate(sim["titles"])}
    w, h, cell = 640, 360, 28
    x0, y0 = (w - 10 * cell) // 2, (h - 10 * cell) // 2
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">' % (w, h, w, h),
           '<rect width="%d" height="%d" fill="#ffffff"/>' % (w, h)]
    for i, a in enumerate(order):
        for j, b in enumerate(order):
            v = sim["cosine"][idx[a]][idx[b]]
            col, op = ("#d1d5db", 1.0) if i == j else ("#2a78d6", max(0.04, min(1.0, (v - 0.4) / 0.6)))
            out.append('<rect x="%d" y="%d" width="%d" height="%d" rx="3" fill="%s" fill-opacity="%.2f"/>'
                       % (x0 + j * cell + 2, y0 + i * cell + 2, cell - 4, cell - 4, col, op))
    for k in (0, 5):
        out.append('<rect x="%d" y="%d" width="%d" height="%d" rx="5" fill="none" stroke="#eb6834" '
                   'stroke-width="2"/>' % (x0 + k * cell, y0 + k * cell, 5 * cell, 5 * cell))
    out.append("</svg>")
    path = os.path.join(ROOT, "astro-blog", "public", "img", "title-overlap", "thumbnail.svg")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out))


def main():
    skills = load("title-skills.json")
    analysis = load("title-analysis.json")
    comp = load("title-comp.json")
    order = leaf_order(analysis["clustering"], skills["titles"])
    figs = {
        "heatmap": fig_heatmap(skills, analysis, order),
        "core": fig_core(skills, analysis),
        "signatures": fig_signatures(skills, analysis, order),
        "similarity": fig_similarity(analysis, order),
        "disagree": fig_disagree(analysis, comp),
    }
    write_thumbnail(analysis, order)
    # The skill picker reads the same icon list.
    with open(os.path.join(DATA, "title-icons.json"), "w", encoding="utf-8") as f:
        json.dump(sorted(ICONS), f)
    with open(POST, encoding="utf-8") as f:
        text = f.read()
    for name, html in figs.items():
        pat = re.compile(r"(<!-- tov:fig %s -->).*?(<!-- /tov:fig %s -->)" % (name, name), re.S)
        text, n = pat.subn(lambda m: m.group(1) + "\n" + html + "\n" + m.group(2), text)
        print("%-11s %s" % (name, "updated" if n else "MARKER MISSING"))
    with open(POST, "w", encoding="utf-8") as f:
        f.write(text)


if __name__ == "__main__":
    main()
