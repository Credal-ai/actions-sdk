import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import deepResearch from "../../src/actions/providers/firecrawl/deepResearch";

/* eslint-disable @typescript-eslint/no-explicit-any */
const mockPost = jest.fn<(...args: any[]) => Promise<any>>();
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();
const mockDelete = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("../../src/actions/util/axiosClient", () => ({
  axiosClient: {
    post: (...args: any[]) => mockPost(...args),
    get: (...args: any[]) => mockGet(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

const authParams = { apiKey: "fc-test" };
const headers = { headers: { Authorization: "Bearer fc-test" } };

describe("firecrawl deepResearch", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockPost.mockReset();
    mockGet.mockReset();
    mockDelete.mockReset();
    mockPost.mockResolvedValue({ status: 200, data: { success: true, id: "job-1" } });
    mockDelete.mockResolvedValue({ data: { success: true } });
  });

  it("starts an agent run and returns its report and sources", async () => {
    const sources = [{ url: "https://example.com/cereal", title: "Cereal history" }];
    mockGet
      .mockResolvedValueOnce({ data: { success: true, status: "processing" } })
      .mockResolvedValueOnce({ data: { success: true, status: "completed", data: { report: "# Cereal", sources } } });

    const result = await deepResearch({
      params: { query: "research cereal", maxCredits: 100 },
      authParams,
    });

    expect(result).toEqual({ finalAnalysis: "# Cereal", sources });
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      "https://api.firecrawl.dev/v2/agent",
      {
        prompt: "research cereal",
        schema: {
          type: "object",
          properties: {
            report: { type: "string", description: "A markdown report that answers the question" },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: { url: { type: "string" }, title: { type: "string" } },
                required: ["url", "title"],
              },
            },
          },
          required: ["report", "sources"],
        },
        maxCredits: 100,
      },
      headers,
    );
    expect(mockGet).toHaveBeenCalledWith("https://api.firecrawl.dev/v2/agent/job-1", headers);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("throws the agent error when the run fails", async () => {
    mockGet.mockResolvedValueOnce({ data: { success: true, status: "failed", error: "Agent reached max credits" } });

    await expect(deepResearch({ params: { query: "research cereal" }, authParams })).rejects.toThrow(
      "Deep research failed. Reason: Agent reached max credits",
    );
  });

  it("cancels the run when the time limit runs out", async () => {
    jest.spyOn(Date, "now").mockReturnValueOnce(0).mockReturnValue(Number.MAX_SAFE_INTEGER);
    mockGet.mockResolvedValue({ data: { success: true, status: "processing" } });

    await expect(deepResearch({ params: { query: "research cereal", timeLimit: 30 }, authParams })).rejects.toThrow(
      "Deep research polling timed out.",
    );
    expect(mockDelete).toHaveBeenCalledWith("https://api.firecrawl.dev/v2/agent/job-1", headers);
  });
});
