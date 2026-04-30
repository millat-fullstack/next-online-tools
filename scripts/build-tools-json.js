#!/usr/bin/env node
/* eslint-env node */
/* global process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOOLS_DIR = path.join(__dirname, '..', 'src', 'tools');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'tools.json');

const ICON_MAPPING = {
  'Image Tools': {
    'compressor': 'Image',
    'resizer': 'Crop',
    'webp-to-jpg': 'ImagePlus',
    'pdf-to-jpg': 'FileText',
    'jpg-to-pdf': 'FileText',
    'cropper': 'Crop'
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
  },
  'Document Tools': {
    'csv': 'FileSpreadsheet',
    'xls': 'FileSpreadsheet',
    'converter': 'FileSpreadsheet'
  }
};

const DEFAULT_ICON = 'Wrench';
const TRENDING_TOOLS = [
  'image-compressor',
  'case-converter',
  'color-preview',
  'webp-to-jpg-converter',
  'pdf-to-jpg-converter',
  'text-to-slug-generator',
  'csv-to-xls-converter',
  'jpg-to-pdf-converter'
];

/**
 * Extract a quoted string value from toolData
 */
function extractQuotedValue(content, pattern) {
  const regex = new RegExp(pattern);
  const match = content.match(regex);
  if (match && match[1]) {
    return match[1]
      .replace(/^["'`]/, '')
      .replace(/["'`]$/, '')
      .trim();
  }
  return '';
}

/**
 * Extract toolData from a component file using regex
 */
function extractToolData(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the toolData object
    const toolDataMatch = content.match(/export\s+const\s+toolData\s*=\s*\{[\s\S]*?\};/);
    if (!toolDataMatch) {
      return null;
    }

    const toolDataStr = toolDataMatch[0];
    
    const toolData = {};
    
    // Extract title
    const titleMatch = toolDataStr.match(/title\s*:\s*["'`]([^"'`]+)["'`]/);
    toolData.title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract path
    const pathMatch = toolDataStr.match(/path\s*:\s*["'`]([^"'`]+)["'`]/);
    toolData.path = pathMatch ? pathMatch[1].trim() : '';
    
    // Extract category
    const categoryMatch = toolDataStr.match(/category\s*:\s*["'`]([^"'`]+)["'`]/);
    toolData.category = categoryMatch ? categoryMatch[1].trim() : '';
    
    // Extract description (may be multiline, so match until next comma)
    const descriptionMatch = toolDataStr.match(/description\s*:\s*["'`]([\s\S]*?)["'`]\s*[,}]/);
    toolData.description = descriptionMatch ? descriptionMatch[1].trim().replace(/\n\s+/g, ' ') : '';
    
    if (!toolData.path) {
      return null;
    }
    
    return toolData;
  } catch (error) {
    console.warn(`Error reading ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

/**
 * Normalize tool ID from path
 */
function normalizeToolId(toolPath) {
  if (!toolPath) return "";
  return toolPath
    .replace(/^\//, "")
    .replace(/^tool\//, "")
    .replace(/\/$/, "");
}

/**
 * Get icon for a tool
 */
function getIcon(toolData) {
  const category = toolData.category;
  const name = toolData.title?.toLowerCase() || '';
  const id = normalizeToolId(toolData.path);

  if (ICON_MAPPING[category]) {
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
  const id = normalizeToolId(toolData.path);
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

  const toolFiles = fs.readdirSync(TOOLS_DIR)
    .filter(file => file.endsWith('.jsx'))
    .map(file => path.join(TOOLS_DIR, file));

  console.log(`📁 Found ${toolFiles.length} tool files`);

  const tools = [];

  for (const filePath of toolFiles) {
    const fileName = path.basename(filePath);
    console.log(`📄 Processing ${fileName}`);

    const toolData = extractToolData(filePath);
    if (toolData && toolData.title && toolData.path) {
      const toolJson = convertToToolsFormat(toolData);
      tools.push(toolJson);
      console.log(`✅ Added: ${toolJson.name} (${toolJson.id})`);
    } else {
      console.warn(`⚠️  Skipped ${fileName} - missing toolData`);
    }
  }

  // Sort tools by name
  tools.sort((a, b) => a.name.localeCompare(b.name));

  // Write to file
  const jsonContent = JSON.stringify(tools, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf8');

  console.log(`\n✅ Generated tools.json with ${tools.length} tools!`);
}

buildToolsJson();

export { buildToolsJson };
