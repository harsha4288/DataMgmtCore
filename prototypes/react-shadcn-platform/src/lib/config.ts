/**
 * Application Configuration
 * Centralized configuration management with environment variable support
 */

interface AppConfig {
  graphql: {
    url: string;
    playgroundEnabled: boolean;
  };
  validation: {
    url: string;
  };
  dashboard: {
    url: string;
  };
  environment: 'development' | 'production' | 'test';
  version: string;
}

// Default configuration for development
const defaultConfig: AppConfig = {
  graphql: {
    url: 'http://localhost:3004/graphql',
    playgroundEnabled: true,
  },
  validation: {
    url: 'http://localhost:3005',
  },
  dashboard: {
    url: 'http://localhost:3001',
  },
  environment: 'development',
  version: '1.0.0',
};

// Production configuration
const productionConfig: AppConfig = {
  graphql: {
    url: '/api/graphql',
    playgroundEnabled: false,
  },
  validation: {
    url: '/api/validation',
  },
  dashboard: {
    url: '/api/dashboard',
  },
  environment: 'production',
  version: '1.0.0',
};

// Environment variable detection for Vite
const isProduction = (import.meta as any).env?.MODE === 'production' || 
                     (import.meta as any).env?.NODE_ENV === 'production' ||
                     (typeof window !== 'undefined' && window.location.protocol === 'https:');

// Create runtime configuration
function createConfig(): AppConfig {
  if (isProduction) {
    return {
      ...productionConfig,
      graphql: {
        url: (import.meta as any).env?.VITE_GRAPHQL_URL || productionConfig.graphql.url,
        playgroundEnabled: productionConfig.graphql.playgroundEnabled,
      },
      validation: {
        url: (import.meta as any).env?.VITE_VALIDATION_URL || productionConfig.validation.url,
      },
      dashboard: {
        url: (import.meta as any).env?.VITE_DASHBOARD_URL || productionConfig.dashboard.url,
      },
      version: (import.meta as any).env?.VITE_APP_VERSION || productionConfig.version,
    };
  }

  return {
    ...defaultConfig,
    graphql: {
      url: import.meta.env?.VITE_GRAPHQL_URL || defaultConfig.graphql.url,
      playgroundEnabled: defaultConfig.graphql.playgroundEnabled,
    },
    validation: {
      url: import.meta.env?.VITE_VALIDATION_URL || defaultConfig.validation.url,
    },
    dashboard: {
      url: import.meta.env?.VITE_DASHBOARD_URL || defaultConfig.dashboard.url,
    },
    version: import.meta.env?.VITE_APP_VERSION || defaultConfig.version,
  };
}

// Export singleton configuration
export const config = createConfig();

// Helper functions for common patterns
export const getGraphQLEndpoint = () => config.graphql.url;
export const getValidationEndpoint = () => config.validation.url;
export const getDashboardEndpoint = () => config.dashboard.url;

// Health check endpoints
export const getHealthCheckEndpoints = () => ({
  graphql: `${config.graphql.url.replace('/graphql', '')}/health`,
  validation: `${config.validation.url}/health`,
  dashboard: `${config.dashboard.url}/api/status`,
});

export default config;