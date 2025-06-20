import React, { createContext, useContext, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { supabase } from '../supabase'
import { ApiResponse, Workspace } from '../types'

interface WorkspaceContextType {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace | null) => void
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

async function fetchWorkspaces() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error("Session Error:", sessionError)
    throw new Error("Failed to get authentication session")
  }

  if (!session?.access_token) {
    throw new Error("No authentication session")
  }

  const response = await fetch("/api/workspaces", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  })

  const data: ApiResponse<Workspace[]> = await response.json()

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch workspaces")
  }

  return data.data
}

const CURRENT_WORKSPACE_KEY = 'shamva-current-workspace'
const CURRENT_SECTION_KEY = 'shamva-current-section'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [currentWorkspaceId, setCurrentWorkspaceId] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CURRENT_WORKSPACE_KEY)
    }
    return null
  })

  const query = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const workspaces = query.data ?? []
  const currentWorkspace = useMemo(() => {
    if (!currentWorkspaceId) {
      return workspaces.length > 0 ? workspaces[0] : null
    }
    return workspaces.find(w => w.id === currentWorkspaceId) || null
  }, [workspaces, currentWorkspaceId])

  // Get current section from URL
  const getCurrentSection = useCallback(() => {
    const pathParts = location.pathname.split('/')
    const workspaceIndex = pathParts.findIndex(part => part === '$workspaceName' || workspaces.some(w => w.name === part))
    
    if (workspaceIndex !== -1 && pathParts[workspaceIndex + 1]) {
      return pathParts[workspaceIndex + 1]
    }
    
    return 'monitors' 
  }, [location.pathname, workspaces])

  const saveCurrentSection = useCallback((section: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_SECTION_KEY, section)
    }
  }, [])

  const getSavedSection = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CURRENT_SECTION_KEY) || 'monitors'
    }
    return 'monitors'
  }, [])

  const setCurrentWorkspace = useCallback((workspace: Workspace | null) => {
    const workspaceId = workspace?.id || null
    setCurrentWorkspaceId(workspaceId)
    
    if (typeof window !== 'undefined') {
      if (workspaceId) {
        localStorage.setItem(CURRENT_WORKSPACE_KEY, workspaceId)
      } else {
        localStorage.removeItem(CURRENT_WORKSPACE_KEY)
      }
    }

    if (workspace) {
      const currentSection = getCurrentSection()
      saveCurrentSection(currentSection)
      
      navigate({
        to: `/dashboard/$workspaceName/${currentSection}`,
        params: { workspaceName: workspace.name }
      })
    }
  }, [navigate, getCurrentSection, saveCurrentSection])

  useEffect(() => {
    if (!query.isLoading && workspaces.length === 0) {
      navigate({ to: "/dashboard/workspaces/new" })
    }
  }, [workspaces.length, query.isLoading, navigate])

  useEffect(() => {
    if (currentWorkspaceId && !workspaces.find(w => w.id === currentWorkspaceId)) {
      setCurrentWorkspace(workspaces.length > 0 ? workspaces[0] : null)
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspace])

  useEffect(() => {
    if (currentWorkspace && !query.isLoading) {
      const pathParts = location.pathname.split('/')
      const isInWorkspaceRoute = pathParts.includes(currentWorkspace.name)
      
      if (!isInWorkspaceRoute && location.pathname.startsWith('/dashboard')) {
        const savedSection = getSavedSection()
        navigate({
          to: `/dashboard/$workspaceName/${savedSection}`,
          params: { workspaceName: currentWorkspace.name }
        })
      }
    }
  }, [currentWorkspace, location.pathname, query.isLoading, navigate, getSavedSection])

  const value = useMemo(() => ({
    workspaces,
    currentWorkspace,
    setCurrentWorkspace,
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  }), [workspaces, currentWorkspace, setCurrentWorkspace, query.isLoading, query.error, query.refetch])

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaces() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspaces must be used within a WorkspaceProvider')
  }
  return context
}