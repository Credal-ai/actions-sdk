import { z } from "zod";
import axios from "axios";
import type {
  AuthParamsType,
  asanaListAsanaTasksByProjectOutputType,
  asanaListAsanaTasksByProjectParamsType,
  asanaListAsanaTasksByProjectFunction,
} from "../../autogen/types";
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
    custom_fields: z.array(
      z.object({
        gid: z.string(),
        name: z.string(),
        display_value: z.string(),
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

const NextPageSchema = z
  .object({
    offset: z.string(),
    path: z.string(),
    uri: z.string(),
  })
  .nullable();

const TaskOutputSchema = z.object({
  task: TaskDetailsSchema,
  subtasks: z.array(TaskDetailsSchema).nullable(),
  taskStories: z.array(TaskStorySchema).nullable(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AsanaOutputSchema = z.object({
  data: z.object({
    tasks: z.array(TaskOutputSchema),
    subtasks: z.array(TaskDetailsSchema).nullable(),
  }),
  next_page: NextPageSchema,
});

type TaskOutput = z.infer<typeof TaskOutputSchema>;
type TaskDetails = z.infer<typeof TaskSchema>;
type TaskStory = z.infer<typeof TaskStorySchema>;
type NextPage = z.infer<typeof NextPageSchema>;
type AsanaOutput = z.infer<typeof AsanaOutputSchema>;

async function getTaskIdsFromProject(authToken: string, projectId: string): Promise<string[]> {
  let nextPage: NextPage | undefined = undefined;
  const tasks: string[] = [];
  do {
    const response: { data: AsanaOutput } = await axios.get(
      `https://app.asana.com/api/1.0/projects/${projectId}/tasks`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params: {
          limit: 100,
          completed_since: "now",
          offset: nextPage ? nextPage.offset : undefined,
        },
      },
    );
    const parsedTasks = z.array(TaskSchema).safeParse(response.data.data);
    if (!parsedTasks.success) {
      return tasks;
    }
    tasks.push(...parsedTasks.data.map(task => task.gid).filter((gid): gid is string => gid !== undefined));
    nextPage = response.data.next_page;
  } while (nextPage);
  return tasks;
}

// Only handles the first layer of subtasks, not nested ones
async function getSubtasksFromTask(authToken: string, taskId: string): Promise<TaskDetails[]> {
  let nextPage: NextPage | undefined = undefined;
  const subtasks: TaskDetails[] = [];
  do {
    const response: { data: AsanaOutput } = await axios.get(`https://app.asana.com/api/1.0/tasks/${taskId}/subtasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        limit: 100,
        offset: nextPage ? nextPage.offset : undefined,
      },
    });
    const parsedSubtasks = z.array(TaskSchema).safeParse(response.data.data);
    if (!parsedSubtasks.success) {
      return subtasks;
    }
    subtasks.push(...parsedSubtasks.data);
    nextPage = response.data.next_page;
  } while (nextPage);
  return subtasks;
}

async function getTaskDetails(authToken: string, taskId: string): Promise<TaskDetails | null> {
  const response = await axios.get(`https://app.asana.com/api/1.0/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${authToken}` },
    params: {
      options: {
        fields: ["num_subtasks"],
      },
    },
  });
  const parsedTask = TaskDetailsSchema.safeParse(response.data.data);
  if (!parsedTask.success) {
    return null;
  }
  return parsedTask.data;
}
async function getTaskStories(authToken: string, taskId: string): Promise<TaskStory[] | null> {
  const response = await axios.get(`https://app.asana.com/api/1.0/tasks/${taskId}/stories`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const parsedTask = z.array(TaskStorySchema).safeParse(response.data.data);
  if (!parsedTask.success) {
    return null;
  }
  return parsedTask.data;
}

const listAsanaTasksByProject: asanaListAsanaTasksByProjectFunction = async ({
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
    console.error("Error listing asana tasks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default listAsanaTasksByProject;
