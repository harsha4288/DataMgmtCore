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

      // Filter out read-only fields for GraphQL input
      const input = {
        title: _item.title,
        content: _item.content,
        userTypes: _item.userTypes,
        context: _item.context,
        tags: _item.tags,
        priority: _item.priority
      };
      const result = await graphqlRequest(mutation, { id: _id, input });
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

      // Filter out read-only fields for GraphQL input  
      const input = {
        toolName: _item.toolName,
        category: _item.category,
        environment: _item.environment,
        configuration: JSON.stringify(_item.configuration || {}),
        userTypes: _item.userTypes,
        validationRules: _item.validationRules
      };
      const result = await graphqlRequest(mutation, { id: _id, input });
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

// ============================================================================
// Templates Hook
// ============================================================================

export function useTemplates(type?: string, userType?: string): ConfigurationHookResult<any> {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query = `
        query GetTemplates($type: String, $userType: String) {
          getTemplates(type: $type, userType: $userType) {
            id
            name
            type
            content
            variables {
              name
              type
              required
              defaultValue
            }
            conditions
            outputFormats
            userTypes
            lastUpdated
          }
        }
      `;

      const result = await graphqlRequest(query, { type, userType });
      setData(result.getTemplates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const create = async (item: any) => {
    try {
      const mutation = `
        mutation CreateTemplate($input: TemplateInput!) {
          createTemplate(input: $input) {
            success
            error
            template {
              id
              name
              type
              content
              variables {
                name
                type
                required
                defaultValue
              }
              conditions
              outputFormats
              userTypes
              lastUpdated
            }
          }
        }
      `;

      const result = await graphqlRequest(mutation, { input: item });
      if (result.createTemplate.success) {
        await refetch();
      } else {
        throw new Error(result.createTemplate.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
      throw err;
    }
  };

  const update = async (id: string, item: any) => {
    try {
      const mutation = `
        mutation UpdateTemplate($id: ID!, $input: TemplateInput!) {
          updateTemplate(id: $id, input: $input) {
            success
            error
            template {
              id
              name
              type
              content
              variables {
                name
                type
                required
                defaultValue
              }
              conditions
              outputFormats
              userTypes
              lastUpdated
            }
          }
        }
      `;

      // Filter out read-only fields for GraphQL input
      const input = {
        name: item.name,
        type: item.type,
        content: item.content,
        variables: item.variables,
        conditions: item.conditions,
        outputFormats: item.outputFormats,
        userTypes: item.userTypes
      };
      const result = await graphqlRequest(mutation, { id, input });
      if (result.updateTemplate.success) {
        await refetch();
      } else {
        throw new Error(result.updateTemplate.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template');
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      const mutation = `
        mutation DeleteTemplate($id: ID!) {
          deleteTemplate(id: $id) {
            success
            error
          }
        }
      `;

      const result = await graphqlRequest(mutation, { id });
      if (result.deleteTemplate.success) {
        await refetch();
      } else {
        throw new Error(result.deleteTemplate.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
      throw err;
    }
  };

  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, userType]);

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
// Quality Standards Hook
// ============================================================================

export function useQualityStandards(category?: string, userType?: string): ConfigurationHookResult<any> {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query = `
        query GetQualityStandards($category: String, $userType: String) {
          getQualityStandards(category: $category, userType: $userType) {
            id
            name
            category
            description
            rules {
              name
              description
              automated
              severity
              parameters
            }
            userTypes
            enabled
            lastUpdated
          }
        }
      `;

      const result = await graphqlRequest(query, { category, userType });
      setData(result.getQualityStandards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quality standards');
      console.error('Failed to fetch quality standards:', err);
    } finally {
      setLoading(false);
    }
  };

  const create = async (item: any) => {
    try {
      const mutation = `
        mutation CreateQualityStandard($input: QualityStandardInput!) {
          createQualityStandard(input: $input) {
            success
            error
            qualityStandard {
              id
              name
              category
              description
              rules {
                name
                description
                automated
                severity
                parameters
              }
              userTypes
              enabled
              lastUpdated
            }
          }
        }
      `;

      const result = await graphqlRequest(mutation, { input: item });
      if (result.createQualityStandard.success) {
        await refetch();
      } else {
        throw new Error(result.createQualityStandard.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quality standard');
      throw err;
    }
  };

  const update = async (id: string, item: any) => {
    try {
      const mutation = `
        mutation UpdateQualityStandard($id: ID!, $input: QualityStandardInput!) {
          updateQualityStandard(id: $id, input: $input) {
            success
            error
            qualityStandard {
              id
              name
              category
              description
              rules {
                name
                description
                automated
                severity
                parameters
              }
              userTypes
              enabled
              lastUpdated
            }
          }
        }
      `;

      // Filter out read-only fields for GraphQL input
      const input = {
        name: item.name,
        category: item.category,
        description: item.description,
        rules: item.rules,
        userTypes: item.userTypes,
        enabled: item.enabled
      };
      const result = await graphqlRequest(mutation, { id, input });
      if (result.updateQualityStandard.success) {
        await refetch();
      } else {
        throw new Error(result.updateQualityStandard.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quality standard');
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      const mutation = `
        mutation DeleteQualityStandard($id: ID!) {
          deleteQualityStandard(id: $id) {
            success
            error
          }
        }
      `;

      const result = await graphqlRequest(mutation, { id });
      if (result.deleteQualityStandard.success) {
        await refetch();
      } else {
        throw new Error(result.deleteQualityStandard.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quality standard');
      throw err;
    }
  };

  useEffect(() => {
    refetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, userType]);

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