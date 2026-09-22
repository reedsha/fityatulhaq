import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\reference-homepage.jpg';

// First resize to manageable dimensions while preserving aspect ratio
async function main() {
  console.log('Starting extraction...\n');
  
  const imgRef = sharp(inputPath);
  const meta = await imgRef.metadata();
  console.log(`Original: ${meta.width} × ${meta.height}px\n`);
  
  // Resize to ~700px wide keeping proportions (9105/4000 * 700 ≈ 1593)
  const targetWidth = 700;
  const resizedPath = 'C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\scripts\\ref-resized.jpg';
  
  await imgRef.resize(targetWidth, null, { withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(resizedPath);
  const resizedMeta = await sharp(resizedPath).metadata();
  console.log(`Resized: ${resizedMeta.width} × ${resizedMeta.height}px\n`);
  
  // Now sample generously across the resized image
  const samples = [];
  const cols = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]; // 9 positions
  
  for (let y = 0; y < resizedMeta.height; y += 100) {
    for (const colRatio of cols) {
      const x = Math.floor(colRatio * resizedMeta.width);
      
      try {
        const buffer = await sharp(resizedPath)
          .extract({ 
            left: Math.min(x, resizedMeta.width - 20), 
            top: Math.min(y, resizedMeta.height - 20), 
            width: 20, height: 20 
          })
          .raw().toBuffer();
        
        if (!buffer || buffer.length === 0) continue;
        
        let r=0, g=0, b=0, n=0;
        for (let i = 0; i < buffer.length; i += 3) {
          r += buffer[i]; g += buffer[i+1]; b += buffer[i+2]; n++;
        }
        
        if (n === 0) continue;
        
        r = Math.round(r/n); g = Math.round(g/n); b = Math.round(b/n);
        
        const max = Math.max(r,g,b), min = Math.min(r,g,b);
        const sat = max > 0 ? ((max-min)/max*100) : 0;
        const lum = (0.299*r + 0.587*g + 0.114*b)/255*100;
        const hex = '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
        
        let cat = 'neutral';
        if (lum > 88 && sat < 10) cat = 'white-bg';
        else if (lum > 72 && sat < 20) cat = 'light-surface';
        else if (lum >= 35 && lum <= 75 && sat < 20) cat = 'gray-text';
        else if (lum < 35 && sat < 20) cat = 'dark-text';
        else if (sat > 25 && lum > 25 && lum < 75) cat = 'accent-color';
        else if (lum < 30 && sat > 10) cat = 'dark-footer';
        else cat = 'other';
        
        samples.push({ y, x, hex, rgb:`${r},${g},${b}`, sat:Math.round(sat), lum:Math.round(lum), cat });
      } catch(e) {}
    }
  }
  
  console.log(`Total valid samples: ${samples.length}\n`);
  
  // Group by category
  const byCat = {};
  for (const s of samples) {
    if (!byCat[s.cat]) byCat[s.cat] = new Set();
    byCat[s.cat].add(s.hex);
  }
  
  // Print results
  console.log('── COLORS BY CATEGORY ──\n');
  for (const [cat, hexes] of Object.entries(byCat)) {
    if (hexes.size < 2) {
      console.log(`${cat}: ${[...hexes].join(', ')}`);
    } else {
      console.log(`${cat.toUpperCase()} (${hexes.size} unique):`);
      [...hexes].sort().slice(0, 12).forEach(h => console.log(`  ${h}`));
      console.log();
    }
  }
  
  // Build CSS variables
  const cssVars = {};
  const whiteBgs = [...(byCat['white-bg'] || [])];
  const lightSurfaces = [...(byCat['light-surface'] || [])];
  const darkTexts = [...(byCat['dark-text'] || [])].sort((a,b) => parseInt(a,16) - parseInt(b,16));
  const grayTexts = [...(byCat['gray-text'] || [])].sort((a,b) => parseInt(a,16) - parseInt(b,16));
  const accents = [...(byCat['accent-color'] || [])];
  const footerBg = [...(byCat['dark-footer'] || [])];
  
  cssVars['--bg-primary'] = whiteBgs[0] || '#FFFFFF';
  cssVars['--surface-secondary'] = lightSurfaces[0] || '#F5F5F5';
  cssVars['--text-heading'] = darkTexts[0] || '#1A1A1A';
  cssVars['--text-body'] = grayTexts[Math.floor(grayTexts.length/2)] || '#6B7280';
  cssVars['--bg-footer'] = footerBg[0] || '#232834';
  cssVars['--color-brand'] = accents[0] || null;
  
  if (accents.length > 1) {
    cssVars['--color-accent-2'] = accents.sort((a,b)=>parseInt(a,16)-parseInt(b,16))[1];
  }
  
  console.log('\n── GENERATED CSS VARIABLES ──\n');
  for (const [k,v] of Object.entries(cssVars)) {
    console.log(`${k}: ${v || 'N/A'}`);
  }
  
  // Write outputs
  const output = {
    metadata: { origW: meta.width, origH: meta.height, resizedW: resizedMeta.width, resizedH: resizedMeta.height },
    uniqueColorsByCategory: Object.fromEntries(Object.entries(byCat).map(([k,v]) => [k, [...v].sort()])),
    cssVariables: cssVars,
    totalSamples: samples.length
  };
  
  fs.writeFileSync('C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\scripts\\design-tokens-v3.json', JSON.stringify(output, null, 2));
  
  let md = `# FityatulHaq Design Tokens\n\n`;
  md += `## Original Screenshot: ${meta.width} × ${meta.height}px → Resized: ${resizedMeta.width} × ${resizedMeta.height}px\n\n`;
  md += `**Total samples:** ${samples.length} | **Categories found:** ${Object.keys(byCat).filter(k=>byCat[k].size>=2).length}\n\n`;
  
  for (const [cat, hexes] of Object.entries(byCat)) {
    if (hexes.size < 2) continue;
    md += `**${cat}:** ${[...hexes].slice(0,8).map(h=>`\`${h}\``).join(', ')}\n\n`;
  }
  
  md += `\n## CSS Variables\n\`\`\`css\n:root {\n`;
  for (const [k,v] of Object.entries(cssVars)) {
    if (v) md += `  ${k}: ${v};\n`;
  }
  md += `}\n\`\`\`\n`;
  
  fs.writeFileSync('C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\scripts\\tokens-report.md', md);
  console.log('\n✅ Wrote design-tokens-v3.json and tokens-report.md');
}

main().catch(err => console.error('ERROR:', err.message, err.stack));
