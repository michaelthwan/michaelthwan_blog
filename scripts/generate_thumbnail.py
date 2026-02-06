"""Generate a simple trimodal histogram thumbnail as SVG, then rasterize to PNG."""
import os

# Generate SVG thumbnail
svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
  <rect width="600" height="360" fill="#fafafa"/>

  <!-- Title -->
  <text x="300" y="36" text-anchor="middle" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="#333">Trimodal Tech Compensation</text>

  <!-- Axes -->
  <line x1="60" y1="300" x2="560" y2="300" stroke="#ccc" stroke-width="1"/>
  <line x1="60" y1="50" x2="60" y2="300" stroke="#ccc" stroke-width="1"/>

  <!-- Tier 1 bars (blue-gray) - peak around 100-125K -->
  <rect x="70" y="260" width="30" height="40" fill="#78909c" rx="1"/>
  <rect x="105" y="180" width="30" height="120" fill="#78909c" rx="1"/>
  <rect x="140" y="100" width="30" height="200" fill="#78909c" rx="1"/>
  <rect x="175" y="140" width="30" height="160" fill="#78909c" rx="1"/>
  <rect x="210" y="220" width="30" height="80" fill="#78909c" rx="1"/>
  <rect x="245" y="270" width="30" height="30" fill="#78909c" rx="1"/>

  <!-- Tier 2 bars (orange) - peak around 200-250K -->
  <rect x="210" y="190" width="30" height="30" fill="#e07b39" rx="1"/>
  <rect x="245" y="180" width="30" height="90" fill="#e07b39" rx="1"/>
  <rect x="280" y="120" width="30" height="180" fill="#e07b39" rx="1"/>
  <rect x="315" y="100" width="30" height="200" fill="#e07b39" rx="1"/>
  <rect x="350" y="140" width="30" height="160" fill="#e07b39" rx="1"/>
  <rect x="385" y="200" width="30" height="100" fill="#e07b39" rx="1"/>
  <rect x="420" y="240" width="30" height="60" fill="#e07b39" rx="1"/>

  <!-- Tier 3 bars (green) - peak around 300-400K -->
  <rect x="315" y="70" width="30" height="30" fill="#5a9f68" rx="1"/>
  <rect x="350" y="80" width="30" height="60" fill="#5a9f68" rx="1"/>
  <rect x="385" y="110" width="30" height="90" fill="#5a9f68" rx="1"/>
  <rect x="420" y="130" width="30" height="110" fill="#5a9f68" rx="1"/>
  <rect x="455" y="160" width="30" height="140" fill="#5a9f68" rx="1"/>
  <rect x="490" y="200" width="30" height="100" fill="#5a9f68" rx="1"/>
  <rect x="525" y="240" width="30" height="60" fill="#5a9f68" rx="1"/>

  <!-- X-axis labels -->
  <text x="90" y="320" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#999">$50K</text>
  <text x="200" y="320" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#999">$150K</text>
  <text x="310" y="320" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#999">$250K</text>
  <text x="420" y="320" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#999">$400K</text>
  <text x="540" y="320" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#999">$600K+</text>

  <!-- Legend -->
  <rect x="140" y="338" width="12" height="12" fill="#78909c" rx="2"/>
  <text x="156" y="349" font-family="Inter, sans-serif" font-size="11" fill="#666">Tier 1</text>
  <rect x="250" y="338" width="12" height="12" fill="#e07b39" rx="2"/>
  <text x="266" y="349" font-family="Inter, sans-serif" font-size="11" fill="#666">Tier 2</text>
  <rect x="360" y="338" width="12" height="12" fill="#5a9f68" rx="2"/>
  <text x="376" y="349" font-family="Inter, sans-serif" font-size="11" fill="#666">Tier 3</text>
</svg>'''

out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'astro-blog', 'public', 'img', 'tech-comp')
os.makedirs(out_dir, exist_ok=True)

svg_path = os.path.join(out_dir, 'trimodal-thumbnail.svg')
with open(svg_path, 'w') as f:
    f.write(svg)

print(f"SVG thumbnail written to {svg_path}")

# Try to convert to PNG if cairosvg is available
try:
    import cairosvg
    png_path = os.path.join(out_dir, 'trimodal-thumbnail.png')
    cairosvg.svg2png(bytestring=svg.encode(), write_to=png_path, output_width=600, output_height=360)
    print(f"PNG thumbnail written to {png_path}")
except ImportError:
    print("cairosvg not installed — using SVG as fallback")
    # Copy SVG content as a simple HTML-rendered PNG placeholder
    # The SVG will work as a thumbnail too
