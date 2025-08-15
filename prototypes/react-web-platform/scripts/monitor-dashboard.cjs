#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function getTokenCount() {
  try {
    // Count CSS variables in both src/ and design-system/
    const srcCount = execSync("find src/ -name '*.css' -o -name '*.scss' | xargs grep -h 'var(--' 2>/dev/null | wc -l").toString().trim();
    const designSystemCount = execSync("find src/design-system/build/ -name '*.css' | xargs grep -h 'var(--' 2>/dev/null | wc -l").toString().trim();
    
    return {
      src: parseInt(srcCount) || 0,
      designSystem: parseInt(designSystemCount) || 0,
      total: (parseInt(srcCount) || 0) + (parseInt(designSystemCount) || 0)
    };
  } catch (error) {
    console.warn(colorize('⚠️  Warning: Could not count tokens accurately', 'yellow'));
    return { src: 0, designSystem: 0, total: 0 };
  }
}

function getBundleSize() {
  const tokensPath = 'src/design-system/build/dynamic/tokens.css';
  const indexPath = 'src/index.css';
  
  let sizes = {
    tokens: 0,
    index: 0,
    total: 0
  };
  
  try {
    if (fs.existsSync(tokensPath)) {
      sizes.tokens = fs.statSync(tokensPath).size;
    }
    if (fs.existsSync(indexPath)) {
      sizes.index = fs.statSync(indexPath).size;
    }
    sizes.total = sizes.tokens + sizes.index;
  } catch (error) {
    console.warn(colorize('⚠️  Warning: Could not read bundle sizes', 'yellow'));
  }
  
  return sizes;
}

function getFileCount() {
  try {
    // Count JSON files in token system
    const coreFiles = execSync("find src/design-system/tokens/core/ -name '*.json' 2>/dev/null | wc -l").toString().trim();
    const semanticFiles = execSync("find src/design-system/tokens/semantic/ -name '*.json' 2>/dev/null | wc -l").toString().trim();
    const componentFiles = execSync("find src/design-system/tokens/components/ -name '*.json' 2>/dev/null | wc -l").toString().trim();
    
    return {
      core: parseInt(coreFiles) || 0,
      semantic: parseInt(semanticFiles) || 0,
      components: parseInt(componentFiles) || 0,
      total: (parseInt(coreFiles) || 0) + (parseInt(semanticFiles) || 0) + (parseInt(componentFiles) || 0)
    };
  } catch (error) {
    return { core: 0, semantic: 0, components: 0, total: 0 };
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getStatusIcon(current, limit, reverse = false) {
  if (reverse) {
    return current >= limit ? '✅' : '❌';
  }
  return current <= limit ? '✅' : '❌';
}

function getStatusColor(current, limit, reverse = false) {
  if (reverse) {
    return current >= limit ? 'green' : 'red';
  }
  return current <= limit ? 'green' : 'red';
}

function generateReport() {
  const timestamp = new Date().toISOString();
  const tokenCount = getTokenCount();
  const bundleSize = getBundleSize();
  const fileCount = getFileCount();
  
  // Target limits from master plan
  const limits = {
    tokenCount: 40,
    bundleSize: 30 * 1024, // 30KB
    fileCount: 6 // Core(1) + Semantic(2) + Components(1) + Build(2)
  };
  
  console.log(colorize('\n🎯 Design Token System Health Dashboard', 'bold'));
  console.log(colorize('=' .repeat(50), 'cyan'));
  console.log(colorize(`📅 Last Check: ${timestamp}`, 'blue'));
  console.log('');
  
  // Token Count Analysis
  console.log(colorize('📊 TOKEN COUNT ANALYSIS', 'bold'));
  console.log(colorize('-'.repeat(25), 'cyan'));
  const tokenStatus = getStatusIcon(tokenCount.total, limits.tokenCount);
  const tokenColor = getStatusColor(tokenCount.total, limits.tokenCount);
  console.log(`Total Variables: ${colorize(tokenCount.total, tokenColor)}/${limits.tokenCount} ${tokenStatus}`);
  console.log(`├─ Source Files: ${tokenCount.src}`);
  console.log(`└─ Design System: ${tokenCount.designSystem}`);
  console.log('');
  
  // Bundle Size Analysis  
  console.log(colorize('📦 BUNDLE SIZE ANALYSIS', 'bold'));
  console.log(colorize('-'.repeat(25), 'cyan'));
  const bundleStatus = getStatusIcon(bundleSize.total, limits.bundleSize);
  const bundleColor = getStatusColor(bundleSize.total, limits.bundleSize);
  console.log(`Total Size: ${colorize(formatBytes(bundleSize.total), bundleColor)}/${formatBytes(limits.bundleSize)} ${bundleStatus}`);
  console.log(`├─ tokens.css: ${formatBytes(bundleSize.tokens)}`);
  console.log(`└─ index.css: ${formatBytes(bundleSize.index)}`);
  console.log('');
  
  // File Structure Analysis
  console.log(colorize('🗂️  FILE STRUCTURE ANALYSIS', 'bold'));
  console.log(colorize('-'.repeat(30), 'cyan'));
  const fileStatus = getStatusIcon(fileCount.total, limits.fileCount);
  const fileColor = getStatusColor(fileCount.total, limits.fileCount);
  console.log(`Total JSON Files: ${colorize(fileCount.total, fileColor)}/${limits.fileCount} ${fileStatus}`);
  console.log(`├─ Core: ${fileCount.core}`);
  console.log(`├─ Semantic: ${fileCount.semantic}`);
  console.log(`└─ Components: ${fileCount.components}`);
  console.log('');
  
  // Overall Health Assessment
  const allHealthy = (
    tokenCount.total <= limits.tokenCount &&
    bundleSize.total <= limits.bundleSize &&
    fileCount.total <= limits.fileCount
  );
  
  console.log(colorize('🏥 OVERALL HEALTH', 'bold'));
  console.log(colorize('-'.repeat(17), 'cyan'));
  if (allHealthy) {
    console.log(colorize('✅ ALL SYSTEMS HEALTHY', 'green'));
    console.log(colorize('Ready for development work', 'green'));
  } else {
    console.log(colorize('❌ SYSTEM ISSUES DETECTED', 'red'));
    console.log(colorize('⚠️  Immediate action required before proceeding', 'yellow'));
    
    // Specific recommendations
    console.log('\n🔧 REQUIRED ACTIONS:');
    if (tokenCount.total > limits.tokenCount) {
      console.log(colorize(`• Reduce token count by ${tokenCount.total - limits.tokenCount} variables`, 'red'));
    }
    if (bundleSize.total > limits.bundleSize) {
      console.log(colorize(`• Reduce bundle size by ${formatBytes(bundleSize.total - limits.bundleSize)}`, 'red'));
    }
    if (fileCount.total > limits.fileCount) {
      console.log(colorize(`• Consolidate ${fileCount.total - limits.fileCount} JSON files using patterns`, 'red'));
    }
  }
  
  console.log('');
  console.log(colorize('💡 To fix issues: npm run tokens:audit', 'blue'));
  console.log(colorize('📖 See: PROGRESS/phases/phase-06/12-implementation-checklist.md', 'blue'));
  console.log('');
  
  // Exit with error code if unhealthy for CI/CD
  if (!allHealthy) {
    process.exit(1);
  }
  
  return {
    timestamp,
    healthy: allHealthy,
    metrics: {
      tokenCount,
      bundleSize,
      fileCount
    },
    limits
  };
}

// Run dashboard
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport, getTokenCount, getBundleSize, getFileCount };