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
      }
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
        it => it.name.toLowerCase() === targetIssueType.toLowerCase() || it.id === targetIssueType
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

    // Debug logging
    console.log("=== JIRA MOVE DEBUG ===");
    console.log("API URL:", `${apiUrl}/bulk/issues/move`);
    console.log("Current Issue Key:", currentIssueKey);
    console.log("Current Project:", currentProjectKey);
    console.log("Current Issue Type:", currentIssueTypeName);
    console.log("Target Project:", targetProjectKey);
    console.log("Target Issue Type:", issueTypeToUse.name, "(id:", issueTypeToUse.id + ")");
    console.log("Mapping Key:", mappingKey);
    console.log("Payload:", JSON.stringify(movePayload, null, 2));
    console.log("=======================");

    try {
      const response = await axiosClient.post(
        `${apiUrl}/bulk/issues/move`,
        movePayload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Move response:", JSON.stringify(response.data, null, 2));
    } catch (moveError: unknown) {
      console.log("Move error:", moveError);
      // Log full error details
      if (moveError && typeof moveError === "object") {
        const err = moveError as { status?: number; data?: unknown; message?: string };
        console.log("Error status:", err.status);
        console.log("Error data:", JSON.stringify(err.data, null, 2));
        console.log("Error message:", err.message);
      }
      const availableTypes = targetIssueTypes.map(t => `${t.name} (id: ${t.id})`).join(", ");
      return {
        success: false,
        error: `${getErrorMessage(moveError)}. Attempted issue type: ${issueTypeToUse.name} (id: ${issueTypeToUse.id}). Available in ${targetProjectKey}: ${availableTypes}`,
      };
    }

    // Wait for Jira to process, then verify
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify the move
    const updatedIssueResponse = await axiosClient.get<IssueDetailsResponse>(
      `${apiUrl}/issue/${currentIssueKey}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
        },
      }
    );

    const newKey = updatedIssueResponse.data.key;
    const newProjectKey = updatedIssueResponse.data.fields.project.key;

    if (newProjectKey !== targetProjectKey) {
      return {
        success: false,
        error: `Move was initiated but ticket is still in project ${newProjectKey}. This may be a Jira configuration issue or the move is processing asynchronously.`,
      };
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
