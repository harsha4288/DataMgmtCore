import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { ProjectEntity } from './ExpandableProjectTree';

export interface TreeDataState {
  projectData: ProjectEntity;
  expandedNodes: Set<string>;
  selectedEntity: ProjectEntity | null;
  searchTerm: string;
  filterType: ProjectEntity['type'] | 'all';
  filterStatus: ProjectEntity['status'] | 'all';
  isLoading: boolean;
  error: string | null;
}

export type TreeDataAction =
  | { type: 'SET_PROJECT_DATA'; payload: ProjectEntity }
  | { type: 'UPDATE_ENTITY'; payload: { entityId: string; updates: Partial<ProjectEntity> } }
  | { type: 'TOGGLE_NODE_EXPANSION'; payload: string }
  | { type: 'EXPAND_NODE'; payload: string }
  | { type: 'COLLAPSE_NODE'; payload: string }
  | { type: 'SELECT_ENTITY'; payload: ProjectEntity | null }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_FILTER_TYPE'; payload: ProjectEntity['type'] | 'all' }
  | { type: 'SET_FILTER_STATUS'; payload: ProjectEntity['status'] | 'all' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_FILTERS' };

const initialState: TreeDataState = {
  projectData: {} as ProjectEntity,
  expandedNodes: new Set(),
  selectedEntity: null,
  searchTerm: '',
  filterType: 'all',
  filterStatus: 'all',
  isLoading: false,
  error: null,
};

function treeDataReducer(state: TreeDataState, action: TreeDataAction): TreeDataState {
  switch (action.type) {
    case 'SET_PROJECT_DATA':
      return {
        ...state,
        projectData: action.payload,
        error: null,
        isLoading: false,
      };

    case 'UPDATE_ENTITY': {
      const { entityId, updates } = action.payload;
      const updatedProjectData = updateEntityInTree(state.projectData, entityId, updates);
      
      return {
        ...state,
        projectData: updatedProjectData,
        selectedEntity: state.selectedEntity?.id === entityId 
          ? { ...state.selectedEntity, ...updates } 
          : state.selectedEntity,
      };
    }

    case 'TOGGLE_NODE_EXPANSION': {
      const newExpandedNodes = new Set(state.expandedNodes);
      if (newExpandedNodes.has(action.payload)) {
        newExpandedNodes.delete(action.payload);
      } else {
        newExpandedNodes.add(action.payload);
      }
      return {
        ...state,
        expandedNodes: newExpandedNodes,
      };
    }

    case 'EXPAND_NODE':
      return {
        ...state,
        expandedNodes: new Set([...state.expandedNodes, action.payload]),
      };

    case 'COLLAPSE_NODE': {
      const newExpandedNodes = new Set(state.expandedNodes);
      newExpandedNodes.delete(action.payload);
      return {
        ...state,
        expandedNodes: newExpandedNodes,
      };
    }

    case 'SELECT_ENTITY':
      return {
        ...state,
        selectedEntity: action.payload,
      };

    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload,
      };

    case 'SET_FILTER_TYPE':
      return {
        ...state,
        filterType: action.payload,
      };

    case 'SET_FILTER_STATUS':
      return {
        ...state,
        filterStatus: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        searchTerm: '',
        filterType: 'all',
        filterStatus: 'all',
      };

    default:
      return state;
  }
}

// Helper function to update entity in tree structure
function updateEntityInTree(
  entity: ProjectEntity,
  targetId: string,
  updates: Partial<ProjectEntity>
): ProjectEntity {
  if (entity.id === targetId) {
    return { ...entity, ...updates, updatedAt: new Date() };
  }

  if (entity.children) {
    return {
      ...entity,
      children: entity.children.map(child =>
        updateEntityInTree(child, targetId, updates)
      ),
    };
  }

  return entity;
}

export interface TreeDataContextType {
  state: TreeDataState;
  dispatch: React.Dispatch<TreeDataAction>;
  
  // Convenience methods
  updateEntity: (entityId: string, updates: Partial<ProjectEntity>) => void;
  toggleNodeExpansion: (entityId: string) => void;
  expandNode: (entityId: string) => void;
  collapseNode: (entityId: string) => void;
  selectEntity: (entity: ProjectEntity | null) => void;
  setSearchTerm: (term: string) => void;
  setFilterType: (type: ProjectEntity['type'] | 'all') => void;
  setFilterStatus: (status: ProjectEntity['status'] | 'all') => void;
  clearFilters: () => void;
  
