/**
 * Documentation Status Constants
 * 
 * Official list of valid task and phase statuses as defined in 
 * docs/DOCUMENTATION_STANDARDS.md
 */

export const VALID_STATUSES = [
  // Development Statuses
  'Pending',
  'Next Priority', 
  'In Progress',
  
  // Blocked/Paused Statuses
  'Paused',
  'On Hold',
  
  // Final Statuses
  'Ready for Sign-off',
  'Complete',
  'Cancelled'
] as const;

export const STATUS_INFO = {
  'Pending': {
    emoji: '🟡',
    description: 'Not started, awaiting initiation',
    usage: 'Use for tasks that have not been started and are waiting to be initiated'
  },
  'Next Priority': {
    emoji: '🟡',
    description: 'Queued for upcoming work in pipeline',
    usage: 'Use for tasks that are next in line to be worked on, prioritized for immediate attention'
  },
  'In Progress': {
    emoji: '🟢',
    description: 'Currently being worked on (applies to both tasks AND phases)',
    usage: 'Use when actively working on a task or phase. Only ONE task/phase should be "In Progress" per branch'
  },
  'Paused': {
    emoji: '🟠',
    description: 'Partially completed work, temporarily halted',
    usage: 'Use for tasks that have been started but are temporarily stopped. Different from "On Hold" - implies work was begun'
  },
  'On Hold': {
    emoji: '🔴',
    description: 'Will resume later (strategic pause, dependencies, never-started tasks)',
    usage: 'Use for strategic delays, dependency blocks, or tasks that will be resumed later but were never started'
  },
  'Ready for Sign-off': {
    emoji: '🔄',
    description: 'Development complete, awaiting user approval/testing',
    usage: 'Required intermediate status before completion. Use when work is done but needs human verification'
  },
  'Complete': {
    emoji: '✅',
    description: 'Fully finished and approved',
    usage: 'Final status indicating task is completely done and approved. AI cannot set this without human approval'
  },
  'Cancelled': {
    emoji: '❌',
    description: 'Permanently discontinued, will not be completed',
    usage: 'Use for tasks that are permanently abandoned and will never be completed'
  }
} as const;

export type ValidStatus = typeof VALID_STATUSES[number];

export const isValidStatus = (status: string): status is ValidStatus => {
  return VALID_STATUSES.includes(status as ValidStatus);
};

export const getStatusInfo = (status: string) => {
  if (isValidStatus(status)) {
    return STATUS_INFO[status];
  }
  return {
    emoji: '❓',
    description: `Unknown status: ${status}`,
    usage: `"${status}" is not a valid status. Please use one of: ${VALID_STATUSES.join(', ')}`
  };
};

export const getValidStatusList = (): string => {
  return VALID_STATUSES.map(status => 
    `${STATUS_INFO[status].emoji} **${status}**: ${STATUS_INFO[status].description}`
  ).join('\n');
};