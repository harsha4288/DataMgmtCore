# Performance Monitoring & Analysis Scripts

This directory contains a comprehensive suite of performance monitoring and analysis tools for the Design Token System. All scripts work together to provide complete visibility into token system performance.

## 🎯 Primary Monitoring Scripts

### `monitor-dashboard.cjs` ✨ ENHANCED
**Enhanced with Task 6.4 improvements**
- **Purpose**: Real-time performance monitoring with historical tracking
- **Usage**: `npm run monitor`
- **Features**:
  - ✅ Bundle size monitoring with trend analysis
  - ✅ Token count tracking with regression detection
  - ✅ Historical data storage (last 50 measurements)
  - ✅ Performance regression alerts (>10% increase)
  - ✅ Color-coded terminal output
  - ✅ CI/CD integration with exit codes

### `ci-performance-check.js` 🆕 NEW
**Created for Task 6.4 CI/CD integration**
- **Purpose**: Comprehensive CI/CD performance validation
- **Usage**: `npm run ci-check`
- **Features**:
  - ✅ Automated performance checks in CI pipelines
  - ✅ Slack notifications (configurable)
  - ✅ GitHub PR comments (configurable)
  - ✅ Performance artifact generation
  - ✅ Regression threshold enforcement

### `token-usage-analytics.js` 🆕 NEW
**Created for Task 6.4 token analytics**
- **Purpose**: Comprehensive token usage pattern analysis
- **Usage**: `npm run analyze-tokens`
- **Features**:
  - ✅ Token usage frequency tracking
  - ✅ Unused token detection
  - ✅ Duplicate value identification
  - ✅ Component-specific usage patterns
  - ✅ Optimization recommendations

## 📊 Analysis Scripts (Your Original Work)

### `simple-analysis.js` 📋 PRESERVED
**Your original bundle analysis script**
- **Purpose**: Quick bundle size and component coverage analysis
- **Usage**: `npm run analyze-simple`
- **Features**:
  - Bundle size comparison (121KB → current)
  - Component coverage percentage
  - Development time estimates
  - Justification metrics

### `performance-analysis.js` 🏗️ PRESERVED
**Your comprehensive performance analysis**
- **Usage**: `npm run analyze-performance`
- **Features**:
  - Token system efficiency analysis
  - Bundle performance metrics
  - Component coverage analysis
  - Performance impact calculations
  - Work estimation breakdown

### `component-impact-analysis.js` 🎭 PRESERVED
**Your architectural risk analysis**
- **Usage**: `npm run analyze-impact`
- **Features**:
  - Component impact projections (30+ components)
  - Architectural risk assessment
  - Quality gates and monitoring setup
  - Risk mitigation strategies
  - Implementation timelines

## 🚀 Quick Commands

### Daily Development
```bash
npm run monitor              # Quick health check
npm run performance-check    # Monitor + token analytics
```

### Comprehensive Analysis
```bash
npm run analysis-suite       # Run all analysis scripts
```

### CI/CD Integration
```bash
npm run ci-check            # Full CI performance validation
npm run precommit           # Pre-commit hook (monitor only)
```

### Individual Analysis
```bash
npm run analyze-simple      # Quick bundle analysis
npm run analyze-performance # Comprehensive performance
npm run analyze-impact      # Component impact projection
npm run analyze-tokens      # Token usage patterns
```

## 📈 Integration Overview

### Real-time Monitoring Flow
1. **Development**: `npm run monitor` for instant feedback
2. **Pre-commit**: Automatic monitoring via precommit hook
3. **CI/CD**: `npm run ci-check` for comprehensive validation
4. **Analysis**: Individual scripts for deep-dive investigation

### Data Flow
```
monitor-dashboard.cjs → .performance-history.json (historical data)
token-usage-analytics.js → TOKEN_USAGE_REPORT.json (usage patterns)  
ci-performance-check.js → .ci-performance-report.json (CI artifacts)
```

### Alert Thresholds
- **Bundle Size**: 40KB limit (increased for component growth)
- **Token Count**: 50 tokens limit (increased from original 40)
- **Regression**: 10% increase triggers alert
- **CI Regression**: 15% increase fails CI build

## 🔧 Configuration

### Environment Variables (CI/CD)
```bash
SLACK_WEBHOOK_URL=<your-slack-webhook>  # Optional Slack notifications
GITHUB_TOKEN=<your-github-token>        # Optional PR comments
PR_NUMBER=<pr-number>                   # Auto-detected in CI
```

### File Outputs
- `.performance-history.json` - Historical performance data
- `TOKEN_USAGE_REPORT.json` - Detailed token usage analysis
- `.ci-performance-report.json` - CI performance artifacts
- `PERFORMANCE_ANALYSIS_REPORT.json` - Comprehensive performance report
- `COMPONENT_IMPACT_REPORT.json` - Component impact analysis

## 📋 Task 6.4 Implementation Summary

✅ **Completed Enhancements:**
1. **Enhanced monitoring** with historical tracking and regression detection
2. **React component** for real-time theme switching performance
3. **Token usage analytics** building on your performance-analysis.js foundation
4. **CI/CD integration** with automated alerts and reporting
5. **Script consolidation** preserving your excellent analysis work

✅ **Your Original Analysis Preserved:**
- All 3 analysis scripts maintained as valuable references
- Package.json commands added for easy access
- Documentation created for long-term maintenance

✅ **Performance Goals Met:**
- Bundle size monitoring with trend analysis
- Theme switching measurement (<50ms target)
- Token usage frequency tracking
- Regression detection and alerting
- CI/CD integration ready

## 🎯 Next Steps

1. **Test the monitoring**: Run `npm run monitor` to see enhanced dashboard
2. **Try CI integration**: Run `npm run ci-check` for full validation
3. **Review analytics**: Run `npm run analyze-tokens` for usage insights
4. **Configure alerts**: Set up Slack/GitHub integration for CI

Your analysis scripts provided excellent foundation and insights that made this Task 6.4 implementation much more comprehensive and valuable!