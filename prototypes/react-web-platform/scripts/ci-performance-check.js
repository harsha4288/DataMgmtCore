#!/usr/bin/env node

/**
 * CI/CD Performance Check Script
 * Comprehensive performance monitoring for continuous integration
 * Integrates with existing monitor-dashboard.cjs and token-usage-analytics.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// CI/CD Configuration
const CI_CONFIG = {
    bundleSizeLimit: 40 * 1024, // 40KB limit (relaxed from 30KB for growth)
    tokenCountLimit: 50, // Increased from 40 for component expansion  
    regressionThreshold: 0.15, // 15% regression threshold for CI
    performanceReportFile: path.join(projectRoot, '.ci-performance-report.json'),
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    githubToken: process.env.GITHUB_TOKEN,
    prNumber: process.env.PR_NUMBER || process.env.GITHUB_PR_NUMBER
};

// ANSI colors for CI output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    bold: '\x1b[1m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

class CIPerformanceChecker {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            healthy: true,
            warnings: [],
            errors: [],
            metrics: {},
            regressions: [],
            recommendations: []
        };
    }

    // Run monitor dashboard and capture results
    async runMonitorCheck() {
        console.log('🔍 Running Monitor Dashboard Check...\n');
        
        try {
            // Import and run the monitor dashboard
            const { generateReport } = await import('./monitor-dashboard.cjs');
            const monitorResult = generateReport();
            
            this.results.metrics.monitor = monitorResult.metrics;
            this.results.regressions = monitorResult.regressions || [];
            
            if (!monitorResult.healthy) {
                this.results.healthy = false;
                this.results.errors.push('Monitor dashboard detected system issues');
            }
            
            if (this.results.regressions.length > 0) {
                this.results.healthy = false;
                this.results.errors.push(`Performance regression detected: ${this.results.regressions.length} issues`);
            }
            
            console.log(colorize('✅ Monitor check completed', 'green'));
            
        } catch (error) {
            this.results.healthy = false;
            this.results.errors.push(`Monitor check failed: ${error.message}`);
            console.error(colorize(`❌ Monitor check failed: ${error.message}`, 'red'));
        }
    }

    // Run token usage analytics
    async runTokenAnalytics() {
        console.log('\n🔍 Running Token Usage Analytics...\n');
        
        try {
            const { default: TokenUsageAnalyzer } = await import('./token-usage-analytics.js');
            const analyzer = new TokenUsageAnalyzer();
            const analyticsResult = analyzer.run();
            
            this.results.metrics.tokenAnalytics = analyticsResult.metrics;
            this.results.recommendations = analyticsResult.recommendations;
            
            if (!analyticsResult.healthy) {
                this.results.warnings.push('Token usage efficiency below threshold');
            }
            
            console.log(colorize('✅ Token analytics completed', 'green'));
            
        } catch (error) {
            this.results.warnings.push(`Token analytics failed: ${error.message}`);
            console.error(colorize(`⚠️ Token analytics failed: ${error.message}`, 'yellow'));
        }
    }

    // Check against CI limits
    checkCILimits() {
        console.log('\n🎯 Checking CI Performance Limits...\n');
        
        const metrics = this.results.metrics.monitor;
        if (!metrics) {
            this.results.errors.push('No monitor metrics available for CI check');
            return;
        }
        
        // Bundle size check
        if (metrics.bundleSize && metrics.bundleSize.total > CI_CONFIG.bundleSizeLimit) {
            this.results.healthy = false;
            this.results.errors.push(
                `Bundle size ${(metrics.bundleSize.total / 1024).toFixed(1)}KB exceeds limit ${(CI_CONFIG.bundleSizeLimit / 1024)}KB`
            );
        }
        
        // Token count check
        if (metrics.tokenCount && metrics.tokenCount.total > CI_CONFIG.tokenCountLimit) {
            this.results.warnings.push(
                `Token count ${metrics.tokenCount.total} approaches limit ${CI_CONFIG.tokenCountLimit}`
            );
        }
        
        // Regression threshold check
        if (this.results.regressions.length > 0) {
            this.results.regressions.forEach(regression => {
                const increasePercent = parseFloat(regression.increase);
                if (increasePercent > (CI_CONFIG.regressionThreshold * 100)) {
                    this.results.healthy = false;
                    this.results.errors.push(
                        `${regression.metric} regression ${regression.increase}% exceeds CI threshold ${(CI_CONFIG.regressionThreshold * 100)}%`
                    );
                }
            });
        }
        
        console.log(colorize('✅ CI limits check completed', 'green'));
    }

    // Generate CI report
    generateCIReport() {
        console.log('\n📋 CI PERFORMANCE REPORT');
        console.log('========================\n');
        
        // Overall status
        if (this.results.healthy) {
            console.log(colorize('✅ PERFORMANCE CHECK PASSED', 'green'));
            console.log('All performance metrics within acceptable limits\n');
        } else {
            console.log(colorize('❌ PERFORMANCE CHECK FAILED', 'red'));
            console.log('Performance issues detected that require attention\n');
        }
        
        // Metrics summary
        const metrics = this.results.metrics.monitor;
        if (metrics) {
            console.log('📊 CURRENT METRICS:');
            console.log(`   Bundle Size: ${(metrics.bundleSize?.total / 1024 || 0).toFixed(1)}KB / ${(CI_CONFIG.bundleSizeLimit / 1024)}KB`);
            console.log(`   Token Count: ${metrics.tokenCount?.total || 0} / ${CI_CONFIG.tokenCountLimit}`);
            console.log(`   File Count: ${metrics.fileCount?.total || 0}\n`);
        }
        
        // Errors
        if (this.results.errors.length > 0) {
            console.log(colorize('🚨 ERRORS:', 'red'));
            this.results.errors.forEach((error, index) => {
                console.log(colorize(`   ${index + 1}. ${error}`, 'red'));
            });
            console.log('');
        }
        
        // Warnings
        if (this.results.warnings.length > 0) {
            console.log(colorize('⚠️ WARNINGS:', 'yellow'));
            this.results.warnings.forEach((warning, index) => {
                console.log(colorize(`   ${index + 1}. ${warning}`, 'yellow'));
            });
            console.log('');
        }
        
        // Regressions
        if (this.results.regressions.length > 0) {
            console.log(colorize('📈 REGRESSIONS DETECTED:', 'red'));
            this.results.regressions.forEach((regression, index) => {
                console.log(colorize(`   ${index + 1}. ${regression.metric}: +${regression.increase}%`, 'red'));
                console.log(`      Previous: ${regression.previous} → Current: ${regression.current}`);
            });
            console.log('');
        }
        
        // Recommendations
        if (this.results.recommendations.length > 0) {
            console.log(colorize('💡 RECOMMENDATIONS:', 'blue'));
            this.results.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec.action} (Priority: ${rec.priority})`);
                console.log(`      Impact: ${rec.impact}, Effort: ${rec.effort}`);
            });
            console.log('');
        }
    }

    // Save CI report for artifacts
    saveCIReport() {
        try {
            fs.writeFileSync(CI_CONFIG.performanceReportFile, JSON.stringify(this.results, null, 2));
            console.log(`📄 CI report saved to: ${CI_CONFIG.performanceReportFile}\n`);
        } catch (error) {
            console.error(colorize(`Failed to save CI report: ${error.message}`, 'yellow'));
        }
    }

    // Send Slack notification (if configured)
    async sendSlackNotification() {
        if (!CI_CONFIG.slackWebhook) {
            console.log('📱 Slack webhook not configured, skipping notification\n');
            return;
        }

        try {
            const status = this.results.healthy ? '✅ PASSED' : '❌ FAILED';
            const color = this.results.healthy ? 'good' : 'danger';
            
            const message = {
                text: `Design Token Performance Check ${status}`,
                attachments: [{
                    color,
                    fields: [
                        {
                            title: 'Bundle Size',
                            value: `${(this.results.metrics.monitor?.bundleSize?.total / 1024 || 0).toFixed(1)}KB`,
                            short: true
                        },
                        {
                            title: 'Token Count',
                            value: `${this.results.metrics.monitor?.tokenCount?.total || 0}`,
                            short: true
                        },
                        {
                            title: 'Errors',
                            value: `${this.results.errors.length}`,
                            short: true
                        },
                        {
                            title: 'Warnings',
                            value: `${this.results.warnings.length}`,
                            short: true
                        }
                    ]
                }]
            };

            // Here you would normally send to Slack webhook
            console.log('📱 Slack notification prepared (webhook not called in demo)');
            
        } catch (error) {
            console.error(colorize(`Failed to send Slack notification: ${error.message}`, 'yellow'));
        }
    }

    // Add GitHub PR comment (if configured)
    async addGitHubComment() {
        if (!CI_CONFIG.githubToken || !CI_CONFIG.prNumber) {
            console.log('🐙 GitHub integration not configured, skipping PR comment\n');
            return;
        }

        try {
            const status = this.results.healthy ? '✅' : '❌';
            const metrics = this.results.metrics.monitor;
            
            const comment = `## ${status} Design Token Performance Check

**Bundle Size:** ${(metrics?.bundleSize?.total / 1024 || 0).toFixed(1)}KB / ${(CI_CONFIG.bundleSizeLimit / 1024)}KB
**Token Count:** ${metrics?.tokenCount?.total || 0} / ${CI_CONFIG.tokenCountLimit}

${this.results.errors.length > 0 ? `**Errors:** ${this.results.errors.length}` : ''}
${this.results.warnings.length > 0 ? `**Warnings:** ${this.results.warnings.length}` : ''}
${this.results.regressions.length > 0 ? `**Regressions:** ${this.results.regressions.length}` : ''}

<details>
<summary>View Details</summary>

\`\`\`json
${JSON.stringify(this.results, null, 2)}
\`\`\`
</details>`;

            // Here you would normally post to GitHub API
            console.log('🐙 GitHub PR comment prepared (API not called in demo)');
            
        } catch (error) {
            console.error(colorize(`Failed to add GitHub comment: ${error.message}`, 'yellow'));
        }
    }

    // Run complete CI check
    async run() {
        console.log(colorize('\n🚀 Starting CI Performance Check', 'bold'));
        console.log('=====================================\n');

        try {
            await this.runMonitorCheck();
            await this.runTokenAnalytics();
            this.checkCILimits();
            this.generateCIReport();
            this.saveCIReport();
            await this.sendSlackNotification();
            await this.addGitHubComment();

            console.log(colorize('🏁 CI Performance Check Complete', 'bold'));
            
            // Exit with appropriate code for CI/CD
            process.exit(this.results.healthy ? 0 : 1);
            
        } catch (error) {
            console.error(colorize(`💥 CI check failed: ${error.message}`, 'red'));
            process.exit(1);
        }
    }
}

// Run CI check if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const checker = new CIPerformanceChecker();
    checker.run();
}

export default CIPerformanceChecker;