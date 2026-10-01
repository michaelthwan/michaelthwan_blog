// Topic tree, shared by /tree and /blog. Order inside each branch is reading order (foundations first), not date.
// A post whose slug is not listed here still shows up, under its category's "Unsorted" branch.
export const tree = [
    {
        id: 'ml', name: 'AI, ML & Agents', short: 'AI & ML', color: 'var(--field-blue)',
        desc: 'How the models work, from the papers underneath to this year\'s frontier.',
        branches: [
            { name: 'Foundations', desc: 'The papers the rest builds on', slugs: ['transformer', 'bert', 'flash-attention', 'vit-registers'] },
            { name: 'Frontier models', desc: 'Reasoning, open weights, and what comes after text', slugs: ['reasoning-models', 'deepseek-v4', 'deepseek-mhc', 'glm-52', 'jev'] },
            { name: 'Search & ranking', desc: 'Ordering the web', slugs: ['pagerank'] },
        ],
    },
    {
        id: 'dev', name: 'Building with Agents', short: 'Agents', color: 'var(--field-orange)',
        desc: 'Tools, harnesses, and the cost of putting agents to work.',
        branches: [
            { name: 'Claude Code', desc: 'One agent, inside and out', slugs: ['claude-code', 'claude-code-leak'] },
            { name: 'Agent practice', desc: 'Harnesses, budgets, and memory', slugs: ['agent-engineering-roadmap', 'frontier-frugality', 'llm-knowledge-base'] },
        ],
    },
    {
        id: 'business', name: 'Business & Analysis', short: 'Business', color: 'var(--field-aqua)',
        desc: 'Money, markets, and evidence, read through data.',
        branches: [
            { name: 'AI economy', desc: 'Who pays whom, and who gets paid', slugs: ['ai-investment-war', 'tech-comp'] },
            { name: 'Markets', desc: 'A century of the index', slugs: ['sp500-history'] },
            { name: 'Health evidence', desc: 'Claims traced to papers', slugs: ['health-evidence-explorer'] },
        ],
    },
];

// Field (root) and branch a post sits under; falls back to its category's field.
export function placeOf(slug: string, category: string) {
    for (const root of tree) {
        const branch = root.branches.find(b => b.slugs.includes(slug));
        if (branch) return { root, branch };
    }
    return { root: tree.find(r => r.id === category) ?? tree[0], branch: null };
}
