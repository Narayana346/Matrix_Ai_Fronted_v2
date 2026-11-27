import { ChatMessage, DeployResponse, FileNode, LoginCredentials, LoginResponse, ProjectSummaryResponse, ProjectRequest, ProjectResponse, ProjectMember, ProjectRole, SignupRequest, AuthResponse, OpenRouterModel } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const getAuthToken = () => localStorage.getItem("auth_token");

export const setAuthToken = (token: string) => localStorage.setItem("auth_token", token);

export const removeAuthToken = () => localStorage.removeItem("auth_token");

export const isAuthenticated = () => !!getAuthToken();

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Dispatched whenever a request fails because the session is missing/expired,
// so the UI (outside of any single component) can react by routing to /login.
export const AUTH_EXPIRED_EVENT = "auth:expired";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let sessionExpiredNotified = false;

const handleSessionExpired = () => {
  removeAuthToken();
  removeUserInfo();
  if (!sessionExpiredNotified) {
    sessionExpiredNotified = true;
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    // Allow future expirations (e.g. after a fresh login) to notify again.
    setTimeout(() => { sessionExpiredNotified = false; }, 1000);
  }
};

// Wraps fetch so any 401/403 (missing, invalid, or expired token) is handled
// in one place: clear the stale session and let listeners redirect to /login.
async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  if (response.status === 401 || response.status === 403) {
    handleSessionExpired();
    throw new ApiError("Your session has expired. Please log in again.", response.status);
  }

  return response;
}

// Lets callers skip showing their own generic error toast when the real
// cause was a session expiry, since AuthExpiryListener already surfaces that.
export const isAuthError = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 401 || error.status === 403);

// User info storage
export const setUserInfo = (user: { id: number; username: string; name: string }) => {
  localStorage.setItem("user_info", JSON.stringify(user));
};

export const getUserInfo = (): { id: number; username: string; name: string } | null => {
  const userInfo = localStorage.getItem("user_info");
  return userInfo ? JSON.parse(userInfo) : null;
};

export const removeUserInfo = () => localStorage.removeItem("user_info");

// LocalStorage keys
export const PREVIEW_URL_KEY = "preview_url";
export const OPEN_TABS_KEY = "open_tabs";
export const ACTIVE_TAB_KEY = "active_tab";
export const SELECTED_MODEL_KEY = "selected_model";

// API response format for files endpoint
interface FilesApiResponse {
  files: { path: string }[];
}

// Convert flat file paths to nested tree structure
function buildFileTree(paths: { path: string }[]): FileNode[] {
  const root: FileNode[] = [];
  const nodeMap = new Map<string, FileNode>();

  // Sort paths to ensure directories come before their children
  const sortedPaths = [...paths].sort((a, b) => a.path.localeCompare(b.path));

  for (const { path } of sortedPaths) {
    const parts = path.split("/");
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      // Skip if node already exists
      if (nodeMap.has(currentPath)) continue;

      const isFile = i === parts.length - 1;
      const node: FileNode = {
        name: part,
        path: currentPath,
        type: isFile ? "file" : "directory",
        children: isFile ? undefined : [],
      };

      nodeMap.set(currentPath, node);

      if (parentPath) {
        const parent = nodeMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      } else {
        root.push(node);
      }
    }
  }

  // Sort each level: directories first, then alphabetically
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === "directory" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "directory") return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(root);
  return root;
}

