#!/usr/bin/env node

/**
 * Smart Theme Usage Validator
 * 
 * Validates proper usage of theme variables vs hardcoded colors
 * Understands context and legitimate exceptions
 * 
 * Usage: node validate-theme-usage.js [--fix] [path...]
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configuration
const CONFIG = {
  // Patterns for ALLOWED hardcoded values
  ALLOWED_PATTERNS: [
    // Shadows and rgba values are OK
    /rgba?\([^)]*\)/g,
    
    // Layout constants in CSS (non-color)
    /--radius:\s*[^;]+/g,
    /--table-row-height:\s*[^;]+/g,
    /--table-selection-width:\s*[^;]+/g,
    /--border-radius:\s*[^;]+/g,
    
    // Tailwind classes are OK
    /className="[^"]*bg-\w+-\d+[^"]*"/g,
    /className='[^']*bg-\w+-\d+[^']*'/g,
    
    // Theme config files can have HSL values
    /container:\s*['"]hsl\([^)]+\)['"]/g,
    /header:\s*['"]hsl\([^)]+\)['"]/g,
    /border:\s*['"]hsl\([^)]+\)['"]/g,
  ],
  
  // Patterns for FORBIDDEN hardcoded values
  FORBIDDEN_PATTERNS: [
    {
      pattern: /backgroundColor:\s*['"]hsl\(\d+[^)]*\)['"]/g,
      message: 'Hardcoded HSL in backgroundColor style prop',
      suggestion: "Use 'hsl(var(--muted))' or 'hsl(var(--background))' instead",
      severity: 'error'
    },
    {
      pattern: /backgroundColor:\s*['"]#[0-9a-fA-F]{3,6}['"]/g,
      message: 'Hardcoded HEX in backgroundColor style prop',
      suggestion: "Use 'hsl(var(--muted))' or 'hsl(var(--background))' instead",
      severity: 'error'
    },
    {
      pattern: /backgroundColor:\s*['"]rgb\([^)]+\)['"]/g,
      message: 'Hardcoded RGB in backgroundColor style prop',
      suggestion: "Use 'hsl(var(--muted))' or 'hsl(var(--background))' instead",
      severity: 'error'
    },
    {
      pattern: /color:\s*['"]hsl\(\d+[^)]*\)['"]/g,
      message: 'Hardcoded HSL in color style prop',
      suggestion: "Use 'hsl(var(--foreground))' or 'hsl(var(--muted-foreground))' instead",
      severity: 'error'
    },
    {
      pattern: /--muted:\s*\d+[^;]*;/g,
      message: 'Overriding theme variable --muted in CSS',
      suggestion: 'Remove this override - theme variables are managed by the theme system',
      severity: 'error'
    },
    {
      pattern: /--background:\s*\d+[^;]*;/g,
      message: 'Overriding theme variable --background in CSS',
      suggestion: 'Remove this override - theme variables are managed by the theme system',
      severity: 'error'
    },
    {
      pattern: /--foreground:\s*\d+[^;]*;/g,
      message: 'Overriding theme variable --foreground in CSS',
      suggestion: 'Remove this override - theme variables are managed by the theme system',
      severity: 'error'
    }
  ],
  
  // Files/paths where different rules apply
  EXCEPTION_PATHS: [
    'theme/configs/',        // Theme configuration files
    'tailwind.config.',      // Tailwind configuration
    '.test.',                // Test files
    '.spec.',                // Spec files
    'node_modules/',         // Dependencies
  ],
  
  // File extensions to check
  FILE_EXTENSIONS: ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss'],
  
  // Default paths to scan
  DEFAULT_PATHS: [
    'src/**/*.{tsx,ts,jsx,js,css,scss}',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
    '!node_modules/**'
  ]
};

class ThemeValidator {
  constructor(options = {}) {
    this.options = {
      fix: false,
      verbose: false,
      ...options
    };
    this.results = {
      errors: [],
      warnings: [],
      fixed: []
    };
  }

  /**
   * Check if a file path should be treated with exception rules
   */
  isExceptionPath(filePath) {
    return CONFIG.EXCEPTION_PATHS.some(exceptionPath => 
      filePath.includes(exceptionPath)
    );
  }

  /**
   * Validate a single file
   */
  validateFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const isException = this.isExceptionPath(filePath);
      
      if (isException) {
        if (this.options.verbose) {
          console.log(`ℹ️  Skipping exception path: ${filePath}`);
        }
        return;
      }

