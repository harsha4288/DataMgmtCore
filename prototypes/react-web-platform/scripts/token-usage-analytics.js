#!/usr/bin/env node

/**
 * Token Usage Analytics Script
 * Enhanced version building on performance-analysis.js foundation
 * Tracks token usage patterns, frequency, and optimization opportunities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// Configuration from your existing scripts
const CONFIG = {
    projectRoot,
    tokenFiles: [
        'src/design-system/tokens/core/primitives.json',
        'src/design-system/tokens/semantic/intent-based.json',
        'src/design-system/tokens/semantic/light-theme.json',
        'src/design-system/tokens/semantic/dark-theme.json',
        'src/design-system/tokens/components/patterns.json'
    ],
    cssFiles: [
        'src/index.css',
        'src/design-system/build/dynamic/tokens.css'
    ],
    componentFiles: [
        'src/**/*.tsx',
        'src/**/*.ts',
        'src/**/*.css'
    ],
    outputFile: path.join(projectRoot, 'TOKEN_USAGE_REPORT.json')
};

class TokenUsageAnalyzer {
    constructor() {
        this.tokenRegistry = new Map();
        this.usageFrequency = new Map();
        this.componentUsage = new Map();
        this.unusedTokens = new Set();
        this.duplicateValues = new Map();
        this.performanceImpact = {};
    }

