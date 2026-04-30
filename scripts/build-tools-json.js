#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

/**
 * Build script to automatically generate tools.json from tool components
 * Scans src/tools/ directory and extracts toolData from each component
 */

const TOOLS_DIR = path.join(__dirname, '..', 'src', 'tools');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'tools.json');

// Icon mapping based on tool categories and names
const ICON_MAPPING = {
  'Image Tools': {
    'compressor': 'Image',
    'resizer': 'Crop',
    'webp-to-jpg': 'ImagePlus',
    'pdf-to-jpg': 'FileText'
  },
  'Text Tools': {
    'converter': 'Type',
    'slug': 'Link'
  },
  'Design Tools': {
    'color': 'Palette',
    'picker': 'Palette',
    'preview': 'Droplets'
  },
  'File Conversion': {
    'converter': 'FileText'
  }
};

// Default icon for unknown tools
const DEFAULT_ICON = 'Wrench';

// Trending tools (can be configured)
const TRENDING_TOOLS = [
  'image-compressor',
  'case-converter',
  'color-preview',
  'webp-to-jpg-converter',
  'pdf-to-jpg-converter',
  'text-to-slug-generator'
];

/**
 * Extract toolData from a component file
 */
function extractToolData(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Find the toolData export
    const toolDataMatch = content.match(/export const toolData\s*=\s*({[\s\S]*?});/);
    if (!toolDataMatch) {
      console.warn(`No toolData found in ${filePath}`);
      return null;
    }

    // Extract the object content
    const toolDataStr = toolDataMatch[1];

    // Simple JSON-like parsing (handle basic cases)
    const toolData = {};
    const lines = toolDataStr.split('\n').map(line => line.trim()).filter(line => line);

    let currentKey = '';
    let currentValue = '';
    let inString = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Remove comments
      if (line.includes('//')) {
        line = line.split('//')[0].trim();
      }

      if (!line) continue;

      // Handle object start/end
      if (line.includes('{')) braceCount++;
      if (line.includes('}')) braceCount--;

      // Parse key-value pairs
      if (braceCount > 0) {
        if (line.includes(':')) {
          const [keyPart, ...valueParts] = line.split(':');
          const key = keyPart.replace(/['"]/g, '').trim();

          let value = valueParts.join(':').trim();

          // Handle multi-line strings
          if (value.startsWith('"') || value.startsWith("'")) {
            inString = true;
            currentKey = key;
            currentValue = value;
          } else if (value.startsWith('`')) {
            // Template literal
            currentKey = key;
            currentValue = value;
            // Find the end of template literal
            let j = i + 1;
            while (j < lines.length && !currentValue.includes('`')) {
              currentValue += '\n' + lines[j];
              j++;
            }
            i = j - 1;
          } else {
            // Simple value
            toolData[key] = value.replace(/[,'}]/g, '').trim();
          }
        } else if (inString && currentKey) {
          currentValue += '\n' + line;
          if (line.includes('"') || line.includes("'")) {
            inString = false;
            toolData[currentKey] = currentValue
              .replace(/['"`]/g, '')
              .replace(/,$/, '')
              .trim();
          }
        }
      }
    }

    return toolData;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get icon for a tool based on its category and name
 */
function getIcon(toolData) {
  const category = toolData.category;
  const name = toolData.title?.toLowerCase() || '';
  const id = toolData.path?.replace('/', '') || '';

  if (ICON_MAPPING[category]) {
    // Check for specific matches
    for (const [keyword, icon] of Object.entries(ICON_MAPPING[category])) {
      if (name.includes(keyword) || id.includes(keyword)) {
        return icon;
      }
    }
  }

  return DEFAULT_ICON;
}

/**
 * Convert toolData to tools.json format
 */
function convertToToolsFormat(toolData) {
  const id = toolData.path?.replace('/', '') || '';
  const name = toolData.title || '';
  const category = toolData.category || '';
  const description = toolData.description || '';
  const icon = getIcon(toolData);
  const trending = TRENDING_TOOLS.includes(id);
  const createdAt = new Date().toISOString();

  return {
    id,
    name,
    category,
    description,
    icon,
    trending,
    createdAt
  };
}

/**
 * Main build function
 */
function buildToolsJson() {
  console.log('🔍 Scanning tools directory...');
  console.log('TOOLS_DIR:', TOOLS_DIR);
  console.log('OUTPUT_FILE:', OUTPUT_FILE);

  const toolFiles = fs.readdirSync(TOOLS_DIR)
    .filter(file => file.endsWith('.jsx'))
    .map(file => path.join(TOOLS_DIR, file));

  console.log(`📁 Found ${toolFiles.length} tool files:`, toolFiles.map(f => path.basename(f)));

  const tools = [];

  for (const filePath of toolFiles) {
    console.log(`📄 Processing ${path.basename(filePath)}`);

    const toolData = extractToolData(filePath);
    if (toolData) {
      const toolJson = convertToToolsFormat(toolData);
      tools.push(toolJson);
      console.log(`✅ Added tool: ${toolJson.name}`);
    } else {
      console.warn(`⚠️  Skipped ${path.basename(filePath)} - no toolData found`);
    }
  }

  // Sort tools by name
  tools.sort((a, b) => a.name.localeCompare(b.name));

  // Write to file
  const jsonContent = JSON.stringify(tools, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf8');

  console.log(`\n🎉 Successfully generated tools.json with ${tools.length} tools!`);
  console.log(`📝 Output: ${OUTPUT_FILE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Running as main module');
  buildToolsJson();
}

export { buildToolsJson };