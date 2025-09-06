import supabase from "@/frontend/lib/supabase";
import { ApiResponse, Workspace } from "@/frontend/lib/types";

async function generateUniqueWorkspaceName(baseName: string = "test"): Promise<{
  name: string;
  slug: string;
}> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Failed to get authentication session");
  }

  // Check if base name is available
  let counter = 0;
  let name = baseName;
  let slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, "-");

  while (true) {
    const response = await fetch("/api/v1/workspaces", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to check existing workspaces");
    }

    const data: ApiResponse<Workspace[]> = await response.json();
    const workspaces = data.data || [];

    // Check if current slug exists
    const slugExists = workspaces.some((workspace) => workspace.slug === slug);

    if (!slugExists) {
      break;
    }

    counter++;
    name = `${baseName} ${counter}`;
    slug = `${baseName}-${counter}`.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // Safety check to avoid infinite loop
    if (counter > 999) {
      throw new Error("Unable to generate unique workspace name");
    }
  }

  return { name, slug };
}

/**
 * Creates a default workspace for a new user
 * @returns The created workspace
 */
export async function createDefaultWorkspace(): Promise<Workspace> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Failed to get authentication session");
  }

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    throw new Error("Failed to validate authentication claims");
  }

  // Generate unique workspace name and slug
  const { name, slug } = await generateUniqueWorkspaceName("test");

  // Create workspace data
  const workspaceData = {
    slug,
    name,
    description: "Your default workspace to get started with monitoring",
    members: [], // No additional members to invite
  };

  // Create the workspace
  const response = await fetch("/api/v1/workspaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workspaceData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create default workspace");
  }

  const result: ApiResponse<Workspace> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to create default workspace");
  }

  return result.data;
}

/**
 * Checks if a user has any workspaces and creates a default one if they don't
 * @returns The user's workspaces (including newly created default if applicable)
 */
export async function ensureUserHasWorkspace(): Promise<Workspace[]> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error("Failed to get authentication session");
  }

  // Fetch user's existing workspaces
  const response = await fetch("/api/v1/workspaces", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch workspaces");
  }

  const data: ApiResponse<Workspace[]> = await response.json();
  const workspaces = data.data || [];

  // If user has no workspaces, create a default one
  if (workspaces.length === 0) {
    const defaultWorkspace = await createDefaultWorkspace();
    return [defaultWorkspace];
  }

  return workspaces;
}