    // Build comprehensive token registry
    buildTokenRegistry() {
        console.log('🔍 Building Token Registry...\n');

        CONFIG.tokenFiles.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                const fileName = path.basename(filePath, '.json');

                this.extractTokens(data, fileName, '');
            }
        });

        console.log(`📊 Token Registry Built: ${this.tokenRegistry.size} tokens found\n`);
    }

    // Recursively extract tokens from JSON structure
    extractTokens(obj, source, prefix = '') {
        Object.entries(obj).forEach(([key, value]) => {
            const tokenName = prefix ? `${prefix}-${key}` : key;
            const fullTokenName = `--${tokenName}`;

            if (typeof value === 'string' || typeof value === 'number') {
                // Register the token
                this.tokenRegistry.set(fullTokenName, {
                    name: fullTokenName,
                    value,
                    source,
                    category: this.categorizeToken(tokenName),
                    usageCount: 0,
                    components: new Set()
                });

                // Track duplicate values
                const valueKey = String(value);
                if (!this.duplicateValues.has(valueKey)) {
                    this.duplicateValues.set(valueKey, []);
                }
                this.duplicateValues.get(valueKey).push(fullTokenName);

            } else if (typeof value === 'object' && value !== null) {
                this.extractTokens(value, source, tokenName);
            }
        });
    }

    // Categorize tokens based on naming patterns (from your component-impact-analysis.js)
    categorizeToken(tokenName) {
        if (tokenName.includes('color') || tokenName.includes('bg') || tokenName.includes('text')) {
            return 'color';
        }
        if (tokenName.includes('size') || tokenName.includes('width') || tokenName.includes('height')) {
            return 'size';
        }
        if (tokenName.includes('space') || tokenName.includes('margin') || tokenName.includes('padding')) {
            return 'spacing';
        }
        if (tokenName.includes('font') || tokenName.includes('text') || tokenName.includes('weight')) {
            return 'typography';
        }
        if (tokenName.includes('border') || tokenName.includes('radius') || tokenName.includes('shadow')) {
            return 'border';
        }
        if (tokenName.includes('animation') || tokenName.includes('transition') || tokenName.includes('duration')) {
            return 'animation';
        }
        return 'other';
    }

    // Analyze token usage across all files
    analyzeTokenUsage() {
        console.log('📈 Analyzing Token Usage Patterns...\n');

        try {
            // Find all files to analyze
            const allFiles = [];
            
            // Get CSS files
            CONFIG.cssFiles.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    allFiles.push({ path: filePath, type: 'css' });
                }
            });

            // Get component files using find command
            try {
                const componentPaths = execSync('find src/ -name "*.tsx" -o -name "*.ts" -o -name "*.css"', { encoding: 'utf8' })
                    .split('\n')
                    .filter(p => p.trim())
                    .filter(p => !p.includes('node_modules'));

                componentPaths.forEach(filePath => {
                    allFiles.push({ 
                        path: filePath, 
                        type: path.extname(filePath).slice(1) 
                    });
                });
            } catch (error) {
                console.warn('Could not find component files, using fallback method');
            }

            // Analyze each file
            allFiles.forEach(file => {
                this.analyzeFile(file.path, file.type);
            });

            this.calculateUsageStatistics();
            
        } catch (error) {
            console.error('Error analyzing token usage:', error.message);
        }
    }

    // Analyze individual file for token usage
    analyzeFile(filePath, fileType) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);

            // Find all var(--token) patterns
            const tokenMatches = content.match(/var\(--[^)]+\)/g) || [];
            
            tokenMatches.forEach(match => {
                // Extract token name from var(--token)
                const tokenName = match.match(/var\((--[^)]+)\)/)?.[1];
                if (tokenName && this.tokenRegistry.has(tokenName)) {
                    const token = this.tokenRegistry.get(tokenName);
                    token.usageCount++;
                    token.components.add(fileName);

                    // Update frequency map
                    this.usageFrequency.set(tokenName, (this.usageFrequency.get(tokenName) || 0) + 1);
                    
                    // Update component usage map
                    if (!this.componentUsage.has(fileName)) {
                        this.componentUsage.set(fileName, new Set());
                    }
                    this.componentUsage.get(fileName).add(tokenName);
                }
            });

        } catch (error) {
            console.warn(`Could not analyze file ${filePath}:`, error.message);
        }
    }

    // Calculate comprehensive usage statistics
    calculateUsageStatistics() {
        console.log('📊 Calculating Usage Statistics...\n');

        // Find unused tokens
        this.tokenRegistry.forEach((token, name) => {
            if (token.usageCount === 0) {
                this.unusedTokens.add(name);
            }
        });

        // Calculate performance impact using your existing metrics
        const totalTokens = this.tokenRegistry.size;
        const usedTokens = totalTokens - this.unusedTokens.size;
        const usageRate = (usedTokens / totalTokens * 100).toFixed(1);

        // Find duplicate values (from your component impact analysis)
        const duplicateGroups = Array.from(this.duplicateValues.entries())
            .filter(([value, tokens]) => tokens.length > 1)
            .sort((a, b) => b[1].length - a[1].length);

        this.performanceImpact = {
            totalTokens,
            usedTokens,
            unusedTokens: this.unusedTokens.size,
            usageRate: parseFloat(usageRate),
            duplicateGroups: duplicateGroups.length,
            potentialSavings: duplicateGroups.reduce((sum, [value, tokens]) => sum + (tokens.length - 1), 0)
        };

        console.log(`📈 Usage Statistics Calculated`);
        console.log(`   Used Tokens: ${usedTokens}/${totalTokens} (${usageRate}%)`);
        console.log(`   Unused Tokens: ${this.unusedTokens.size}`);
        console.log(`   Duplicate Groups: ${duplicateGroups.length}`);
        console.log(`   Potential Token Reduction: ${this.performanceImpact.potentialSavings}\n`);
    }

    // Generate comprehensive usage report
    generateUsageReport() {
        console.log('📋 COMPREHENSIVE TOKEN USAGE REPORT');
        console.log('=====================================\n');

        // Most used tokens
        const sortedByUsage = Array.from(this.usageFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        console.log('🔥 TOP 10 MOST USED TOKENS:');
        console.log('-'.repeat(30));
        sortedByUsage.forEach(([token, count], index) => {
            const tokenInfo = this.tokenRegistry.get(token);
            console.log(`${index + 1}. ${token}: ${count} uses (${tokenInfo?.category || 'unknown'})`);
        });
        console.log('');

        // Unused tokens
        console.log(`❌ UNUSED TOKENS (${this.unusedTokens.size}):`);
        console.log('-'.repeat(25));
        if (this.unusedTokens.size > 0) {
            Array.from(this.unusedTokens).slice(0, 10).forEach(token => {
                const tokenInfo = this.tokenRegistry.get(token);
                console.log(`   ${token} (${tokenInfo?.category || 'unknown'}) from ${tokenInfo?.source || 'unknown'}`);
            });
            if (this.unusedTokens.size > 10) {
                console.log(`   ... and ${this.unusedTokens.size - 10} more`);
            }
        } else {
            console.log('   ✅ No unused tokens found!');
        }
        console.log('');

        // Duplicate values
        const duplicateGroups = Array.from(this.duplicateValues.entries())
            .filter(([value, tokens]) => tokens.length > 1)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 5);

        console.log('🔄 TOP DUPLICATE VALUES:');
        console.log('-'.repeat(25));
        duplicateGroups.forEach(([value, tokens]) => {
            console.log(`   Value "${value}" used by ${tokens.length} tokens:`);
            tokens.forEach(token => console.log(`     - ${token}`));
            console.log('');
        });

        // Category breakdown
        const categoryStats = new Map();
        this.tokenRegistry.forEach(token => {
            const category = token.category;
            if (!categoryStats.has(category)) {
                categoryStats.set(category, { total: 0, used: 0 });
            }
            categoryStats.get(category).total++;
            if (token.usageCount > 0) {
                categoryStats.get(category).used++;
            }
        });

        console.log('📊 USAGE BY CATEGORY:');
        console.log('-'.repeat(20));
        Array.from(categoryStats.entries()).forEach(([category, stats]) => {
            const usageRate = (stats.used / stats.total * 100).toFixed(1);
            console.log(`   ${category}: ${stats.used}/${stats.total} (${usageRate}%)`);
        });
        console.log('');

        // Performance impact (using your existing analysis patterns)
        console.log('⚡ PERFORMANCE IMPACT:');
        console.log('-'.repeat(20));
        console.log(`   Token Efficiency: ${this.performanceImpact.usageRate}%`);
        console.log(`   Unused Tokens: ${this.performanceImpact.unusedTokens} (potential cleanup)`);
        console.log(`   Duplicate Values: ${this.performanceImpact.duplicateGroups} groups`);
        console.log(`   Optimization Potential: ${this.performanceImpact.potentialSavings} tokens`);
        console.log('');

        // Recommendations (inspired by your component impact analysis)
        console.log('🚀 OPTIMIZATION RECOMMENDATIONS:');
        console.log('-'.repeat(35));
        if (this.performanceImpact.usageRate < 80) {
            console.log('   1. Remove unused tokens to reduce bundle size');
        }
        if (this.performanceImpact.duplicateGroups > 5) {
            console.log('   2. Consolidate duplicate values into shared tokens');
        }
        if (this.unusedTokens.size > 10) {
            console.log('   3. Audit token creation process to prevent unused tokens');
        }
        console.log('   4. Consider implementing token usage monitoring in CI/CD');
        console.log('   5. Create component-specific token guidelines');
        console.log('');
    }

    // Save detailed report
    saveDetailedReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.performanceImpact,
            tokenRegistry: Array.from(this.tokenRegistry.entries()).map(([name, token]) => ({
                name,
                ...token,
                components: Array.from(token.components)
            })),
            usageFrequency: Array.from(this.usageFrequency.entries()),
            componentUsage: Array.from(this.componentUsage.entries()).map(([component, tokens]) => ({
                component,
                tokens: Array.from(tokens)
            })),
            unusedTokens: Array.from(this.unusedTokens),
            duplicateValues: Array.from(this.duplicateValues.entries()).filter(([value, tokens]) => tokens.length > 1),
            recommendations: this.generateRecommendations()
        };

        fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2));
        console.log(`📄 Detailed report saved to: ${CONFIG.outputFile}\n`);
    }

    // Generate actionable recommendations
    generateRecommendations() {
        const recommendations = [];

        if (this.performanceImpact.usageRate < 80) {
            recommendations.push({
                priority: 'high',
                action: 'Remove unused tokens',
                impact: 'Bundle size reduction',
                effort: 'low',
                tokens: Math.min(10, this.unusedTokens.size)
            });
        }

        if (this.performanceImpact.duplicateGroups > 5) {
            recommendations.push({
                priority: 'medium',
                action: 'Consolidate duplicate values',
                impact: 'Token count reduction',
                effort: 'medium',
                savings: this.performanceImpact.potentialSavings
            });
        }

        return recommendations;
    }

    // Run complete analysis
    run() {
        try {
            this.buildTokenRegistry();
            this.analyzeTokenUsage();
            this.generateUsageReport();
            this.saveDetailedReport();

            // Return summary for integration with monitoring
            return {
                healthy: this.performanceImpact.usageRate > 80 && this.unusedTokens.size < 10,
                metrics: this.performanceImpact,
                recommendations: this.generateRecommendations()
            };

        } catch (error) {
            console.error('❌ Token usage analysis failed:', error.message);
            process.exit(1);
        }
    }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new TokenUsageAnalyzer();
    analyzer.run();
}

export default TokenUsageAnalyzer;