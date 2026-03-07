export type ApiClientOptions = {
  baseUrl: string;
  sessionId?: string;
  fetchImpl?: typeof fetch;
};

function headers(sessionId?: string): Record<string, string> {
  return sessionId ? { "x-session-id": sessionId } : {};
}

export function createApiClient(options: ApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const request = async (path: string, init?: RequestInit) => {
    const response = await fetchImpl(`${options.baseUrl}${path}`, init);
    const body = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      throw new Error((body && body.error) || `Request failed: ${response.status}`);
    }
    return body;
  };

  return {
    register(payload: { email: string; username: string; password: string; role?: string }) {
      return request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },
    login(payload: { email: string; password: string }) {
      return request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },
    createGame(payload: Record<string, unknown>) {
      return request("/games", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers(options.sessionId) },
        body: JSON.stringify(payload)
      });
    },
    createVersion(gameId: string, payload: Record<string, unknown>) {
      return request(`/games/${gameId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers(options.sessionId) },
        body: JSON.stringify(payload)
      });
    },
    uploadVersion(versionId: string, payload: Record<string, unknown>) {
      return request(`/versions/${versionId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers(options.sessionId) },
        body: JSON.stringify(payload)
      });
    },
    submitForReview(versionId: string) {
      return request(`/versions/${versionId}/submit-for-review`, {
        method: "POST",
        headers: headers(options.sessionId)
      });
    },
    approveVersion(versionId: string) {
      return request(`/versions/${versionId}/approve`, {
        method: "POST",
        headers: headers(options.sessionId)
      });
    },
    publishVersion(versionId: string) {
      return request(`/versions/${versionId}/publish`, {
        method: "POST",
        headers: headers(options.sessionId)
      });
    },
    createPlaySession(payload: Record<string, unknown>) {
      return request("/play-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers(options.sessionId) },
        body: JSON.stringify(payload)
      });
    },
    listGames() {
      return request("/games");
    },
    getGame(slug: string) {
      return request(`/games/${slug}`);
    }
  };
}
