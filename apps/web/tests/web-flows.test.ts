import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../lib/api-client.js";

describe("web app flow helpers", () => {
  it("supports game creation flow via API client", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ game: { id: "g1" } })
    }));
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      sessionId: "session-dev",
      fetchImpl: fetchMock as unknown as typeof fetch
    });
    const response = await client.createGame({ slug: "g1" });
    expect(response.game.id).toBe("g1");
  });

  it("supports version upload flow", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ submission: { id: "s1" } })
    }));
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      sessionId: "session-dev",
      fetchImpl: fetchMock as unknown as typeof fetch
    });
    const response = await client.uploadVersion("v1", { sourceArchiveStorageKey: "fixtures/game.zip" });
    expect(response.submission.id).toBe("s1");
  });

  it("supports moderator approve flow", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ version: { id: "v1", reviewState: "approved" } })
    }));
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      sessionId: "session-mod",
      fetchImpl: fetchMock as unknown as typeof fetch
    });
    const response = await client.approveVersion("v1");
    expect(response.version.reviewState).toBe("approved");
  });

  it("supports play launch flow", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ session: { id: "p1" }, sessionToken: "token" })
    }));
    const client = createApiClient({
      baseUrl: "http://localhost:4000",
      sessionId: "session-player",
      fetchImpl: fetchMock as unknown as typeof fetch
    });
    const response = await client.createPlaySession({ gameVersionId: "v1", runtimeVersion: "1.0.0" });
    expect(response.session.id).toBe("p1");
  });
});
