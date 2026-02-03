import type {
  AuthParamsType,
  jiraMoveJiraTicketToProjectFunction,
  jiraMoveJiraTicketToProjectOutputType,
  jiraMoveJiraTicketToProjectParamsType,
} from "../../autogen/types.js";
import { axiosClient } from "../../util/axiosClient.js";
import { getJiraApiConfig, getErrorMessage } from "./utils.js";

interface IssueType {
  id: string;
  name: string;
}

interface CreateMetaIssueTypesResponse {
  issueTypes: IssueType[];
}

interface IssueDetailsResponse {
  id: string;
  key: string;
  fields: {
    issuetype: {
      id: string;
      name: string;
    };
    project: {
      key: string;
    };
  };
}

interface BulkMoveResponse {
  taskId: string;
}

interface TaskStatusResponse {
  id: string;
  status: "ENQUEUED" | "RUNNING" | "COMPLETE" | "FAILED" | "CANCEL_REQUESTED" | "CANCELLED" | "DEAD";
  progress: number;
  result?: string;
  message?: string;
}

// Polling configuration
const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 30; // 30 seconds max wait

const moveJiraTicketToProject: jiraMoveJiraTicketToProjectFunction = async ({
  params,
  authParams,
}: {
  params: jiraMoveJiraTicketToProjectParamsType;
  authParams: AuthParamsType;
}): Promise<jiraMoveJiraTicketToProjectOutputType> => {
  const { authToken } = authParams;
  const { issueId, targetProjectKey, targetIssueType } = params;
  const { apiUrl, browseUrl } = getJiraApiConfig(authParams);

  if (!authToken) {
    throw new Error("Auth token is required");
  }

  try {
    // First, get the current issue details
    const issueResponse = await axiosClient.get<IssueDetailsResponse>(`${apiUrl}/issue/${issueId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
    });

    const issueInternalId = issueResponse.data.id;
    const currentIssueKey = issueResponse.data.key;
    const currentIssueTypeName = issueResponse.data.fields.issuetype.name;
    const currentProjectKey = issueResponse.data.fields.project.key;

    // Check if already in target project
    if (currentProjectKey === targetProjectKey) {
      return {
        success: true,
        newTicketKey: currentIssueKey,
        ticketUrl: `${browseUrl}/browse/${currentIssueKey}`,
      };
    }

    // Get the target project's available issue types
    const issueTypesResponse = await axiosClient.get<CreateMetaIssueTypesResponse>(
      `${apiUrl}/issue/createmeta/${targetProjectKey}/issuetypes`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      },
    );

    const targetIssueTypes = issueTypesResponse.data.issueTypes;
    if (!targetIssueTypes || targetIssueTypes.length === 0) {
      return {
        success: false,
        error: `No issue types available in project ${targetProjectKey} or you don't have permission to access it`,
      };
    }

    // Determine which issue type to use
    let issueTypeToUse: IssueType | undefined;

    if (targetIssueType) {
      issueTypeToUse = targetIssueTypes.find(
        it => it.name.toLowerCase() === targetIssueType.toLowerCase() || it.id === targetIssueType,
      );
      if (!issueTypeToUse) {
        return {
          success: false,
          error: `Issue type "${targetIssueType}" not found in project ${targetProjectKey}. Available types: ${targetIssueTypes.map(t => t.name).join(", ")}`,
        };
      }
    } else {
      issueTypeToUse = targetIssueTypes.find(it => it.name.toLowerCase() === currentIssueTypeName.toLowerCase());
      if (!issueTypeToUse) {
        issueTypeToUse = targetIssueTypes[0];
        if (!issueTypeToUse) {
          return {
            success: false,
            error: `No issue types available in project ${targetProjectKey}`,
          };
        }
      }
    }

    // Build payload per official Atlassian docs:
    // The key in targetToSourcesMapping is "PROJECT_KEY,ISSUE_TYPE_ID"
    const mappingKey = `${targetProjectKey},${issueTypeToUse.id}`;

    const movePayload = {
      sendBulkNotification: true,
      targetToSourcesMapping: {
        [mappingKey]: {
          issueIdsOrKeys: [currentIssueKey],
          inferClassificationDefaults: true,
          inferFieldDefaults: true,
          inferStatusDefaults: true,
          inferSubtaskTypeDefault: true,
        },
      },
    };

    let taskId: string;
    try {
      const response = await axiosClient.post<BulkMoveResponse>(`${apiUrl}/bulk/issues/move`, movePayload, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      taskId = response.data.taskId;
    } catch (moveError: unknown) {
      const availableTypes = targetIssueTypes.map(t => `${t.name} (id: ${t.id})`).join(", ");
      return {
        success: false,
        error: `${getErrorMessage(moveError)}. Attempted issue type: ${issueTypeToUse.name} (id: ${issueTypeToUse.id}). Available in ${targetProjectKey}: ${availableTypes}`,
      };
    }

    // Poll the task until it completes
    let taskStatus: TaskStatusResponse | undefined;
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

      try {
        const taskResponse = await axiosClient.get<TaskStatusResponse>(`${apiUrl}/task/${taskId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
          },
        });
        taskStatus = taskResponse.data;

        if (taskStatus.status === "COMPLETE") {
          break;
        } else if (
          taskStatus.status === "FAILED" ||
          taskStatus.status === "CANCELLED" ||
          taskStatus.status === "DEAD"
        ) {
          return {
            success: false,
            error: `Move task failed with status: ${taskStatus.status}`,
          };
        }
      } catch {
        // Continue polling on transient errors
      }
    }

    if (!taskStatus || taskStatus.status !== "COMPLETE") {
      return {
        success: false,
        error: `Move task did not complete within ${MAX_POLL_ATTEMPTS} seconds. Last status: ${taskStatus?.status ?? "unknown"}`,
      };
    }

    // Fetch the updated issue to get the new key (use immutable id since key changes on project move)
    let newKey = currentIssueKey;
    try {
      const updatedIssueResponse = await axiosClient.get<IssueDetailsResponse>(`${apiUrl}/issue/${issueInternalId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      });
      newKey = updatedIssueResponse.data.key;
    } catch {
      // Continue with original key
    }

    return {
      success: true,
      newTicketKey: newKey,
      ticketUrl: `${browseUrl}/browse/${newKey}`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export default moveJiraTicketToProject;