  // Utility methods
  isNodeExpanded: (entityId: string) => boolean;
  getEntityById: (entityId: string) => ProjectEntity | null;
  getFilteredData: () => ProjectEntity;
}

const TreeDataContext = createContext<TreeDataContextType | null>(null);

export interface TreeDataProviderProps {
  children: ReactNode;
  projectData: ProjectEntity;
  onEntityUpdate?: (entityId: string, updates: Partial<ProjectEntity>) => void;
}

export const TreeDataProvider: React.FC<TreeDataProviderProps> = ({
  children,
  projectData,
  onEntityUpdate
}) => {
  const [state, dispatch] = useReducer(treeDataReducer, {
    ...initialState,
    projectData,
  });

  // Convenience methods
  const updateEntity = useCallback((entityId: string, updates: Partial<ProjectEntity>) => {
    dispatch({ type: 'UPDATE_ENTITY', payload: { entityId, updates } });
    onEntityUpdate?.(entityId, updates);
  }, [onEntityUpdate]);

  const toggleNodeExpansion = useCallback((entityId: string) => {
    dispatch({ type: 'TOGGLE_NODE_EXPANSION', payload: entityId });
  }, []);

  const expandNode = useCallback((entityId: string) => {
    dispatch({ type: 'EXPAND_NODE', payload: entityId });
  }, []);

  const collapseNode = useCallback((entityId: string) => {
    dispatch({ type: 'COLLAPSE_NODE', payload: entityId });
  }, []);

  const selectEntity = useCallback((entity: ProjectEntity | null) => {
    dispatch({ type: 'SELECT_ENTITY', payload: entity });
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  const setFilterType = useCallback((type: ProjectEntity['type'] | 'all') => {
    dispatch({ type: 'SET_FILTER_TYPE', payload: type });
  }, []);

  const setFilterStatus = useCallback((status: ProjectEntity['status'] | 'all') => {
    dispatch({ type: 'SET_FILTER_STATUS', payload: status });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  // Utility methods
  const isNodeExpanded = useCallback((entityId: string) => {
    return state.expandedNodes.has(entityId);
  }, [state.expandedNodes]);

  const getEntityById = useCallback((entityId: string): ProjectEntity | null => {
    const findEntity = (entity: ProjectEntity): ProjectEntity | null => {
      if (entity.id === entityId) {
        return entity;
      }
      if (entity.children) {
        for (const child of entity.children) {
          const found = findEntity(child);
          if (found) return found;
        }
      }
      return null;
    };
    return findEntity(state.projectData);
  }, [state.projectData]);

  const getFilteredData = useCallback((): ProjectEntity => {
    if (!state.searchTerm && state.filterType === 'all' && state.filterStatus === 'all') {
      return state.projectData;
    }

    const filterEntity = (entity: ProjectEntity): ProjectEntity | null => {
      const matchesType = state.filterType === 'all' || entity.type === state.filterType;
      const matchesStatus = state.filterStatus === 'all' || entity.status === state.filterStatus;
      const matchesSearch = !state.searchTerm || 
        entity.title.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        entity.description?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        entity.recentActivity?.toLowerCase().includes(state.searchTerm.toLowerCase());

      const filteredChildren = entity.children?.map(filterEntity).filter(Boolean) as ProjectEntity[] | undefined;

      if (matchesType && matchesStatus && matchesSearch) {
        return { ...entity, children: filteredChildren };
      } else if (filteredChildren && filteredChildren.length > 0) {
        return { ...entity, children: filteredChildren };
      }

      return null;
    };

    const filtered = filterEntity(state.projectData);
    return filtered || state.projectData;
  }, [state.projectData, state.searchTerm, state.filterType, state.filterStatus]);

  const contextValue: TreeDataContextType = {
    state,
    dispatch,
    updateEntity,
    toggleNodeExpansion,
    expandNode,
    collapseNode,
    selectEntity,
    setSearchTerm,
    setFilterType,
    setFilterStatus,
    clearFilters,
    isNodeExpanded,
    getEntityById,
    getFilteredData,
  };

  return (
    <TreeDataContext.Provider value={contextValue}>
      {children}
    </TreeDataContext.Provider>
  );
};

export const useTreeData = (): TreeDataContextType => {
  const context = useContext(TreeDataContext);
  if (!context) {
    throw new Error('useTreeData must be used within a TreeDataProvider');
  }
  return context;
};

export default TreeDataProvider;