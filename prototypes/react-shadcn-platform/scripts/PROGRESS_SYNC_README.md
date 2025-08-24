# Progress Sync System Documentation

## Overview
A complete progress tracking and synchronization system that maintains consistency between individual task files and the main PROGRESS.md dashboard.

## Architecture

```
Individual Task Files (Source of Truth)
         ↓
    parseProgressFiles.cjs
         ↓
    sync-progress.cjs
         ↓
    PROGRESS.md (Generated Overview)
         ↓
    readProgress.cjs
         ↓
    progress-api-simple.cjs
         ↓
    WorkflowDashboard (UI)
```

## Files Created

1. **`parseProgressFiles.cjs`** - Parses all task .md files from docs/progress/
2. **`sync-progress.cjs`** - Updates PROGRESS.md based on task file status
3. **`readProgress.cjs`** - Reads PROGRESS.md and converts to JSON
4. **`progress-api-simple.cjs`** - HTTP server for dashboard API (no dependencies)
5. **Updated `WorkflowService.ts`** - Fetches real data from API

## Available Commands

```bash
# View current progress from task files
npm run progress:parse

# Sync task files to PROGRESS.md (one-way sync)
npm run progress:sync

# Read current PROGRESS.md status
npm run progress:read

# Start API server on port 3002
npm run progress:api

# Get JSON format for dashboard
npm run progress:dashboard

# Restore PROGRESS.md from backup
npm run progress:restore
```

## Usage Workflow

### 1. Update Task Status
Edit individual task files in `docs/progress/phase-*/task-*.md`:
```markdown
**Status:** ✅ Complete  
**Progress:** 100%
```

### 2. Sync to PROGRESS.md
```bash
npm run progress:sync
```
This reads all task files and updates PROGRESS.md with accurate percentages and status.

### 3. View in Dashboard
```bash
# Terminal 1: Start the API server
npm run progress:api

# Terminal 2: Start the dev server
npm run dev

# Visit: http://localhost:5173/workflow-dashboard
```

## How It Works

### Single Source of Truth
- Individual task files (`docs/progress/phase-*/task-*.md`) are the primary source
- Status and progress are read from these files
- PROGRESS.md is automatically generated/updated

### Status Mapping
- `✅ Complete` or `100%` → completed
- `🟡 Active` or `In Progress` → in_progress  
- `🔴 On Hold` or `Blocked` → on_hold
- `🟡 Pending` → pending

### Progress Calculation
1. If task has explicit `**Progress:** X%`, use that
2. Otherwise, calculate from subtask checkboxes
3. Phase progress = average of all task progress

## API Endpoints

When running `npm run progress:api`:

- `GET http://localhost:3002/api/progress` - Get current progress data
- `POST http://localhost:3002/api/progress/sync` - Trigger sync
- `GET http://localhost:3002/api/health` - Health check

## Dashboard Integration

The WorkflowDashboard component at `/workflow-dashboard` automatically fetches from the API when available, falling back to mock data if the API is not running.

## Troubleshooting

### PROGRESS.md out of sync
```bash
npm run progress:sync
```

### Need to restore PROGRESS.md
```bash
npm run progress:restore  # Restores from PROGRESS.md.backup
```

### API server port conflict
Edit `scripts/progress-api-simple.cjs` and change `PORT` variable.

## Benefits

1. **No External Dependencies** - Uses only Node.js built-in modules for API
2. **Single Source of Truth** - Task files are authoritative
3. **Automatic Sync** - Can be added to pre-commit hooks
4. **Visual Dashboard** - Existing UI works with real data
5. **Backup/Restore** - Automatic backup before each sync

## Future Enhancements

1. Add pre-commit hook to auto-sync
2. WebSocket support for real-time updates
3. Two-way sync (update task files from dashboard)
4. GitHub Actions integration for CI/CD