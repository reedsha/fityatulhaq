import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\reference-homepage.jpg';

async function main() {
  console.log('=== FULL PALETTE + STRUCTURE EXTRACTION ===\n');
  
  const imgRef = sharp(inputPath);
  const meta = await imgRef.metadata();
  console.log(`Image: ${meta.width} × ${meta.height} px (${(meta.width * meta.height / 1e6).toFixed(2)} MP)`);
  
  // Strategy: Sample 20px×20px patches every 300px vertically, 5 columns across width
  // This gives ~60 samples covering the entire 9105px page
  
  const results = [];
  const sampleWidth = meta.width;
  const cols = [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9]; // 7 positions horizontally
  
  // Sample every 300px from 0 to 9105
  for (let y = 0; y < meta.height; y += 300) {
    for (const colRatio of cols) {
      const x = Math.floor(colRatio * sampleWidth);
      
      try {
        const buffer = await imgRef
          .extract({ left: Math.min(x, sampleWidth - 20), top: Math.min(y, meta.height - 20), width: 20, height: 20 })
          .raw()
          .toBuffer();
        
        // Average pixel values
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < buffer.length; i += 3) {
          r += buffer[i];
          g += buffer[i + 1];
          b += buffer[i + 2];
          count++;
        }
        
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max > 0 ? ((max - min) / max * 100) : 0;
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255 * 100;
        const hueCalc = max === 0 ? -1 : 
          max === min ? 0 :
          max === r ? (g - b) / (max - min) * 60 :
          max === g ? (2 + (b - r) / (max - min)) * 60 :
          (4 + (r - g) / (max - min)) * 60;
        
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        
        // Classify
        let category = 'other';
        if (sat < 10 && lum > 90) category = 'white/background';
        else if (sat < 10 && lum > 75) category = 'light-gray/surface';
        else if (sat < 10 && lum <= 75 && lum >= 40) category = 'gray-text/subtle';
        else if (sat < 10 && lum < 40) category = 'dark-text/headings';
        else if (sat > 30 && lum > 30 && lum < 70) category = 'accent/color';
        else if (lum < 25) category = 'dark-surface/footer';
        else if (lum > 85) category = 'near-white';
        
        results.push({
          y: y,
          x: x,
          colRatio: colRatio,
          hex,
          rgb: `${r}, ${g}, ${b}`,
          saturation: sat.toFixed(0),
          luminance: lum.toFixed(0),
          hue: hueCalc >= 0 ? hueCalc.toFixed(0) : '-',
          category
        });
      } catch (e) {}
    }
  }
  
  // Group by category
  const byCategory = {};
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  }
  
  // Get unique colors per category
  const uniquePerCategory = {};
  for (const [cat, items] of Object.entries(byCategory)) {
    const hexSet = [...new Set(items.map(i => i.hex))].sort((a, b) => {
      // Sort by lightness within same hex set
      return parseInt(b.slice(1, 7), 16) - parseInt(a.slice(1, 7), 16);
    }).slice(0, 20); // Top 20 per category
    
    uniquePerCategory[cat] = hexSet;
  }
  
  // Print structured output
  console.log('\n── UNIQUE COLORS BY CATEGORY ──\n');
  for (const [cat, colors] of Object.entries(uniquePerCategory).sort((a, b) => b[1].length - a[1].length)) {
    if (colors.length <= 3) continue; // Skip categories with < 3 colors
    console.log(`\n${cat.toUpperCase()} (${colors.length} unique):`);
    for (const c of colors.slice(0, 8)) {
      console.log(`  ${c}`);
    }
  }
  
  // Output CSS variables
  console.log('\n── SUGGESTED CSS VARIABLES ──\n');
  const cssVars = {};
  
  // Pick representative bg (most frequent light color)
  if (uniquePerCategory['white/background']) {
    cssVars['--bg-primary'] = uniquePerCategory['white/background'][0];
  }
  if (uniquePerCategory['light-gray/surface']) {
    cssVars['--surface-secondary'] = uniquePerCategory['light-gray/surface'][0];
  }
  if (uniquePerCategory['dark-surface/footer']) {
    cssVars['--bg-footer'] = uniquePerCategory['dark-surface/footer'][0];
  }
  
  // Text hierarchy
  if (uniquePerCategory['dark-text/headings']) {
    cssVars['--text-primary'] = uniquePerCategory['dark-text/headings'][0];
    cssVars['--text-heading'] = uniquePerCategory['dark-text/headings'][0];
  }
  if (uniquePerCategory['gray-text/subtle']) {
    cssVars['--text-secondary'] = uniquePerCategory['gray-text/subtle'][0];
  }
  
  // Accent colors
  if (uniquePerCategory['accent/color']) {
    cssVars['--color-brand'] = uniquePerCategory['accent/color'][0];
  }
  // Secondary accent (if multiple colored groups exist)
  const brandColor = cssVars['--color-brand'];
  if (brandColor && uniquePerCategory['accent/color'].length > 1) {
    const secondAccent = uniquePerCategory['accent/color'][1];
    if (secondAccent !== brandColor) {
      cssVars['--color-accent-secondary'] = secondAccent;
    }
  }
  
  // Fallbacks for common patterns
  if (!cssVars['--bg-primary']) cssVars['--bg-primary'] = '#FFFFFF';
  if (!cssVars['--text-primary']) cssVars['--text-primary'] = '#1A1A1A';
  
  console.log(JSON.stringify(cssVars, null, 2));
  
  // Write full report
  const report = `# FityatulHaq Design Token Extraction\n
## Image Analysis
- Dimensions: \`${meta.width} × ${meta.height}\` px
- Total size: ${(meta.width * meta.height / 1e6).toFixed(2)} megapixels
- Format: JPEG

## Extracted Palette

### Background & Surface Colors
${Object.entries({
  primary: uniquePerCategory['white/background'],
  secondary: uniquePerCategory['light-gray/surface'],
  footer: uniquePerCategory['dark-surface/footer']
}).map(([name, colors]) => colors?.length > 0 ? `- **${name}:** ${colors.slice(0, 5).map(c => `\`${c}\``).join(', ')}` : '').filter(Boolean).join('\n')}

### Text Colors
${Object.entries({
  heading: uniquePerCategory['dark-text/headings'],
  body: uniquePerCategory['gray-text/subtle']
}).map(([name, colors]) => colors?.length > 0 ? `- **${name}:** ${colors.slice(0, 5).map(c => `\`${c}\``).join(', ')}` : '').filter(Boolean).join('\n')}

### Accent Colors
- **Primary:** ${uniquePerCategory['accent.color']?.[0] || 'Not detected'}
${uniquePerCategory['accent/color']?.length > 1 ? `- **Secondary:** ${uniquePerCategory['accent/color'].slice(1, 3).map(c => `\`${c}\``).join(', ')}` : ''}

## Generated CSS Variables
\`\`\`css
:root {
${Object.entries(cssVars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}
}
\`\`\`

## Raw Sample Data
Samples: ${results.length} total | Unique categories: ${Object.keys(uniquePerCategory).filter(c => uniquePerCategory[c].length > 3).length}
`;

  fs.writeFileSync('C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\scripts\\full-extract-report.md', report);
  
  // Also write JSON version
  const jsonOutput = {
    metadata: { width: meta.width, height: meta.height },
    uniqueColorsByCategory,
    cssVariables: cssVars,
    totalSamples: results.length
  };
  fs.writeFileSync('C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\scripts\\design-tokens-extracted.json', JSON.stringify(jsonOutput, null, 2));
  
  console.log('\n✅ Report written to scripts/full-extract-report.md');
  console.log('✅ JSON tokens written to scripts/design-tokens-extracted.json');
}

main().catch(err => {
  console.error('Fatal:', err.message, err.stack);
  process.exit(1);
});
