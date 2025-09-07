#!/usr/bin/env node

/**
 * Port Cleanup Script
 * Kills Node.js processes that are blocking development ports
 * Provides safe cleanup for intermittent startup issues
 */

const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Development ports we need to clean up
const DEV_PORTS = [3005, 3006, 5173, 5174, 5175];

// Safe processes to terminate (whitelist approach)
const SAFE_PROCESS_PATTERNS = [
  /^node\.exe$/i,
  /^vite$/i,
  /^npm$/i,
  /^npx$/i
];

// Process names that should NEVER be killed (safety blacklist)
const PROTECTED_PROCESSES = [
  /explorer\.exe/i,
  /winlogon\.exe/i,
  /csrss\.exe/i,
  /dwm\.exe/i,
  /services\.exe/i,
  /lsass\.exe/i,
  /svchost\.exe/i,
  /system$/i,
  /kernel32\.dll/i
];

console.log('🧹 Port Cleanup Script Starting...\n');

/**
 * Get process ID using specified port
 */
async function getProcessOnPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          return parseInt(pid);
        }
      }
    }
    return null;
  } catch (error) {
    // Port not in use
    return null;
  }
}

/**
 * Get process information by PID
 */
async function getProcessInfo(pid) {
  try {
    const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
    if (stdout.trim()) {
      const parts = stdout.trim().replace(/"/g, '').split(',');
      return {
        name: parts[0],
        pid: parseInt(parts[1]),
        memory: parts[4]
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a process is safe to kill
 */
function isSafeToKill(processInfo, currentPid) {
  if (!processInfo || !processInfo.name) {
    return false;
  }
  
  const { name, pid } = processInfo;
  
  // Never kill our own process
  if (pid === currentPid) {
    return false;
  }
  
  // Check if process is in protected list
  for (const protectedPattern of PROTECTED_PROCESSES) {
    if (protectedPattern.test(name)) {
      console.log(`🛡️  Protecting system process: ${name} (PID: ${pid})`);
      return false;
    }
  }
  
  // Check if process matches safe patterns
  for (const safePattern of SAFE_PROCESS_PATTERNS) {
    if (safePattern.test(name)) {
      console.log(`✅ Safe to terminate: ${name} (PID: ${pid})`);
      return true;
    }
  }
  
  // If not explicitly safe, don't kill it
  console.log(`⚠️  Skipping unknown process: ${name} (PID: ${pid})`);
  return false;
}

/**
 * Kill process by PID
 */
async function killProcess(pid) {
  try {
    await execAsync(`taskkill /F /PID ${pid}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to kill process ${pid}: ${error.message}`);
    return false;
  }
}

/**
 * Kill all Node.js processes (aggressive cleanup) - EXCEPT this script
 */
async function killAllNodeProcesses() {
  try {
    const currentPid = process.pid;
    console.log(`🔥 Performing aggressive Node.js cleanup (excluding PID ${currentPid})...`);
    
    // Get all node processes first
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH');
    
    if (stdout.trim()) {
      const lines = stdout.trim().split('\n');
      const processesToKill = [];
      
      for (const line of lines) {
        const parts = line.replace(/"/g, '').split(',');
        const pid = parseInt(parts[1]);
        const processName = parts[0];
        
        // Skip invalid PIDs
        if (!pid || isNaN(pid)) continue;
        
        const processInfo = { name: processName, pid, memory: parts[4] || '0' };
        
        // Use safety check before adding to kill list
        if (isSafeToKill(processInfo, currentPid)) {
          processesToKill.push(pid);
        }
      }
      
      if (processesToKill.length > 0) {
        console.log(`Found ${processesToKill.length} Node.js processes to terminate`);
        
        // Kill each process individually to avoid self-termination
        for (const pid of processesToKill) {
          try {
            await execAsync(`taskkill /F /PID ${pid}`);
            console.log(`✅ Terminated Node.js process ${pid}`);
          } catch (error) {
            console.log(`⚠️  Process ${pid} already terminated or inaccessible`);
          }
        }
      } else {
        console.log('ℹ️  No other Node.js processes found to kill');
      }
    } else {
      console.log('ℹ️  No Node.js processes found to kill');
    }
    
    return true;
  } catch (error) {
    console.log('ℹ️  Error during aggressive cleanup (this is usually safe to ignore):', error.message);
    return true;
  }
}

/**
 * Wait for port to be free
 */
async function waitForPortFree(port, maxWait = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const pid = await getProcessOnPort(port);
    if (!pid) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return false;
}

/**
 * Main cleanup function
 */
async function cleanup(options = {}) {
  const { aggressive = false, ports = DEV_PORTS } = options;
  
  console.log(`🎯 Checking ports: ${ports.join(', ')}\n`);
  
  const blockedPorts = [];
  const processesToKill = new Set();
  
  // Check each port for blocking processes
  for (const port of ports) {
    console.log(`🔍 Checking port ${port}...`);
    const pid = await getProcessOnPort(port);
    
    if (pid) {
      const processInfo = await getProcessInfo(pid);
      if (processInfo && isSafeToKill(processInfo, process.pid)) {
        console.log(`⚠️  Port ${port} blocked by ${processInfo.name} (PID: ${pid})`);
        blockedPorts.push({ port, pid, processInfo });
        processesToKill.add(pid);
      } else if (processInfo) {
        console.log(`🛡️  Port ${port} blocked by protected process ${processInfo.name} (PID: ${pid}) - skipping`);
      }
    } else {
      console.log(`✅ Port ${port} is free`);
    }
  }
  
  if (blockedPorts.length === 0) {
    console.log('\n🎉 All ports are free! No cleanup needed.');
    return true;
  }
  
  console.log(`\n🚨 Found ${blockedPorts.length} blocked ports`);
  
  if (aggressive) {
    // Kill all Node.js processes at once
    const success = await killAllNodeProcesses();
    
    if (success) {
      // Wait for all ports to be free
      console.log('\n⏳ Waiting for ports to be released...');
      const allFree = await Promise.all(
        ports.map(port => waitForPortFree(port))
      );
      
      if (allFree.every(free => free)) {
        console.log('✅ All ports are now free');
        return true;
      } else {
        console.log('❌ Some ports are still blocked');
        return false;
      }
    }
    
    return false;
  } else {
    // Kill specific processes
    let success = true;
    
    for (const pid of processesToKill) {
      console.log(`🔪 Killing process ${pid}...`);
      const killed = await killProcess(pid);
      if (!killed) {
        success = false;
      }
    }
    
    // Verify cleanup
    if (success) {
      console.log('\n⏳ Verifying cleanup...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      for (const port of ports) {
        const stillBlocked = await getProcessOnPort(port);
        if (stillBlocked) {
          console.log(`❌ Port ${port} is still blocked by PID ${stillBlocked}`);
          success = false;
        }
      }
    }
    
    return success;
  }
}

/**
 * Check port status without cleaning up
 */
async function checkPortStatus() {
  console.log('🔍 Port Status Check\n');
  
  const ports = [3005, 3006, 5173, 5174, 5175, 5176, 5177];
  const statusReport = [];
  
  for (const port of ports) {
    const pid = await getProcessOnPort(port);
    
    if (pid) {
      const processInfo = await getProcessInfo(pid);
      if (processInfo) {
        statusReport.push({
          port,
          status: 'BLOCKED',
          process: processInfo.name,
          pid: processInfo.pid,
          memory: processInfo.memory,
          safe: isSafeToKill(processInfo, process.pid)
        });
      } else {
        statusReport.push({
          port,
          status: 'BLOCKED',
          process: 'Unknown',
          pid,
          safe: false
        });
      }
    } else {
      statusReport.push({
        port,
        status: 'FREE',
        process: null,
        pid: null,
        safe: true
      });
    }
  }
  
  // Print status table
  console.log('Port | Status  | Process        | PID   | Safe | Memory');
  console.log('-----|---------|----------------|-------|------|-------');
  
  statusReport.forEach(({ port, status, process, pid, safe, memory }) => {
    const statusIcon = status === 'FREE' ? '✅' : (safe ? '⚠️ ' : '🛡️ ');
    const processName = process || '-';
    const pidStr = pid ? pid.toString() : '-';
    const safeStr = safe ? 'Yes' : 'No';
    const memStr = memory || '-';
    
    console.log(
      `${port.toString().padEnd(4)} | ${statusIcon}${status.padEnd(6)} | ${processName.padEnd(14)} | ${pidStr.padEnd(5)} | ${safeStr.padEnd(4)} | ${memStr}`
    );
  });
  
  const blockedCount = statusReport.filter(r => r.status === 'BLOCKED').length;
  const safeCount = statusReport.filter(r => r.status === 'BLOCKED' && r.safe).length;
  
  console.log('\n📊 Summary:');
  console.log(`   • ${statusReport.length - blockedCount} ports free`);
  console.log(`   • ${blockedCount} ports blocked`);
  console.log(`   • ${safeCount} blocked ports safe to clean`);
  console.log(`   • ${blockedCount - safeCount} blocked ports protected`);
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const aggressive = args.includes('--aggressive') || args.includes('-a');
  const help = args.includes('--help') || args.includes('-h');
  const status = args.includes('--status') || args.includes('-s');
  
  if (help) {
    console.log(`
🧹 Port Cleanup Script

Usage:
  node cleanup-ports.cjs [options]

Options:
  --status, -s        Check port status without cleaning up
  --aggressive, -a    Kill all Node.js processes at once  
  --help, -h          Show this help message

Examples:
  node cleanup-ports.cjs              # Clean up specific development ports
  node cleanup-ports.cjs --status     # Check which ports are blocked
  node cleanup-ports.cjs --aggressive # Kill all Node.js processes (safe)
`);
    process.exit(0);
  }
  
  if (status) {
    await checkPortStatus();
    process.exit(0);
  }
  
  try {
    const success = await cleanup({ aggressive });
    
    if (success) {
      console.log('\n🎉 Port cleanup completed successfully!');
      console.log('💡 You can now run "npm run dev" safely');
      process.exit(0);
    } else {
      console.log('\n❌ Port cleanup failed');
      console.log('💡 Try running with --aggressive flag');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Cleanup script failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = { cleanup, getProcessOnPort, killProcess, killAllNodeProcesses };

// Run if called directly
if (require.main === module) {
  main();
}