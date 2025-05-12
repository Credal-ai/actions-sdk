import { z } from "zod";
import type {
  AuthParamsType,
  asanaListAsanaTasksByProjectOutputType,
  asanaListAsanaTasksByProjectParamsType,
  asanaListAsanaTasksByProjectFunction
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";
import { MISSING_AUTH_TOKEN } from "../../util/missingAuthConstants";

const TaskSchema = z
  .object({
    gid: z.string(),
  })
  .partial()
  .passthrough();

const TaskDetailsSchema = z
  .object({
    name: z.string(),
    resource_type: z.string(),
    completed: z.boolean(),
    modified_at: z.string(),
    notes: z.string(),
    assignee: z.string(),
    custom_fields: z.array(
      z.object({
        gid: z.string(),
        name: z.string(),
        enum_options: z.array(
          z.object({
            gid: z.string(),
            name: z.string(),
          }),
        ),
      }),
    ),
    num_subtasks: z.number(),
  })
  .partial()
  .passthrough();

const TaskStorySchema = z
  .object({
    gid: z.string(),
    created_at: z.string(),
    text: z.string(),
    resource_type: z.string(),
    created_by: z.object({
      gid: z.string(),
      name: z.string(),
      resource_type: z.string(),
    }),
  })
  .partial()
  .passthrough();

const TaskOutputSchema = z.object({
  task: TaskDetailsSchema,
  subtasks: z.array(TaskDetailsSchema).nullable(),
  taskStories: z.array(TaskStorySchema).nullable(),
});

type TaskOutput = z.infer<typeof TaskOutputSchema>;
type TaskDetails = z.infer<typeof TaskSchema>;
type TaskStory = z.infer<typeof TaskStorySchema>;

async function getTaskIdsFromProject(authToken: string, projectId: string): Promise<string[]> {
  let cursor: string | undefined = undefined;
  const tasks: string[] = [];
  do {
    const response = await axiosClient.get(`https://app.asana.com/api/1.0/projects/${projectId}/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const parsedTasks = z.array(TaskSchema).safeParse(response.data);
    if (!parsedTasks.success) {
      return tasks;
    }
    tasks.push(...parsedTasks.data.map(task => task.gid).filter((gid): gid is string => gid !== undefined));
    cursor = response.data.cursor;
  } while (cursor);
  return tasks;
}

async function getSubtasksFromTask(authToken: string, taskId: string): Promise<TaskDetails[]> {
  let cursor: string | undefined = undefined;
  const subtasks: TaskDetails[] = [];
  do {
    const response = await axiosClient.get(`https://app.asana.com/api/1.0/tasks/${taskId}/subtasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const parsedSubtasks = z.array(TaskSchema).safeParse(response.data);
    if (!parsedSubtasks.success) {
      return subtasks;
    }
    subtasks.push(...parsedSubtasks.data);
    cursor = response.data.cursor;
  } while (cursor);
  return subtasks;
}

async function getTaskDetails(authToken: string, taskId: string): Promise<TaskDetails | null> {
  const response = await axiosClient.get(`https://app.asana.com/api/1.0/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    params: {
      options: {
        fields: ["num_subtasks"],
      },
    },
  });
  const parsedTask = TaskDetailsSchema.safeParse(response.data);
  if (!parsedTask.success) {
    return null;
  }
  return parsedTask.data;
}
async function getTaskStories(authToken: string, taskId: string): Promise<TaskStory[] | null> {
  const response = await axiosClient.get(`https://app.asana.com/api/1.0/tasks/${taskId}/stories`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const parsedTask = z.array(TaskStorySchema).safeParse(response.data);
  if (!parsedTask.success) {
    return null;
  }
  return parsedTask.data;
}

const listAsanaTaskByProject: asanaListAsanaTasksByProjectFunction = async ({
  params,
  authParams,
}: {
  params: asanaListAsanaTasksByProjectParamsType;
  authParams: AuthParamsType;
}): Promise<asanaListAsanaTasksByProjectOutputType> => {
  const { authToken } = authParams;
  const { projectId } = params;

  if (!authToken) {
    return { success: false, error: MISSING_AUTH_TOKEN };
  }
  try {
    const taskIds = await getTaskIdsFromProject(authToken, projectId);
    const tasks: TaskOutput[] = [];
    for (const taskId of taskIds) {
      const task = await getTaskDetails(authToken, taskId);
      if (!task) {
        continue;
      }
      const subtasks = await getSubtasksFromTask(authToken, taskId);
      const taskStories = await getTaskStories(authToken, taskId);

      tasks.push({
        task,
        subtasks,
        taskStories,
      });
    }

    return {
      success: true,
      tasks,
    };
  } catch (error) {
    console.error("Error creating Asana task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default listAsanaTaskByProject;
