import axios from "axios";
import {describe, expect, jest, beforeEach, it} from '@jest/globals';
import getGongTranscripts from "../../src/actions/providers/gong/getGongTranscripts";
import dotenv from "dotenv";

dotenv.config();
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("getGongTranscripts", () => {
  const mockAuthParams = {
    authToken: process.env.GONG_TOKEN!,
  };

  const mockParams = {
    userRole: "Sales",
    trackers: ["Tracker1", "Tracker2"],
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-01-31T23:59:59.999Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully fetch transcripts", async () => {
    // Mock users response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        users: [
          { id: "user1", title: "Sales", name: "John" },
          { id: "user2", title: "Sales", name: "Jane" },
        ],
        cursor: null,
      },
    });

    // Mock trackers response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        trackers: [
          { id: "tracker1", name: "Tracker1" },
          { id: "tracker2", name: "Tracker2" },
        ],
        cursor: null,
      },
    });

    // Mock calls response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        calls: [
          { id: "call1", primaryUserId: "user1", started: "2024-01-02T00:00:00.000Z" },
          { id: "call2", primaryUserId: "user2", started: "2024-01-02T00:00:00.000Z" },
        ],
        cursor: null,
      },
    });

    // Mock transcripts response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        callTranscripts: [
          {
            callId: "call1",
            transcript: [{
              speakerId: "John",
              topic: "Sales Call",
              sentences: [{
                start: 0,
                end: 10,
                text: "Hello",
              },
              {
                start: 10,
                end: 20,
                text: "How are you?",
              }],
            }],
          },
          {
            callId: "call2",
            transcript: [{
              speakerId: "Jane",
              topic: "Product Demo",
              sentences: [
                {
                start: 0,
                end: 10,
                text: "Let me show you",
              },
              {
                start: 10,
                end: 20,
                text: "This is great",
              },
            ],
            }],
          },
        ],
        cursor: null,     
      },
    });

    const result = await getGongTranscripts({
      params: mockParams,
      authParams: mockAuthParams,
    });

    expect(result.success).toBe(true);
    expect(result.callTranscripts).toBeDefined();
    expect(result.callTranscripts).toHaveLength(2);
    expect(result.callTranscripts![0].callId).toBe("call1");
    expect(result.callTranscripts![0].transcript![0].speakerName).toEqual("John");
    expect(result.callTranscripts![1].transcript![0].topic).toBe("Product Demo");
  });

  it("should handle authentication error", async () => {
    mockedAxios.get.mockRejectedValueOnce({
      response: {
        data: {
          errors: ["Invalid credentials"],
        },
      },
    });

    const result = await getGongTranscripts({
      params: mockParams,
      authParams: mockAuthParams,
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({
      response: {
        data: {
          errors: ["Invalid credentials"],
        },
      },
    });
  });

  it("should handle empty results", async () => {
    // Mock users response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        users: [],
        cursor: null,
      },
    });

    // Mock trackers response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        trackers: [],
        cursor: null,
      },
    });

    // Mock calls response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        calls: [],
        cursor: null,
      },
    });

    // Mock transcripts response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        callTranscripts: [],
        cursor: null,
      },
    });

    const result = await getGongTranscripts({
      params: mockParams,
      authParams: mockAuthParams,
    });

    expect(result.success).toBe(true);
    expect(result.callTranscripts).toHaveLength(0);
  });

  it("should handle pagination in responses", async () => {
    // Mock users response with pagination
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        users: [
          { id: "user1", title: "Sales", name: "John" },
        ],
        cursor: "cursor1",
      },
    }).mockResolvedValueOnce({
      data: {
        users: [
          { id: "user2", title: "Sales", name: "Jane" },
        ],
        cursor: null,
      },
    });

    // Mock trackers response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        trackers: [
          { id: "tracker1", name: "Tracker1" },
          { id: "tracker2", name: "Tracker2" },
        ],
        cursor: null,
      },
    });

    // Mock calls response with pagination
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        calls: [
          { id: "call1", primaryUserId: "user1", started: "2024-01-02T00:00:00.000Z" },
        ],
        cursor: "cursor2",
      },
    }).mockResolvedValueOnce({
      data: {
        calls: [
          { id: "call2", primaryUserId: "user2", started: "2024-01-02T00:00:00.000Z" },
        ],
        cursor: null,
      },
    });

    // Mock transcripts response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        callTranscripts: [
          {
            callId: "call1",
            transcript: [{
              speakerId: "John",
              topic: "First Call",
              sentences: [{
                start: 0,
                end: 10,
                text: "Hello",
              }],
            }],
          },
          {
            callId: "call2",
            transcript: [{
              speakerId: "Jane",
              topic: "Second Call",
              sentences: [{
                start: 10,
                end: 20,
                text: "Hi",
              }],
            }],
          },
        ],
        cursor: null,
      },
    });

    const result = await getGongTranscripts({
      params: mockParams,
      authParams: mockAuthParams,
    });

    expect(result.success).toBe(true);
    expect(result.callTranscripts).toHaveLength(2);
    expect(result.callTranscripts![0].callId).toBe("call1");
    expect(result.callTranscripts![0].transcript![0].speakerName).toBe("John");
    expect(result.callTranscripts![1].callId).toBe("call2");
    expect(result.callTranscripts![1].transcript![0].speakerName).toBe("Jane");
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledTimes(5);
  });
}); 