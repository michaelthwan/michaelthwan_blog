// ── AI Investment War map ──
// Data-driven SVG diagram: company nodes across four industry layers,
// with equity (purple) and commercial (green) deal arrows. Each node shows
// its market cap / private valuation; each arrow carries a compact dollar
// label. All coordinates live in a fixed 1120x700 viewBox; paths are
// hand-routed polylines. Columns are 126px wide with 20px routing gaps.
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

  // ── Brand icons (Simple Icons, 24x24 viewBox, monochrome) ──
  const ICONS = {
    ms: 'M0 0v11.408h11.408V0zm12.594 0v11.408H24V0zM0 12.594V24h11.408V12.594zm12.594 0V24H24V12.594z',
    openai: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
    anthropic: 'M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z',
    google: 'M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z',
    amazon: 'M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 01-10.951-.577 17.88 17.88 0 01-5.43-3.35c-.1-.074-.151-.15-.151-.22 0-.047.021-.09.051-.13zm6.565-6.218c0-1.005.247-1.863.743-2.577.495-.71 1.17-1.25 2.04-1.615.796-.335 1.756-.575 2.912-.72.39-.046 1.033-.103 1.92-.174v-.37c0-.93-.105-1.558-.3-1.875-.302-.43-.78-.65-1.44-.65h-.182c-.48.046-.896.196-1.246.46-.35.27-.575.63-.675 1.096-.06.3-.206.465-.435.51l-2.52-.315c-.248-.06-.372-.18-.372-.39 0-.046.007-.09.022-.15.247-1.29.855-2.25 1.82-2.88.976-.616 2.1-.975 3.39-1.05h.54c1.65 0 2.957.434 3.888 1.29.135.15.27.3.405.48.12.165.224.314.283.45.075.134.15.33.195.57.06.254.105.42.135.51.03.104.062.3.076.615.01.313.02.493.02.553v5.28c0 .376.06.72.165 1.036.105.313.21.54.315.674l.51.674c.09.136.136.256.136.36 0 .12-.06.226-.18.314-1.2 1.05-1.86 1.62-1.963 1.71-.165.135-.375.15-.63.045a6.062 6.062 0 01-.526-.496l-.31-.347a9.391 9.391 0 01-.317-.42l-.3-.435c-.81.886-1.603 1.44-2.4 1.665-.494.15-1.093.227-1.83.227-1.11 0-2.04-.343-2.76-1.034-.72-.69-1.08-1.665-1.08-2.94l-.05-.076zm3.753-.438c0 .566.14 1.02.425 1.364.285.34.675.512 1.155.512.045 0 .106-.007.195-.02.09-.016.134-.023.166-.023.614-.16 1.08-.553 1.424-1.178.165-.28.285-.58.36-.91.09-.32.12-.59.135-.8.015-.195.015-.54.015-1.005v-.54c-.84 0-1.484.06-1.92.18-1.275.36-1.92 1.17-1.92 2.43l-.035-.02zm9.162 7.027c.03-.06.075-.11.132-.17.362-.243.714-.41 1.05-.5a8.094 8.094 0 011.612-.24c.14-.012.28 0 .41.03.65.06 1.05.168 1.172.33.063.09.099.228.099.39v.15c0 .51-.149 1.11-.424 1.8-.278.69-.664 1.248-1.156 1.68-.073.06-.14.09-.197.09-.03 0-.06 0-.09-.012-.09-.044-.107-.12-.064-.24.54-1.26.806-2.143.806-2.64 0-.15-.03-.27-.087-.344-.145-.166-.55-.257-1.224-.257-.243 0-.533.016-.87.046-.363.045-.7.09-1 .135-.09 0-.148-.014-.18-.044-.03-.03-.036-.047-.02-.077 0-.017.006-.03.02-.063v-.06z',
    meta: 'M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z',
    spacex: 'M24 7.417C8.882 8.287 1.89 14.75.321 16.28L0 16.583h2.797C10.356 9.005 21.222 7.663 24 7.417zm-17.046 6.35c-.472.321-.945.68-1.398 1.02l2.457 1.796h2.778zM2.948 10.8H.189l3.25 2.381c.473-.321 1.02-.661 1.512-.945Z',
    oracle: 'M16.412 4.412h-8.82a7.588 7.588 0 0 0-.008 15.176h8.828a7.588 7.588 0 0 0 0-15.176zm-.193 12.502H7.786a4.915 4.915 0 0 1 0-9.828h8.433a4.914 4.914 0 1 1 0 9.828z',
    nvidia: 'M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z',
    broadcom: 'M12 0c6.628 0 12 5.372 12 12a12 12 0 0 1-.56 3.63 13.641 13.641 0 0 0-.867-.388c-1.372-.546-2.629-.363-3.888.4 0 0-.459.28-.597.366-.586.37-1.14.717-1.672.717-.508 0-1.007-.135-1.218-1.117-.33-1.533-1.135-5.298-1.486-7.162-.206-1.097-.319-1.688-.436-2.088-.208-.706-.586-1.09-1.124-1.15 0 0-.084-.013-.152-.013-.068 0-.162.014-.162.014-.531.064-.907.447-1.114 1.15-.117.4-.23.99-.436 2.087-.351 1.864-1.156 5.63-1.486 7.162-.21.982-.71 1.117-1.218 1.117-.531 0-1.086-.348-1.672-.717-.138-.086-.597-.366-.597-.366-1.259-.763-2.516-.946-3.888-.4-.301.12-.586.251-.867.387A11.995 11.995 0 0 1 0 12C0 5.372 5.372 0 12 0m8.375 16.976c-.453.152-.855.42-1.256.672-.756.475-1.613 1.014-2.704 1.014-1.614 0-2.749-.964-3.112-2.647C13.023 14.712 12 9.793 12 9.793a496.28 496.28 0 0 1-1.303 6.222c-.362 1.683-1.497 2.647-3.112 2.647-1.09 0-1.946-.539-2.703-1.014-.401-.252-.804-.52-1.256-.672a2.319 2.319 0 0 0-1.414-.01c-.33.097-.644.234-.951.386C3.227 21.292 7.207 24 11.91 24s8.863-2.708 10.83-6.648a5.958 5.958 0 0 0-.95-.386 2.322 2.322 0 0 0-1.415.01',
    amd: 'M18.324 9.137l1.559 1.56h2.556v2.557L24 14.814V9.137zM2 9.52l-2 4.96h1.309l.37-.982H3.9l.408.982h1.338L3.432 9.52zm4.209 0v4.955h1.238v-3.092l1.338 1.562h.188l1.338-1.556v3.091h1.238V9.52H10.47l-1.592 1.845L7.287 9.52zm6.283 0v4.96h2.057c1.979 0 2.88-1.046 2.88-2.472 0-1.36-.937-2.488-2.747-2.488zm1.237.91h.792c1.17 0 1.63.711 1.63 1.57 0 .728-.372 1.572-1.616 1.572h-.806zm-10.985.273l.791 1.932H2.008zm17.137.307l-1.604 1.603v2.25h2.246l1.604-1.607h-2.246z',
    intel: 'M20.42 7.345v9.18h1.651v-9.18zM0 7.475v1.737h1.737V7.474zm9.78.352v6.053c0 .513.044.945.13 1.292.087.34.235.618.44.828.203.21.475.359.803.451.334.093.754.136 1.255.136h.216v-1.533c-.24 0-.445-.012-.593-.037a.672.672 0 0 1-.39-.173.693.693 0 0 1-.173-.377 4.002 4.002 0 0 1-.037-.606v-2.182h1.193v-1.416h-1.193V7.827zm-3.505 2.312c-.396 0-.76.08-1.082.241-.327.161-.6.384-.822.668l-.087.117v-.902H2.658v6.256h1.639v-3.214c.018-.588.16-1.02.433-1.299.29-.297.642-.445 1.044-.445.476 0 .841.149 1.082.433.235.284.359.686.359 1.2v3.324h1.663V12.97c.006-.89-.229-1.595-.686-2.09-.458-.495-1.1-.742-1.917-.742zm10.065.006a3.252 3.252 0 0 0-2.306.946c-.29.29-.525.637-.692 1.033a3.145 3.145 0 0 0-.254 1.273c0 .452.08.878.241 1.274.161.395.39.742.674 1.032.284.29.637.526 1.045.693.408.173.86.26 1.342.26 1.397 0 2.262-.637 2.782-1.23l-1.187-.904c-.248.297-.841.699-1.583.699-.464 0-.847-.105-1.138-.321a1.588 1.588 0 0 1-.593-.872l-.019-.056h4.915v-.587c0-.451-.08-.872-.235-1.267a3.393 3.393 0 0 0-.661-1.033 3.013 3.013 0 0 0-1.02-.692 3.345 3.345 0 0 0-1.311-.248zm-16.297.118v6.256h1.651v-6.256zm16.278 1.286c1.132 0 1.664.797 1.664 1.255l-3.32.006c0-.458.525-1.255 1.656-1.261zm7.073 3.814a.606.606 0 0 0-.606.606.606.606 0 0 0 .606.606.606.606 0 0 0 .606-.606.606.606 0 0 0-.606-.606zm-.008.105a.5.5 0 0 1 .002 0 .5.5 0 0 1 .5.501.5.5 0 0 1-.5.5.5.5 0 0 1-.5-.5.5.5 0 0 1 .498-.5zm-.233.155v.699h.13v-.285h.093l.173.285h.136l-.18-.297a.191.191 0 0 0 .118-.056c.03-.03.05-.074.05-.136 0-.068-.02-.117-.063-.154-.037-.038-.105-.056-.185-.056zm.13.099h.154c.019 0 .037.006.056.012a.064.064 0 0 1 .037.031c.013.013.012.031.012.056a.124.124 0 0 1-.012.055.164.164 0 0 1-.037.031c-.019.006-.037.013-.056.013h-.154Z',
  };

  // ── Nodes ──
  // kind: 'company' (tall card), 'sub' (block inside a company card), 'solo'
  // mcap = market cap (public) or private valuation as of mid-2026.
  const NODES = [
    { id: 'ms', label: 'Microsoft', cap: 'hyperscaler', mcap: '$3.1T', x: 90, y: 40, w: 126, h: 455, kind: 'company' },
    { id: 'openai', label: 'OpenAI', cap: 'private lab', mcap: '$852B', x: 236, y: 40, w: 126, h: 265, kind: 'company' },
    { id: 'anthropic', label: 'Anthropic', cap: 'private lab', mcap: '$965B', x: 382, y: 40, w: 126, h: 265, kind: 'company' },
    { id: 'google', label: 'Google', cap: 'full-stack', mcap: '$4.6T', x: 528, y: 40, w: 126, h: 615, kind: 'company' },
    { id: 'amazon', label: 'Amazon', cap: 'hyperscaler', mcap: '$2.9T', x: 674, y: 40, w: 126, h: 615, kind: 'company' },
    { id: 'meta', label: 'Meta', cap: 'open-weights', mcap: '$1.7T', x: 820, y: 40, w: 126, h: 265, kind: 'company' },
    { id: 'spacex', label: 'SpaceX · xAI', cap: 'public · Jun ’26', mcap: '$2.0T', x: 966, y: 40, w: 126, h: 455, kind: 'company' },

    { id: 'azure', parent: 'ms', label: 'Azure', cap: 'cloud', x: 98, y: 325, w: 110, h: 160, kind: 'sub' },
    { id: 'chatgpt', parent: 'openai', label: 'ChatGPT', cap: 'GPT models', x: 244, y: 165, w: 110, h: 130, kind: 'sub' },
    { id: 'claude', parent: 'anthropic', label: 'Claude', cap: 'models', x: 390, y: 165, w: 110, h: 130, kind: 'sub' },
    { id: 'gemini', parent: 'google', label: 'Gemini', cap: 'models', x: 536, y: 165, w: 110, h: 130, kind: 'sub' },
    { id: 'gcloud', parent: 'google', label: 'Google Cloud', cap: '', x: 536, y: 325, w: 110, h: 160, kind: 'sub' },
    { id: 'tpu', parent: 'google', label: 'TPU', cap: 'custom silicon', x: 536, y: 515, w: 110, h: 130, kind: 'sub' },
    { id: 'aws', parent: 'amazon', label: 'AWS', cap: 'cloud', x: 682, y: 325, w: 110, h: 160, kind: 'sub' },
    { id: 'trainium', parent: 'amazon', label: 'Trainium', cap: 'custom silicon', x: 682, y: 515, w: 110, h: 130, kind: 'sub' },
    { id: 'llama', parent: 'meta', label: 'Llama', cap: 'open weights', x: 828, y: 165, w: 110, h: 130, kind: 'sub' },
    { id: 'grok', parent: 'spacex', label: 'Grok', cap: 'models', x: 974, y: 165, w: 110, h: 130, kind: 'sub' },
    { id: 'colossus', parent: 'spacex', label: 'Colossus', cap: 'Memphis DC', x: 974, y: 325, w: 110, h: 160, kind: 'sub' },

    { id: 'oracle', label: 'Oracle', cap: '', mcap: '$422B', x: 236, y: 325, w: 126, h: 75, kind: 'solo' },
    { id: 'stargate', label: 'Stargate', cap: '$500B project', x: 236, y: 412, w: 126, h: 73, kind: 'solo' },
    { id: 'nvidia', label: 'NVIDIA', cap: 'sells to everyone', mcap: '$5.2T', x: 90, y: 515, w: 272, h: 130, kind: 'solo' },
    { id: 'broadcom', label: 'Broadcom', cap: 'custom ASICs', mcap: '$1.8T', x: 382, y: 515, w: 126, h: 130, kind: 'solo' },
    { id: 'amd', label: 'AMD', cap: 'Instinct GPUs', mcap: '$950B', x: 820, y: 515, w: 126, h: 130, kind: 'solo' },
    { id: 'intel', label: 'Intel', cap: 'foundry wildcard', mcap: '$700B', x: 966, y: 515, w: 126, h: 130, kind: 'solo' },
  ];

  const NODE_INFO = {
    ms: 'Anchor investor in OpenAI since 2019 — and, since early 2026, an Anthropic shareholder too. Microsoft hedges across both frontier labs while Azure sells the compute underneath them. Market cap ≈ $3.1T.',
    openai: 'The center of gravity. OpenAI raised from Microsoft, Nvidia, Amazon and SoftBank while committing well over a trillion dollars to Oracle, Microsoft, AMD and Broadcom for compute. Last private valuation ≈ $852B.',
    anthropic: 'The maker of Claude is the only lab funded by three rival hyperscalers — Amazon, Google and Microsoft — and it buys cloud capacity from all of them. Series H valuation ≈ $965B.',
    google: 'The only player that owns every layer: Gemini models, Google Cloud, and TPUs co-designed with Broadcom. It also holds up to $40B of Anthropic. Market cap ≈ $4.6T.',
    amazon: 'Anthropic’s biggest early backer. AWS plus Trainium is the most credible alternative stack to Nvidia for frontier training. Market cap ≈ $2.9T.',
    meta: 'Buys from everyone — Nvidia GPUs, Broadcom custom chips, even Google TPUs are in talks — to feed open-weight Llama. 2026 capex guidance: $125–145B. Market cap ≈ $1.7T.',
    spacex: 'After absorbing xAI in February 2026 and going public in June, SpaceX rents Colossus supercomputer capacity to Google — and even to rival Anthropic. Market cap ≈ $2.0T.',
    nvidia: 'The kingmaker, and the world’s most valuable company at ≈ $5.2T. Stakes in OpenAI, Anthropic, xAI and Intel — money that largely returns as GPU purchase orders.',
    oracle: 'Stargate founding partner. A single $300B OpenAI contract turned Oracle Cloud Infrastructure into a hyperscaler overnight. Market cap ≈ $422B.',
    stargate: 'The $500B AI-infrastructure venture of SoftBank, OpenAI, Oracle and MGX. Roughly 7 GW planned, expanding to the UAE, Norway and Argentina.',
    broadcom: 'The quiet winner at ≈ $1.8T: it co-designs custom accelerators for Google, Meta and OpenAI, and powers Anthropic’s TPU ramp. Its overall AI revenue is projected near $46B in 2026.',
    amd: 'Its 6 GW OpenAI supply deal is paid partly in AMD’s own equity — warrants for roughly 10% of the company. Market cap ≈ $950B.',
    intel: 'Took $5B from Nvidia in September 2025 alongside a US government stake. The foundry wildcard of the map. Market cap ≈ $700B.',
  };

  // ── Deals ──
  // type 'eq' (equity: A holds a stake in B) or 'co' (commercial: A pays B).
  // lbl = compact figure drawn on the arrow. pts = hand-routed polyline.
  const DEALS = [
    // Equity
    { id: 'e-ms-openai', from: 'ms', to: 'openai', type: 'eq', amount: '27% stake', lbl: '27%', title: 'Microsoft → OpenAI', body: 'Roughly $13.8B invested since 2019 converted into a 27% stake (≈$135B) when OpenAI became a public benefit corporation in October 2025. Microsoft keeps IP access through 2032, but the April 2026 deal ended exclusivity and revenue sharing.', pts: [[216, 88], [236, 88]] },
    { id: 'e-nvda-openai', from: 'nvidia', to: 'openai', type: 'eq', amount: 'up to $100B', lbl: '≤$100B', lpos: [232, 192], title: 'Nvidia → OpenAI', body: 'Nvidia invests progressively as each of 10 GW of Nvidia systems is deployed. The largest of the "circular" deals: Nvidia’s cash comes back as GPU orders.', pts: [[232, 515], [232, 150], [236, 150]] },
    { id: 'e-amzn-anthropic', from: 'amazon', to: 'anthropic', type: 'eq', amount: '$13B + $20B pledged', lbl: '$13B+$20B', lpos: [462, 16], title: 'Amazon → Anthropic', body: '$13B invested, another $20B pledged on commercial milestones. A large share of Amazon’s recent "blowout" AI earnings came from marking up this stake.', pts: [[726, 40], [726, 16], [426, 16], [426, 40]] },
    { id: 'e-goog-anthropic', from: 'google', to: 'anthropic', type: 'eq', amount: 'up to $40B', lbl: '≤$40B', title: 'Google → Anthropic', body: 'The largest single commitment to an AI lab outside Microsoft–OpenAI. Google holds a minority, non-controlling stake, with $10B in now and the rest milestone-based.', pts: [[528, 88], [508, 88]] },
    { id: 'e-ms-anthropic', from: 'ms', to: 'anthropic', type: 'eq', amount: '≈$5B', lbl: '$5B', title: 'Microsoft → Anthropic', body: 'Early 2026: Microsoft invests in its flagship partner’s biggest rival, as part of a ~$15B round with Nvidia at a $350B valuation, tied to Anthropic buying Azure capacity.', pts: [[140, 40], [140, 31], [402, 31], [402, 40]] },
    { id: 'e-nvda-anthropic', from: 'nvidia', to: 'anthropic', type: 'eq', amount: '≈$10B', lbl: '$10B', title: 'Nvidia → Anthropic', body: 'Same early-2026 round. In parallel, Anthropic committed roughly $30B of Azure capacity running Nvidia systems — investor, supplier and beneficiary at once.', pts: [[352, 515], [352, 506], [374, 506], [374, 200], [382, 200]] },
    { id: 'e-openai-amd', from: 'openai', to: 'amd', type: 'eq', amount: 'warrants ≈10%', lbl: '≈10%', lpos: [762, 26], title: 'OpenAI → AMD', body: 'AMD supplies 6 GW of Instinct GPUs — and granted OpenAI warrants for up to ~160M shares (≈10% of AMD), vesting on deployment milestones. The supplier pays its customer in equity.', pts: [[344, 40], [344, 26], [804, 26], [804, 560], [820, 560]] },
    { id: 'e-nvda-intel', from: 'nvidia', to: 'intel', type: 'eq', amount: '$5B', lbl: '$5B', lpos: [870, 660], title: 'Nvidia → Intel', body: 'September 2025 stake, plus co-development of x86 CPUs with NVLink for AI data centers.', pts: [[300, 645], [300, 660], [1000, 660], [1000, 645]] },
    { id: 'e-nvda-xai', from: 'nvidia', to: 'spacex', type: 'eq', amount: '$2B', lbl: '$2B', title: 'Nvidia → xAI', body: 'Nvidia joined xAI’s $20B Series E (January 2026, $230B valuation). Weeks later SpaceX absorbed xAI in an all-stock deal valuing the pair at $1.25T.', pts: [[200, 645], [200, 672], [1104, 672], [1104, 250], [1092, 250]] },
    { id: 'e-openai-stargate', from: 'openai', to: 'stargate', type: 'eq', amount: 'founding equity', lbl: 'equity', title: 'OpenAI → Stargate', body: 'Stargate LLC is owned by SoftBank, OpenAI, Oracle and MGX, targeting $500B of AI infrastructure over four years.', pts: [[236, 270], [222, 270], [222, 448], [236, 448]] },
    { id: 'e-oracle-stargate', from: 'oracle', to: 'stargate', type: 'eq', amount: 'founding equity', lbl: 'equity', title: 'Oracle → Stargate', body: 'Oracle is both an equity partner in Stargate and its lead infrastructure builder.', pts: [[320, 400], [320, 412]] },
    // Commercial (payer → payee)
    { id: 'c-openai-oracle', from: 'openai', to: 'oracle', type: 'co', amount: '$300B / 5 yrs', lbl: '$300B', title: 'OpenAI pays Oracle', body: 'Confirmed September 2025: OpenAI buys $300B of Oracle Cloud compute over five years. Oracle’s backlog exploded — and so did its borrowing to build the data centers.', pts: [[270, 305], [270, 325]] },
    { id: 'c-openai-azure', from: 'openai', to: 'azure', type: 'co', amount: '$250B Azure', lbl: '$250B', title: 'OpenAI pays Microsoft', body: 'Part of the October 2025 restructuring: a $250B Azure commitment. In exchange, Microsoft gave up its right of first refusal on OpenAI’s compute.', pts: [[236, 120], [227, 120], [227, 380], [208, 380]] },
    { id: 'c-anthropic-aws', from: 'anthropic', to: 'aws', type: 'co', amount: '$100B / decade', lbl: '$100B', lpos: [614, 21], title: 'Anthropic pays Amazon', body: 'AWS is Anthropic’s primary training partner — over $100B committed to Amazon chips and cloud, including the Trainium-powered Project Rainier cluster.', pts: [[452, 40], [452, 21], [664, 21], [664, 400], [682, 400]] },
    { id: 'c-anthropic-gcloud', from: 'anthropic', to: 'gcloud', type: 'co', amount: '$200B / 5 yrs', lbl: '$200B', title: 'Anthropic pays Google', body: '$200B of Google Cloud over five years, plus up to 1 million TPUs and 5 GW of next-generation capacity (built with Broadcom) starting 2027.', pts: [[508, 270], [518, 270], [518, 380], [536, 380]] },
    { id: 'c-anthropic-azure', from: 'anthropic', to: 'azure', type: 'co', amount: '≈$30B', lbl: '$30B', lpos: [222, 322], title: 'Anthropic pays Microsoft', body: 'Bought alongside the Microsoft/Nvidia investment. Claude now runs on all three hyperscalers.', pts: [[382, 312], [218, 312], [218, 335], [208, 335]] },
    { id: 'c-openai-broadcom', from: 'openai', to: 'broadcom', type: 'co', amount: '10 GW custom chips', lbl: '10 GW', title: 'OpenAI pays Broadcom', body: 'Co-designed accelerators at 10 GW scale — OpenAI’s hedge against Nvidia dependence.', pts: [[346, 305], [346, 318], [370, 318], [370, 502], [390, 502], [390, 515]] },
    { id: 'c-google-broadcom', from: 'google', to: 'broadcom', type: 'co', amount: 'TPU co-design', lbl: 'TPUs', title: 'Google pays Broadcom', body: 'Broadcom has co-developed every TPU generation; the current agreement runs through 2031. Broadcom’s overall AI revenue is projected near $46B in 2026.', pts: [[536, 580], [508, 580]] },
    { id: 'c-meta-broadcom', from: 'meta', to: 'broadcom', type: 'co', amount: 'multi-GW to 2029', lbl: 'multi-GW', lpos: [560, 654], title: 'Meta pays Broadcom', body: 'Custom AI silicon partnership extended through 2029, starting above one gigawatt of accelerators.', pts: [[820, 280], [808, 280], [808, 654], [450, 654], [450, 645]] },
    { id: 'c-meta-nvidia', from: 'meta', to: 'nvidia', type: 'co', amount: '“millions” of GPUs', lbl: '10s of $B', title: 'Meta pays Nvidia', body: 'February 2026 expansion covering Grace Blackwell and future Vera Rubin platforms — reportedly worth tens of billions.', pts: [[820, 180], [812, 180], [812, 666], [150, 666], [150, 645]] },
    { id: 'c-anthropic-spacex', from: 'anthropic', to: 'spacex', type: 'co', amount: '$1.25B / month', lbl: '$1.25B/mo', title: 'Anthropic pays SpaceX', body: 'May 2026: SpaceX leased the entire 300 MW, 220,000-GPU Colossus 1 site in Memphis to Anthropic for $1.25B/month through 2029 — Musk renting his supercomputer to a direct rival.', pts: [[478, 40], [478, 11], [1032, 11], [1032, 40]] },
    { id: 'c-google-spacex', from: 'google', to: 'spacex', type: 'co', amount: '$920M / month', lbl: '$920M/mo', title: 'Google pays SpaceX', body: 'October 2026 through June 2029: about 110,000 Nvidia GPUs of Colossus capacity for Google, worth roughly $30B over its life.', pts: [[620, 40], [620, 6], [1060, 6], [1060, 40]] },
  ];

  const nodeById = {};
  NODES.forEach(n => { nodeById[n.id] = n; });
  const companyOf = id => { const n = nodeById[id]; return n && n.parent ? n.parent : id; };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const icon = (id, cx, y, size) =>
    ICONS[id] ? `<path class="aiw-icon" transform="translate(${cx - size / 2},${y}) scale(${size / 24})" d="${ICONS[id]}"/>` : '';

  // Pick the clearest point on a polyline for its label: the midpoint of the
  // longest horizontal run if one is long enough, otherwise the longest segment.
  function labelPos(pts) {
    let best = null, bestLen = -1, bestH = null, bestHLen = -1;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len > bestLen) { bestLen = len; best = [(x1 + x2) / 2, (y1 + y2) / 2]; }
      if (y1 === y2 && len > bestHLen) { bestHLen = len; bestH = [(x1 + x2) / 2, (y1 + y2) / 2]; }
    }
    return (bestH && bestHLen >= 26) ? bestH : best;
  }

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
      svg += icon(n.id, cx, 50, 22);
      svg += `<text x="${cx}" y="92" class="aiw-name" text-anchor="middle">${esc(n.label)}</text>`;
      if (n.mcap) svg += `<text x="${cx}" y="111" class="aiw-mcap" text-anchor="middle">${esc(n.mcap)}</text>`;
      if (n.cap) svg += `<text x="${cx}" y="127" class="aiw-cap" text-anchor="middle">${esc(n.cap)}</text>`;
    } else if (n.kind === 'solo' && ICONS[n.id] && n.h >= 100) {
      svg += icon(n.id, cx, n.y + 16, 22);
      svg += `<text x="${cx}" y="${n.y + 72}" class="aiw-name" text-anchor="middle">${esc(n.label)}</text>`;
      if (n.mcap) svg += `<text x="${cx}" y="${n.y + 91}" class="aiw-mcap" text-anchor="middle">${esc(n.mcap)}</text>`;
      if (n.cap) svg += `<text x="${cx}" y="${n.y + 107}" class="aiw-cap" text-anchor="middle">${esc(n.cap)}</text>`;
    } else if (n.kind === 'solo' && ICONS[n.id]) {
      svg += icon(n.id, cx, n.y + 8, 14);
      svg += `<text x="${cx}" y="${n.y + 41}" class="aiw-name sm" text-anchor="middle">${esc(n.label)}</text>`;
      if (n.mcap) svg += `<text x="${cx}" y="${n.y + 60}" class="aiw-mcap" text-anchor="middle">${esc(n.mcap)}</text>`;
    } else {
      const cy = n.y + n.h / 2 + (n.cap ? -3 : 4);
      svg += `<text x="${cx}" y="${cy}" class="aiw-name ${n.kind === 'sub' ? 'sm' : ''}" text-anchor="middle">${esc(n.label)}</text>`;
      if (n.cap) svg += `<text x="${cx}" y="${cy + 17}" class="aiw-cap" text-anchor="middle">${esc(n.cap)}</text>`;
    }
    svg += '</g>';
  });

  // Deal edges
  DEALS.forEach(d => {
    const pline = d.pts.map(p => p.join(',')).join(' ');
    svg += `<g class="aiw-edge aiw-${d.type}" data-deal="${d.id}">`
      + `<polyline points="${pline}" class="aiw-edge-line" marker-end="url(#aiw-arr-${d.type})"/>`
      + `<polyline points="${pline}" class="aiw-edge-hit"/>`
      + '</g>';
  });

  // Deal amount labels (drawn on top of edges so they stay legible)
  DEALS.forEach(d => {
    const [lx, ly] = d.lpos || labelPos(d.pts);
    const w = d.lbl.length * 5.4 + 10;
    svg += `<g class="aiw-lbl aiw-${d.type}" data-deal="${d.id}">`
      + `<rect x="${(lx - w / 2).toFixed(1)}" y="${(ly - 7).toFixed(1)}" width="${w.toFixed(1)}" height="14" rx="3"/>`
      + `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="middle">${esc(d.lbl)}</text>`
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
    + '<span class="aiw-hint">Node = market cap · arrow = deal size · click for detail</span>';

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
      let html = `<h4 class="aiw-panel-title">${esc(n.label)}${n.mcap ? ` <span class="aiw-panel-mcap">${esc(n.mcap)}</span>` : ''}</h4>`;
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
    // filters (edges + labels)
    svgEl.querySelectorAll('.aiw-edge, .aiw-lbl').forEach(g => {
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
    svgEl.querySelectorAll('.aiw-edge, .aiw-lbl').forEach(g => {
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
  svgEl.querySelectorAll('.aiw-edge, .aiw-lbl').forEach(g => {
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