      this.validateContent(content, filePath);
    } catch (error) {
      this.results.errors.push({
        file: filePath,
        line: 0,
        message: `Error reading file: ${error.message}`,
        severity: 'error'
      });
    }
  }

  /**
   * Validate file content
   */
  validateContent(content, filePath) {
    const lines = content.split('\n');
    
    CONFIG.FORBIDDEN_PATTERNS.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(content)) !== null) {
        const lineNumber = this.getLineNumber(content, match.index);
        const lineContent = lines[lineNumber - 1]?.trim() || '';
        
        // Check if this match is within an allowed context
        if (this.isAllowedContext(match[0], content, match.index)) {
          continue;
        }

        const issue = {
          file: filePath,
          line: lineNumber,
          column: match.index,
          match: match[0],
          message: rule.message,
          suggestion: rule.suggestion,
          severity: rule.severity,
          context: lineContent
        };

        if (rule.severity === 'error') {
          this.results.errors.push(issue);
        } else {
          this.results.warnings.push(issue);
        }
      }
    });
  }

  /**
   * Check if a match is within an allowed context
   */
  isAllowedContext(match, content, index) {
    // Check if the match is within a comment
    const beforeMatch = content.substring(0, index);
    const lineStart = beforeMatch.lastIndexOf('\n') + 1;
    const lineContent = content.substring(lineStart, content.indexOf('\n', index));
    
    if (lineContent.trim().startsWith('//') || lineContent.trim().startsWith('/*')) {
      return true;
    }

    // Check against allowed patterns
    return CONFIG.ALLOWED_PATTERNS.some(pattern => {
      return pattern.test(match);
    });
  }

  /**
   * Get line number from character index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Print validation results
   */
  printResults() {
    const { errors, warnings, fixed } = this.results;
    
    console.log('\n🎨 Theme Usage Validation Results\n');
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All files follow theme usage guidelines!');
      return true;
    }

    // Print errors
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} Error(s) Found:\n`);
      errors.forEach(error => {
        console.log(`  📄 ${error.file}:${error.line}`);
        console.log(`     ❌ ${error.message}`);
        console.log(`     💡 ${error.suggestion}`);
        console.log(`     📝 ${error.context}\n`);
      });
    }

    // Print warnings
    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} Warning(s) Found:\n`);
      warnings.forEach(warning => {
        console.log(`  📄 ${warning.file}:${warning.line}`);
        console.log(`     ⚠️  ${warning.message}`);
        console.log(`     💡 ${warning.suggestion}`);
        console.log(`     📝 ${warning.context}\n`);
      });
    }

    // Print fixes if any
    if (fixed.length > 0) {
      console.log(`🔧 ${fixed.length} Issue(s) Fixed:\n`);
      fixed.forEach(fix => {
        console.log(`  📄 ${fix.file}:${fix.line}`);
        console.log(`     🔧 ${fix.message}\n`);
      });
    }

    return errors.length === 0;
  }

  /**
   * Run validation on specified paths
   */
  async run(paths = CONFIG.DEFAULT_PATHS) {
    console.log('🔍 Scanning for theme usage violations...\n');
    
    const allFiles = [];
    
    // Collect all files to check
    for (const pattern of paths) {
      const files = glob.sync(pattern, { absolute: true });
      allFiles.push(...files);
    }

    // Remove duplicates
    const uniqueFiles = [...new Set(allFiles)];
    
    if (this.options.verbose) {
      console.log(`📁 Found ${uniqueFiles.length} files to check\n`);
    }

    // Validate each file
    uniqueFiles.forEach(file => {
      if (CONFIG.FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
        this.validateFile(file);
      }
    });

    return this.printResults();
  }
}

// CLI Usage
const isMainModule = import.meta.url === new URL(process.argv[1], import.meta.url).href;
if (isMainModule) {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const help = args.includes('--help') || args.includes('-h');
  
  if (help) {
    console.log(`
🎨 Theme Usage Validator

Usage: node validate-theme-usage.js [options] [paths...]

Options:
  --fix           Attempt to auto-fix violations
  --verbose, -v   Show detailed output
  --help, -h      Show this help

Examples:
  node validate-theme-usage.js
  node validate-theme-usage.js src/components/
  node validate-theme-usage.js --fix --verbose

Rules:
  ✅ Allowed: rgba() for shadows, layout constants, Tailwind classes
  ❌ Forbidden: Hardcoded colors in style props, theme variable overrides

See GUIDELINES_THEME_COMPONENT_ENHANCEMENT.md for complete rules.
`);
    process.exit(0);
  }

  const paths = args.filter(arg => !arg.startsWith('--'));
  const validator = new ThemeValidator({ fix, verbose });
  
  validator.run(paths.length > 0 ? paths : undefined)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export default ThemeValidator;