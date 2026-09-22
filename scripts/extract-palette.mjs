import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\reference-homepage.jpg';

// Sample 10px × 10px patches across the entire 9105px height
// We divide into sections based on typical website layout
const sections = [
  { name: 'header', top: 0, height: 80 },
  { name: 'hero-top', top: 80, height: 400 },
  { name: 'hero-mid', top: 500, height: 500 },
  { name: 'hero-bottom', top: 1020, height: 600 },
  { name: 'mid-section-1', top: 1650, height: 600 },
  { name: 'mid-section-2', top: 2270, height: 600 },
  { name: 'mid-section-3', top: 2890, height: 600 },
  { name: 'mid-section-4', top: 3510, height: 600 },
  { name: 'mid-section-5', top: 4130, height: 600 },
  { name: 'mid-section-6', top: 4750, height: 600 },
  { name: 'mid-section-7', top: 5370, height: 600 },
  { name: 'mid-section-8', top: 5990, height: 600 },
  { name: 'mid-section-9', top: 6610, height: 600 },
  { name: 'mid-section-10', top: 7230, height: 600 },
  { name: 'footer-top', top: 7850, height: 400 },
  { name: 'footer-bottom', top: 8250, height: 855 },
];

async function samplePatch(imgRef, section, row, col) {
  try {
    const { width } = await imgRef.metadata();
    const patchSize = 20;
    const x = Math.min(Math.floor(col * width / 10), width - patchSize);
    const y = Math.min(section.top + row * patchSize, 
      (await imgRef.metadata()).height - patchSize);
    
    if (y < 0 || x < 0) return null;
    
    const buffer = await imgRef
      .extract({ left: x, top: y, width: patchSize, height: patchSize })
      .raw()
      .toBuffer();
    
    // Average the pixel values
    let r = 0, g = 0, b = 0;
    let count = 0;
    for (let i = 0; i < buffer.length; i += 3) {
      r += buffer[i];
      g += buffer[i + 1];
      b += buffer[i + 2];
      count++;
    }
    
    if (count === 0) return null;
    
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    return { hex, rgb: `rgb(${r}, ${g}, ${b})` };
  } catch (e) {
    return null;
  }
}

