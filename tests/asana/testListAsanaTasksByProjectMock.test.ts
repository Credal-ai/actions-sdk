import axios from "axios";
import { describe, expect, jest, beforeEach, it } from "@jest/globals";
import listAsanaTasksByProject from "../../src/actions/providers/asana/listAsanaTasksByProject";
import dotenv from "dotenv";

dotenv.config();
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("listAsanaTasksByProject", () => {
  const mockAuthParams = {
    authToken: process.env.ASANA_TOKEN || "mock-token",
  };

  const mockParams = {
    projectId: "123456789",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("should successfully list tasks from a project", async () => {
    // Mock project tasks response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [{ gid: "task1" }, { gid: "task2" }],
        next_page: null,
      },
    });

    // Mock task1 details
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          gid: "task1",
          name: "First Task",
          resource_type: "task",
          completed: false,
          modified_at: "2023-01-01T00:00:00.000Z",
          notes: "Task notes",
          custom_fields: [
            {
              gid: "custom_field_1",
              name: "Custom Field 1",
              display_value: "Custom Value 1",
            },
          ],
          num_subtasks: 1,
        },
      },
    });

    // Mock task1 subtasks
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [{ gid: "subtask1" }],
        next_page: null,
      },
    });

    // Mock task1 stories
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            gid: "story1",
            created_at: "2023-01-02T00:00:00.000Z",
            text: "Comment on task",
            resource_type: "story",
            created_by: {
              gid: "user1",
              name: "John Doe",
              resource_type: "user",
            },
          },
        ],
        next_page: null,
      },
    });

    // Mock task2 details
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          gid: "task2",
          name: "Second Task",
          resource_type: "task",
          completed: true,
          modified_at: "2023-01-03T00:00:00.000Z",
          notes: "Another task",
          custom_fields: [
            {
              gid: "custom_field_2",
              name: "Custom Field 2",
              display_value: "Custom Value 2",
            },
          ],
          num_subtasks: 0,
        },
      },
    });

    // Mock task2 subtasks (empty)
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [],
        next_page: null,
      },
    });

    // Mock task2 stories (empty)
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [],
        next_page: null,
      },
    });

    const result = await listAsanaTasksByProject({
      params: mockParams,
      authParams: mockAuthParams,
    });

    expect(result.success).toBe(true);
    expect(result.tasks).toBeDefined();
    expect(result.tasks).toHaveLength(2);

    // Verify first task
    expect(result.tasks![0].task.name).toBe("First Task");
    expect(result.tasks![0].task.completed).toBe(false);
    expect(result.tasks![0].subtasks).toHaveLength(1);
    expect(result.tasks![0].taskStories).toHaveLength(1);
    expect(result.tasks![0].taskStories![0].text).toBe("Comment on task");

    // Verify second task
    expect(result.tasks![1].task.name).toBe("Second Task");
    expect(result.tasks![1].task.completed).toBe(true);
    expect(result.tasks![1].subtasks).toHaveLength(0);
    expect(result.tasks![1].taskStories).toHaveLength(0);
  });

  it("should handle authentication error", async () => {
    const authParams = {
      authToken: "",
    };

    const result = await listAsanaTasksByProject({
      params: mockParams,
      authParams,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should handle API errors", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("API error"));

    const result = await listAsanaTasksByProject({
      params: mockParams,
      authParams: mockAuthParams,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("API error");
  });

  it("should handle empty results", async () => {
    // Mock empty project tasks response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [],
        next_page: null,
      },
    });

    const result = await listAsanaTasksByProject({
      params: mockParams,
      authParams: mockAuthParams,
    });

    expect(result.success).toBe(true);
    expect(result.tasks).toHaveLength(0);
  });

  it("should handle pagination in project tasks", async () => {
    // First page of project tasks
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          data: [{ gid: "task1" }],
          next_page: "next-page",
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [{ gid: "task2" }],
          next_page: null,
        },
      });

    // Mock task1 details
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          gid: "task1",
          name: "First Task",
          resource_type: "task",
          completed: false,
          num_subtasks: 0,
        },
      },
    });

    // Mock task1 subtasks (empty)
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [],
        next_page: null,
      },
    });

    // Mock task1 stories (empty)
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [],
        next_page: null,
      },
    });

    // Mock task2 details
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          gid: "task2",
          name: "Second Task",
          resource_type: "task",
          completed: true,
          num_subtasks: 0,
        },
      },
    });

    // Mock task2 subtasks (empty)
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [],
        next_page: null,
      },
    });

    // Mock task2 stories (empty)
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [],
        next_page: null,
      },
    });

    const result = await listAsanaTasksByProject({
      params: mockParams,
      authParams: mockAuthParams,
    });

    expect(result.success).toBe(true);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks![0].task.name).toBe("First Task");
    expect(result.tasks![1].task.name).toBe("Second Task");
    expect(mockedAxios.get).toHaveBeenCalledTimes(8); // 2 for pagination + 3 per task
  });
});
