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
    username: process.env.GONG_USERNAME!,
  };

  const mockParams = {
    userRole: "Sales",
    trackers: ["Tracker1", "Tracker2"],
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-01-31T23:59:59.999Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("should successfully fetch transcripts", async () => {
    // Mock users response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        users: [
          { id: "user1", title: "Sales", firstName: "John", lastName: "Doe", emailAddress: process.env.GONG_USERNAME! },
          { id: "user2", title: "Sales", firstName: "Jane", lastName: "Doe", emailAddress: "fake@credal.ai" },
        ],
        cursor: null,
      },
    });

    // Mock trackers response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        keywordTrackers: [
          { trackerId: "tracker1", trackerName: "Tracker1" },
          { trackerId: "tracker2", trackerName: "Tracker2" },
        ],
        cursor: null,
      },
    });

    // Mock calls response
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        calls: [
          {
            metaData: { id: "call1", primaryUserId: "user1", started: "2024-01-02T00:00:00.000Z", isPrivate: false, title: "Sales Call"},
            parties: [{speakerId: "speaker1", name: "Joe Jonas"},
                  {speakerId: "user1", name: "John Doe"},
                  {speakerId: "user2", name: "Jane Doe"},
            ],
          },
          {
            metaData: { id: "call2", primaryUserId: "user2", started: "2024-01-03T00:00:00.000Z", isPrivate: false, title: "Product Demo"},
            parties: [
              {speakerId: "speaker1", name: "Joe Jonas"},
              {speakerId: "user1", name: "John Doe"},
              {speakerId: "user2", name: "Jane Doe"},
        ],
          }
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
              speakerId: "user1",
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
              speakerId: "user2",
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
          {
            callId: "call2",
            transcript: [{
              speakerId: "speaker1",
              topic: "Product Demo",
              sentences: [
                {
                start: 0,
                end: 10,
                text: "Sick demo",
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
    expect(result.callTranscripts).toHaveLength(3);
    expect(result.callTranscripts![0].callId).toBe("call1");
    expect(result.callTranscripts![0].callName).toBe("Sales Call");
    expect(result.callTranscripts![0].startTime).toBe("2024-01-02T00:00:00.000Z");
    expect(result.callTranscripts![0].transcript![0].speakerName).toEqual("John Doe");
    expect(result.callTranscripts![1].transcript![0].topic).toBe("Product Demo");
    expect(result.callTranscripts![2].transcript![0].speakerName).toEqual("Joe Jonas");
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
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        users: [],
        cursor: null,
      },
    });

    // Mock trackers response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        keywordTrackers: [],
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

    expect(result.success).toBe(false);
    expect(result.error).toEqual("User email not found in Gong users");
  });

  it("should handle pagination in responses", async () => {
    // Mock users response with pagination
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        users: [
          { id: "user1", title: "Sales", firstName: "John", lastName: "Doe", emailAddress: process.env.GONG_USERNAME! },
        ],
        cursor: "cursor1",
      },
    }).mockResolvedValueOnce({
      data: {
        users: [
          { id: "user2", title: "Sales", firstName: "Jane", lastName: "Doe", emailAddress: "fake@credal.ai" },
        ],
        cursor: null,
      },
    });

    // Mock trackers response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        keywordTrackers: [
          { trackerId: "tracker1", trackerName: "Tracker1" },
          { trackerId: "tracker2", trackerName: "Tracker2" },
        ],
        cursor: null,
      },
    });

    // Mock calls response with pagination
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        calls: [{
          metaData: { id: "call1", primaryUserId: "user1", started: "2024-01-04T00:00:00.000Z", isPrivate: false, title: "First Call" },
          parties: [
            { speakerId: "user1", name: "John Doe"},
          ],
        },
        ],
        cursor: "cursor2",
      },
    }).mockResolvedValueOnce({
      data: {
        calls: [
          {
            metaData: { id: "call2", primaryUserId: "user2", started: "2024-01-02T00:00:00.000Z", isPrivate: false, title: "Second Call" },
            parties: [
              {speakerId: "user2", name: "Jane Doe"},
            ],
          },
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
              speakerId: "user1",
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
              speakerId: "user2",
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
    expect(result.callTranscripts![0].callName).toBe("First Call");
    expect(result.callTranscripts![0].startTime).toBe("2024-01-04T00:00:00.000Z");
    expect(result.callTranscripts![0].transcript![0].speakerName).toBe("John Doe");
    expect(result.callTranscripts![1].callId).toBe("call2");
    expect(result.callTranscripts![1].transcript![0].speakerName).toBe("Jane Doe");
    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    expect(mockedAxios.post).toHaveBeenCalledTimes(3);
  });
}); 

describe("getGongTranscriptsWithoutUsername", () => {
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
    jest.resetAllMocks();
  });

  it("should not successfully fetch transcripts", async () => {
    const result = await getGongTranscripts({
      params: mockParams,
      authParams: mockAuthParams,
    });
    expect(result.success).toBe(false);
    expect(result.error).toEqual("Missing user email");
  });
});