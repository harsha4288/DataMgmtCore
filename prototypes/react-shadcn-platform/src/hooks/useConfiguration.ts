/**
 * React hook for Configuration Management
 * Connects UI to real GraphQL database operations
 */

import { useState, useEffect } from 'react';
import { UserInstruction, ToolConfiguration } from '@/lib/documentation-system/types';
import { getGraphQLEndpoint } from '@/lib/config';

interface ConfigurationHookResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  create: (_item: Partial<T>) => Promise<void>;
  update: (_id: string, _item: Partial<T>) => Promise<void>;
  remove: (_id: string) => Promise<void>;
}

const GRAPHQL_ENDPOINT = getGraphQLEndpoint();

async function graphqlRequest(query: string, variables?: any) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL error');
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}

// ============================================================================
// User Instructions Hook
// ============================================================================

export function useUserInstructions(userType?: string, context?: string): ConfigurationHookResult<UserInstruction> {
  const [data, setData] = useState<UserInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query = `
        query GetUserInstructions($userType: String, $context: String) {
          getUserInstructions(userType: $userType, context: $context) {
            id
            title
            content
            userTypes
            context
            tags
            priority
            lastUpdated
            version
          }
        }
      `;

      const result = await graphqlRequest(query, { userType, context });
      setData(result.getUserInstructions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch instructions');
      console.error('Failed to fetch user instructions:', err);
    } finally {
      setLoading(false);
    }
  };

  const create = async (_item: Partial<UserInstruction>) => {
    try {
      const mutation = `
        mutation CreateUserInstruction($input: UserInstructionInput!) {
          createUserInstruction(input: $input) {
            success
            error
            userInstruction {
              id
              title
              content
              userTypes
              context
              tags
              priority
              lastUpdated
              version
            }
          }
        }
      `;

      const result = await graphqlRequest(mutation, { input: _item });
      if (result.createUserInstruction.success) {
        await refetch();
      } else {
        throw new Error(result.createUserInstruction.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create instruction');
      throw err;
    }
  };

  const update = async (_id: string, _item: Partial<UserInstruction>) => {
    try {
      const mutation = `
        mutation UpdateUserInstruction($id: ID!, $input: UserInstructionInput!) {
          updateUserInstruction(id: $id, input: $input) {
            success
            error
            userInstruction {
              id
              title
              content
              userTypes
              context
              tags
              priority
              lastUpdated
              version
            }
          }
        }
      `;

      const result = await graphqlRequest(mutation, { id: _id, input: _item });
      if (result.updateUserInstruction.success) {
        await refetch();
      } else {
        throw new Error(result.updateUserInstruction.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update instruction');
      throw err;
    }
  };

  const remove = async (_id: string) => {
    try {
      const mutation = `
        mutation DeleteUserInstruction($id: ID!) {
          deleteUserInstruction(id: $id) {
            success
            error
          }
        }
      `;

      const result = await graphqlRequest(mutation, { id: _id });
      if (result.deleteUserInstruction.success) {
        await refetch();
      } else {
        throw new Error(result.deleteUserInstruction.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete instruction');
      throw err;
    }
  };

  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType, context]);

  return {
    data,
    loading,
    error,
    refetch,
    create,
    update,
    remove
  };
}

// ============================================================================
// Tool Configurations Hook
// ============================================================================

export function useToolConfigurations(category?: string, environment?: string, userType?: string): ConfigurationHookResult<ToolConfiguration> {
  const [data, setData] = useState<ToolConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query = `
        query GetToolConfigurations($category: String, $environment: String, $userType: String) {
          getToolConfigurations(category: $category, environment: $environment, userType: $userType) {
            id
            toolName
            category
            environment
            configuration
            userTypes
            validationRules
            lastUpdated
          }
        }
      `;

      const result = await graphqlRequest(query, { category, environment, userType });
      setData(result.getToolConfigurations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch configurations');
      console.error('Failed to fetch tool configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  const create = async (_item: Partial<ToolConfiguration>) => {
    try {
      const mutation = `
        mutation CreateToolConfiguration($input: ToolConfigurationInput!) {
          createToolConfiguration(input: $input) {
            success
            error
            toolConfiguration {
              id
              toolName
              category
              environment
              configuration
              userTypes
              validationRules
              lastUpdated
            }
          }
        }
      `;

      const result = await graphqlRequest(mutation, { input: _item });
      if (result.createToolConfiguration.success) {
        await refetch();
      } else {
        throw new Error(result.createToolConfiguration.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create configuration');
      throw err;
    }
  };

  const update = async (_id: string, _item: Partial<ToolConfiguration>) => {
    try {
      const mutation = `
        mutation UpdateToolConfiguration($id: ID!, $input: ToolConfigurationInput!) {
          updateToolConfiguration(id: $id, input: $input) {
            success
            error
            toolConfiguration {
              id
              toolName
              category
              environment
              configuration
              userTypes
              validationRules
              lastUpdated
            }
          }
        }
      `;

      const result = await graphqlRequest(mutation, { id: _id, input: _item });
      if (result.updateToolConfiguration.success) {
        await refetch();
      } else {
        throw new Error(result.updateToolConfiguration.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
      throw err;
    }
  };

  const remove = async (_id: string) => {
    try {
      const mutation = `
        mutation DeleteToolConfiguration($id: ID!) {
          deleteToolConfiguration(id: $id) {
            success
            error
          }
        }
      `;

      const result = await graphqlRequest(mutation, { id: _id });
      if (result.deleteToolConfiguration.success) {
        await refetch();
      } else {
        throw new Error(result.deleteToolConfiguration.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
      throw err;
    }
  };

  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, environment, userType]);

  return {
    data,
    loading,
    error,
    refetch,
    create,
    update,
    remove
  };
}

// ============================================================================
// Search Hook
// ============================================================================

export function useInstructionSearch() {
  const [results, setResults] = useState<UserInstruction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string, userType?: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const searchQuery = `
        query SearchUserInstructions($query: String!, $userType: String) {
          searchUserInstructions(query: $query, userType: $userType) {
            id
            title
            content
            userTypes
            context
            tags
            priority
            lastUpdated
            version
          }
        }
      `;

      const result = await graphqlRequest(searchQuery, { query, userType });
      setResults(result.searchUserInstructions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    error,
    search
  };
}