export const api = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${BASE_URL}/api/v1/account/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Login failed");
    }

    return response.json();
  },

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/api/v1/account/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Signup failed");
    }

    return response.json();
  },

  async getFiles(projectId: string): Promise<FileNode[]> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${projectId}/files`, {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch files");
    }

    const data: FilesApiResponse = await response.json();
    return buildFileTree(data.files);
  },

  async getFileContent(projectId: string, path: string): Promise<string> {
    const response = await apiFetch(
      `${BASE_URL}/api/v1/workspace/projects/${projectId}/files/content?path=${path}`,
      {
        headers: { ...getAuthHeaders() },
      }
    );

    if (!response.ok) {
      console.error(`Error fetching file: ${response.status} ${response.statusText}`);
      throw new Error("Failed to fetch file content");
    }

    // The backend returns the raw file as text/plain, not JSON-wrapped.
    return response.text();
  },

  async saveFileContent(projectId: string, path: string, content: string): Promise<void> {
    const response = await apiFetch(
      `${BASE_URL}/api/v1/workspace/projects/${projectId}/files/content`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ path, content }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save file content");
    }
  },

  async deploy(projectId: string): Promise<DeployResponse> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${projectId}/deploy`, {
      method: "POST",
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Deployment failed");
    }

    return response.json();
  },

  async getProjects(): Promise<ProjectSummaryResponse[]> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects`, {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    return response.json();
  },

  async createProject(name: string): Promise<ProjectSummaryResponse> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error("Failed to create project");
    }

    return response.json();
  },

  async getProject(id: string): Promise<ProjectResponse> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${id}`, {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch project");
    }

    return response.json();
  },

  async updateProject(id: string, name: string): Promise<ProjectResponse> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error("Failed to update project");
    }

    return response.json();
  },

  async deleteProject(id: string): Promise<void> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Failed to delete project");
    }
  },

  async downloadProjectZip(id: string): Promise<Blob> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${id}/files/download-zip`, {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Failed to download project");
    }

    return response.blob();
  },

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${projectId}/members`, {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch project members");
    }

    return response.json();
  },

  async inviteMember(projectId: string, username: string, role: ProjectRole): Promise<void> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ username, role }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to invite member");
    }
  },

  async updateMemberRole(projectId: string, userId: number, role: ProjectRole): Promise<void> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${projectId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      throw new Error("Failed to update member role");
    }
  },

  async removeMember(projectId: string, userId: number): Promise<void> {
    const response = await apiFetch(`${BASE_URL}/api/v1/workspace/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Failed to remove member");
    }
  },

  async getChatHistory(projectId: string): Promise<ChatMessage[]> {
    const response = await apiFetch(`${BASE_URL}/api/v1/intelligence/chat/projects/${projectId}`, {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch chat history");
    }

    return response.json();
  },

  async getAvailableModels(): Promise<OpenRouterModel[]> {
    const response = await apiFetch(`${BASE_URL}/api/v1/intelligence/chat/models`, {
      headers: { ...getAuthHeaders() },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch available models");
    }

    return response.json();
  },

  async streamChat(
    projectId: string,
    message: string,
    onChunk: (chunk: string) => void,
    onFile: (path: string, content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    model?: string
  ) {
    const controller = new AbortController();

    fetch(`${BASE_URL}/api/v1/intelligence/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ message, projectId, model }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          handleSessionExpired();
          throw new ApiError("Your session has expired. Please log in again.", response.status);
        }
        if (!response.ok) throw new Error("Chat stream failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();

        // Buffers
        let sseBuffer = ""; // To handle split SSE lines
        let fullContentBuffer = ""; // To accumulate clean text for file regex
        let lastProcessedIndex = 0; // Optimization for regex

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          sseBuffer += chunk;

          // Process line by line to handle SSE format (data: ...)
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

            const dataStr = trimmedLine.slice(5).trim();
            if (!dataStr) continue;

            try {
              // FIX: Parse JSON to get the real text with newlines preserved
              const parsed = JSON.parse(dataStr);
              const content = parsed.text;

              // 1. Send clean text to UI
              onChunk(content);

              // 2. Accumulate for file parsing (Same as before)
              fullContentBuffer += content;
              // ... (rest of regex logic) ...

            } catch (e) {
              console.error("Failed to parse SSE JSON:", e);
            }
          }
        }

        onComplete();
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Stream error:", error);
          onError(error);
        }
      });

    return () => controller.abort();
  }

};