async function analyze() {
  console.log('Loading image:', inputPath);
  
  const metadata = await sharp(inputPath).metadata();
  console.log(`Dimensions: ${metadata.width} × ${metadata.height}`);
  console.log(`Format: ${metadata.format}\n`);
  
  // Create one shared sharp instance
  const imgRef = sharp(inputPath);
  
  const allColors = new Map(); // hex → {name, positions: [{row, col}]}
  const sectionColors = {};
  
  for (const section of sections) {
    const colorsInSection = [];
    
    // Sample 10 columns evenly across the width
    const cols = 10;
    for (let col = 0; col < cols; col++) {
      // Sample 5 rows within each section's height range
      const sampleHeight = Math.max(1, Math.floor(section.height / 20));
      for (let row = 0; row < sampleHeight; row++) {
        const patchY = Math.floor(row * (section.height / sampleHeight));
        const result = await samplePatch(imgRef, section, patchY, col);
        
        if (result) {
          colorsInSection.push(result.hex);
          
          if (!allColors.has(result.hex)) {
            allColors.set(result.hex, []);
          }
          allColors.get(result.hex).push({
            section: section.name,
            row: patchY,
            col
          });
        }
      }
    }
    
    sectionColors[section.name] = colorsInSection;
  }
  
  // Analyze dominant colors by frequency
  const colorFrequency = [...allColors.entries()]
    .map(([hex, positions]) => ({
      hex,
      count: positions.length,
      sections: [...new Set(positions.map(p => p.section))]
    }))
    .sort((a, b) => b.count - a.count);
  
  console.log('\n═══════════════════════════════════════════');
  console.log('DOMINANT COLORS BY FREQUENCY (Top 30)');
  console.log('═══════════════════════════════════════════\n');
  
  // Categorize colors
  const bgColors = [];     // Background-like (low saturation)
  const textColors = [];   // Text-like (dark or gray)
  const accentColors = []; // High saturation / vibrant
  const surfaceColors = []; // Card/surface backgrounds
  
  for (const { hex, count, sections } of colorFrequency.slice(0, 50)) {
    const rgbMatch = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!rgbMatch) continue;
    
    const r = parseInt(rgbMatch[1], 16);
    const g = parseInt(rgbMatch[2], 16);
    const b = parseInt(rgbMatch[3], 16);
    
    // Calculate saturation (simple heuristic)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : ((max - min) / max * 100);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255 * 100;
    
    const category = sat < 10 && lum > 60 ? 'bg' :
                     sat < 10 && lum <= 60 ? 'text' :
                     sat > 50 ? 'accent' : 'surface';
    
    const catMap = {
      bg: bgColors,
      text: textColors,
      accent: accentColors,
      surface: surfaceColors
    };
    
    catMap[category].push({ hex, count, sections });
  }
  
  // Output structured results
  const results = {
    metadata: { width: metadata.width, height: metadata.height, format: metadata.format },
    palette: {
      background: bgColors.slice(0, 8),
      text: textColors.slice(0, 8),
      accent: accentColors.slice(0, 10),
      surface: surfaceColors.slice(0, 8)
    },
    colorFrequency: colorFrequency.slice(0, 50),
    perSection: Object.fromEntries(
      Object.entries(sectionColors).map(([name, colors]) => [
        name,
        [...new Set(colors)].slice(0, 20)
      ])
    ),
    cssVariables: {}
  };
  
  // Generate CSS variable suggestions
  const assignedNames = new Set();
  const addVar = (prefix, category, index) => {
    const varName = `--${prefix}-${category}${index}`;
    if (!assignedNames.has(varName)) {
      assignedNames.add(varName);
      return varName;
    }
    return `${varName}-alt`;
  };
  
  const assignCssVars = () => {
    const vars = results.cssVariables;
    
    // Background colors
    results.palette.background.forEach(({ hex }, i) => {
      vars[addVar('bg', 'background', i)] = hex;
    });
    
    // Surface colors
    results.palette.surface.forEach(({ hex }, i) => {
      vars[addVar('surface', 'card', i)] = hex;
    });
    
    // Text colors
    results.palette.text.forEach(({ hex }, i) => {
      vars[addVar('text', 'primary', i)] = hex;
    });
    
    // Accent colors
    results.palette.accent.forEach(({ hex }, i) => {
      const label = i === 0 ? 'primary' : i === 1 ? 'secondary' : i === 2 ? 'highlight' : `extra-${i}`;
      vars[addVar('color', label, i)] = hex;
    });
  };
  
  assignCssVars();
  
  // Write detailed report
  const reportLines = [];
  reportLines.push('# Color Palette Extraction Report');
  reportLines.push('');
  reportLines.push('## Image Metadata');
  reportLines.push('- Dimensions: `' + metadata.width + ' × ' + metadata.height + ' px`');
  reportLines.push('- Format: ' + metadata.format);
  reportLines.push('');
  reportLines.push('## Extracted Design Tokens');
  reportLines.push('');
  reportLines.push('```css');
  reportLines.push(':root {');
  for (const [name, value] of Object.entries(results.cssVariables)) {
    reportLines.push(`  ${name}: ${value};`);
  }
  reportLines.push('}');
  reportLines.push('```');
  reportLines.push('');
  
  reportLines.push('## Top Dominant Colors\n');
  reportLines.push('| Rank | Hex | Count | Sections |\n');
  reportLines.push('|------|-----|-------|----------|\n');
  for (const { hex, count, sections } of colorFrequency.slice(0, 30)) {
    reportLines.push(`| ${colorFrequency.indexOf({ hex, count, sections }) + 1} | \`${hex}\` | ${count} | ${sections.join(', ')} |\n`);
  }
  
  fs.writeFileSync('C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\scripts\\palette-report.md', reportLines.join('\n'));
  
  // Also output JSON for programmatic use
  fs.writeFileSync(
    'C:\\Users\\muham\\OneDrive\\Documents\\fityatulhaq\\scripts\\design-tokens.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\nReport written to scripts/palette-report.md');
  console.log('Design tokens written to scripts/design-tokens.json');
  console.log('\nCSS Variables Summary:');
  console.log(JSON.stringify(results.cssVariables, null, 2));
  
  process.exit(0);
}

analyze().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
