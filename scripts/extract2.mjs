import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\reference-homepage.jpg';

async function main() {
  console.log('=== FULL PALETTE EXTRACTION v2 ===');
  
  const imgRef = sharp(inputPath);
  const meta = await imgRef.metadata();
  console.log(`Image: ${meta.width} × ${meta.height} px\n`);
  
  // Sample patches: every 400px vertical, 7 horizontal positions
  const cols = [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9];
  const samples = [];
  
  for (let y = 0; y < meta.height; y += 400) {
    for (const colRatio of cols) {
      const x = Math.floor(colRatio * meta.width);
      try {
        const buffer = await imgRef
          .extract({ 
            left: Math.min(x, meta.width - 20), 
            top: Math.min(y, meta.height - 20), 
            width: 20, height: 20 
          })
          .raw().toBuffer();
        
        let r=0, g=0, b=0, n=0;
        for (let i = 0; i < buffer.length; i += 3) {
          r += buffer[i]; g += buffer[i+1]; b += buffer[i+2]; n++;
        }
        r = Math.round(r/n); g = Math.round(g/n); b = Math.round(b/n);
        
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        const sat = max > 0 ? ((max-min)/max*100) : 0;
        const lum = (0.299*r + 0.587*g + 0.114*b)/255*100;
        const hex = '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
        
        let cat = 'neutral-light';
        if (lum > 88) cat = 'white-bg';
        else if (lum > 75 && sat < 15) cat = 'light-surface';
        else if (lum >= 40 && lum <= 75 && sat < 15) cat = 'gray-text';
        else if (lum < 40 && sat < 15) cat = 'dark-text';
        else if (sat > 25 && lum > 25 && lum < 75) cat = 'accent-color';
        else if (lum < 30 && sat > 15) cat = 'dark-footer';
        else cat = 'other';
        
        samples.push({ y, x, hex, rgb:`${r},${g},${b}`, sat:Math.round(sat), lum:Math.round(lum), cat });
      } catch(e) {}
    }
  }
  
  // Group unique colors by category
  const byCat = {};
  for (const s of samples) {
    if (!byCat[s.cat]) byCat[s.cat] = new Set();
    byCat[s.cat].add(s.hex);
  }
  
  // Print results
  for (const [cat, hexes] of Object.entries(byCat)) {
    if (hexes.size < 2) continue;
    console.log(`\n── ${cat.toUpperCase()} (${hexes.size} unique colors) ──`);
    [...hexes].sort().slice(0, 12).forEach(h => console.log(`  ${h}`));
  }
  
  // Output CSS variables JSON
  const cssVars = {};
  
  // Background
  const whiteBgs = [...(byCat['white-bg'] || [])];
  const lightSurfaces = [...(byCat['light-surface'] || [])];
  const darkTexts = [...(byCat['dark-text'] || [])];
  const grayTexts = [...(byCat['gray-text'] || [])];
  const accents = [...(byCat['accent-color'] || [])];
  const footerBg = [...(byCat['dark-footer'] || [])];
  
  cssVars['--bg-primary'] = whiteBgs[0] || '#FFFFFF';
  cssVars['--surface-secondary'] = lightSurfaces[0] || '#F5F5F5';
  cssVars['--text-primary-heading'] = darkTexts[0] || '#1A1A1A';
  cssVars['--text-body'] = grayTexts[0] || '#6B7280';
  cssVars['--bg-footer'] = footerBg[0] || '#232834';
  cssVars['--color-brand'] = accents[0] || null;
  
  if (accents.length > 1) {
    cssVars['--color-accent-secondary'] = accents[1];
  }
  
  if (darkTexts.length > 1) {
    cssVars['--text-inverted'] = darkTexts[darkTexts.length-1];
  }
  
  // Also extract gradients by checking adjacent patches
  const gradients = [];
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i-1], curr = samples[i];
    if (prev.y !== curr.y - 400) continue;
    if (prev.cat === 'accent-color' && curr.cat === 'accent-color') {
      if (prev.hex !== curr.hex) {
        gradients.push({ from: prev.hex, to: curr.hex, atY: curr.y });
      }
    }
  }
  
  if (gradients.length > 0) {
    cssVars['--gradient-detected'] = gradients.slice(0, 3).map(g => `${g.from} → ${g.to} at Y${g.y}`).join(', ');
  }
  
  console.log('\n── CSS VARIABLES ──');
  for (const [k,v] of Object.entries(cssVars)) {
    if (v) console.log(`${k}: ${v};`);
  }
  
  // Write output
  fs.writeFileSync('C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\scripts\\design-tokens-v2.json', JSON.stringify({
    metadata: { w: meta.width, h: meta.height },
    uniqueColorsByCategory: Object.fromEntries(Object.entries(byCat).map(([k,v]) => [k, [...v].sort()])),
    cssVariables: cssVars,
    totalSamples: samples.length
  }, null, 2));
  
  // Markdown report
  let md = `# FityatulHaq Design Tokens\n\n`;
  md += `## Palette Summary\n\n`;
  for (const [cat, hexes] of Object.entries(byCat)) {
    if (hexes.size < 2) continue;
    md += `**${cat}:** ${[...hexes].slice(0,8).map(h=>`\`${h}\``).join(', ')}\n\n`;
  }
  
  md += `## CSS Variables\n\n\`\`\`css\n:root {\n`;
  for (const [k,v] of Object.entries(cssVars)) {
    if (v) md += `  ${k}: ${v};\n`;
  }
  md += `}\n\`\`\`\n`;
  
  fs.writeFileSync('C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\scripts\\design-tokens-report.md', md);
  console.log('\n✅ Wrote design-tokens-v2.json and design-tokens-report.md');
}

main();
