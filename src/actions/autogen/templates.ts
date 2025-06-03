import { ActionTemplate } from "../../actions/parse";

export const genericFillTemplateDefinition: ActionTemplate = {
  description: "Simple utility that takes a template and returns it filled in",
  scopes: [],
  parameters: {
    type: "object",
    required: ["template"],
    properties: {
      template: {
        type: "string",
        description: "The template string to be processed and returned",
      },
    },
  },
  output: {
    type: "object",
    required: ["result"],
    properties: {
      result: {
        type: "string",
        description: "The template string returned filled in",
      },
    },
  },
  name: "fillTemplate",
  provider: "generic",
};
export const asanaCommentTaskDefinition: ActionTemplate = {
  description: "Comments on an Asana task with specified content",
  scopes: [],
  parameters: {
    type: "object",
    required: ["taskId", "commentText"],
    properties: {
      taskId: {
        type: "string",
        description: "Task gid the comment should be added to",
      },
      commentText: {
        type: "string",
        description: "The comment text to be added",
      },
      isPinned: {
        type: "boolean",
        description: "Whether the comment should be pinned",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      error: {
        type: "string",
        description: "Error if comment was unsuccessful",
      },
      success: {
        type: "boolean",
        description: "Whether comment was successfully made",
      },
      commentUrl: {
        type: "string",
        description: "The url to the created comment",
      },
    },
  },
  name: "commentTask",
  provider: "asana",
};
export const asanaListAsanaTasksByProjectDefinition: ActionTemplate = {
  description: "List all tasks associated with an Asana project and their data",
  scopes: [],
  parameters: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "Project gid the tasks belong to",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      error: {
        type: "string",
        description: "Error if task retrieval was unsuccessful",
      },
      success: {
        type: "boolean",
        description: "Whether task retrieval was successful",
      },
      tasks: {
        type: "array",
        description: "The list of tasks in the project",
        items: {
          type: "object",
          description: "A task in the project",
          required: ["task"],
          properties: {
            task: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                resource_type: {
                  type: "string",
                },
                completed: {
                  type: "boolean",
                },
                modified_at: {
                  type: "string",
                },
                notes: {
                  type: "string",
                },
                custom_fields: {
                  type: "array",
                  nullable: true,
                  items: {
                    type: "object",
                    properties: {
                      gid: {
                        type: "string",
                      },
                      name: {
                        type: "string",
                      },
                      display_value: {
                        type: "string",
                        nullable: true,
                      },
                    },
                  },
                },
                num_subtasks: {
                  type: "number",
                },
              },
            },
            subtasks: {
              type: "array",
              nullable: true,
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                  },
                  resource_type: {
                    type: "string",
                  },
                  completed: {
                    type: "boolean",
                  },
                  modified_at: {
                    type: "string",
                  },
                  notes: {
                    type: "string",
                  },
                  assignee: {
                    type: "string",
                  },
                  custom_fields: {
                    type: "array",
                    nullable: true,
                    items: {
                      type: "object",
                      properties: {
                        gid: {
                          type: "string",
                        },
                        name: {
                          type: "string",
                        },
                        display_value: {
                          type: "string",
                          nullable: true,
                        },
                      },
                    },
                  },
                  num_subtasks: {
                    type: "number",
                  },
                },
              },
            },
            taskStories: {
              type: "array",
              nullable: true,
              items: {
                type: "object",
                properties: {
                  gid: {
                    type: "string",
                  },
                  created_at: {
                    type: "string",
                  },
                  text: {
                    type: "string",
                  },
                  resource_type: {
                    type: "string",
                  },
                  created_by: {
                    type: "object",
                    properties: {
                      gid: {
                        type: "string",
                      },
                      name: {
                        type: "string",
                      },
                      resource_type: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  name: "listAsanaTasksByProject",
  provider: "asana",
};
export const asanaCreateTaskDefinition: ActionTemplate = {
  description: "Create an Asana task with specified content using optional template",
  scopes: [],
  parameters: {
    type: "object",
    required: ["name", "projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "Project gid the task belongs to",
      },
      name: {
        type: "string",
        description: "The name of the new task",
      },
      approvalStatus: {
        type: "string",
        description: "Status of task (pending, approved, ...)",
      },
      description: {
        type: "string",
        description: "The description for the new task",
      },
      dueAt: {
        type: "string",
        description: "ISO 8601 date string in UTC for due date of task",
      },
      assignee: {
        type: "string",
        description: "The assignee gid or email for the new task",
      },
      taskTemplate: {
        type: "string",
        description: "The template to use, takes id or name",
      },
      customFields: {
        type: "object",
        description: "Custom fields to be set on the create task request",
        additionalProperties: true,
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      error: {
        type: "string",
        description: "Error if task creation was unsuccessful",
      },
      success: {
        type: "boolean",
        description: "Whether task creation was successful",
      },
      taskUrl: {
        type: "string",
        description: "The url to the created Asana task",
      },
    },
  },
  name: "createTask",
  provider: "asana",
};
export const asanaUpdateTaskDefinition: ActionTemplate = {
  description: "Updates a Asana task with specified content",
  scopes: [],
  parameters: {
    type: "object",
    required: ["taskId"],
    properties: {
      taskId: {
        type: "string",
        description: "Task gid of the task to update",
      },
      name: {
        type: "string",
        description: "The name of the task",
      },
      approvalStatus: {
        type: "string",
        description: "Status of task (pending, approved, ...)",
      },
      description: {
        type: "string",
        description: "The updated description",
      },
      dueAt: {
        type: "string",
        description: "ISO 8601 date string in UTC for due date of task",
      },
      assignee: {
        type: "string",
        description: "The assignee gid or email for the task",
      },
      completed: {
        type: "boolean",
        description: "Whether the task should be marked as completed",
      },
      customFields: {
        type: "object",
        description: "Custom fields to be updated",
        additionalProperties: true,
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      error: {
        type: "string",
        description: "Error if task update was unsuccessful",
      },
      success: {
        type: "boolean",
        description: "Whether task update was successful",
      },
      taskUrl: {
        type: "string",
        description: "The url to the updated Asana task",
      },
    },
  },
  name: "updateTask",
  provider: "asana",
};
export const asanaSearchTasksDefinition: ActionTemplate = {
  description: "List all tasks associated with search query",
  scopes: [],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "Search query",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      error: {
        type: "string",
        description: "Error if search was unsuccessful",
      },
      success: {
        type: "boolean",
        description: "Whether search was successful",
      },
      results: {
        type: "array",
        description: "The list of tasks that match search query",
        items: {
          type: "object",
          description: "List of tasks that match search query",
          required: ["id", "name", "workspaceId"],
          properties: {
            id: {
              type: "string",
            },
            name: {
              type: "string",
            },
            resourceType: {
              type: "string",
            },
            workspaceId: {
              type: "string",
            },
          },
        },
      },
    },
  },
  name: "searchTasks",
  provider: "asana",
};
export const asanaGetTasksDetailsDefinition: ActionTemplate = {
  description: "Retrieve detailed information (assignee, comments, description, title, etc.) for a list of task IDs",
  scopes: [],
  parameters: {
    type: "object",
    required: ["taskIds"],
    properties: {
      taskIds: {
        type: "array",
        description: "The list of task ids to get details for",
        items: {
          type: "string",
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      errors: {
        type: "array",
        description: "Errors if search was unsuccessful",
        items: {
          type: "string",
        },
      },
      success: {
        type: "boolean",
        description: "Whether search was successful",
      },
      results: {
        type: "array",
        description: "The list of tasks that match search query",
        items: {
          type: "object",
          description: "List of tasks that match search query",
          required: ["id", "name", "approval_status", "completed", "created_at", "assignee_name", "notes", "comments"],
          properties: {
            id: {
              type: "string",
            },
            name: {
              type: "string",
            },
            approval_status: {
              type: "string",
            },
            completed: {
              type: "boolean",
            },
            created_at: {
              type: "string",
            },
            due_at: {
              type: "string",
              nullable: true,
            },
            assignee_name: {
              type: "string",
            },
            notes: {
              type: "string",
            },
            comments: {
              type: "array",
              items: {
                type: "object",
                required: ["text", "created_at", "creator_name"],
                properties: {
                  text: {
                    type: "string",
                  },
                  created_at: {
                    type: "string",
                  },
                  creator_name: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  name: "getTasksDetails",
  provider: "asana",
};
export const slackSendMessageDefinition: ActionTemplate = {
  description: "Sends a message to a Slack channel",
  scopes: ["chat:write"],
  parameters: {
    type: "object",
    required: ["channelName", "message"],
    properties: {
      channelName: {
        type: "string",
        description: "The name of the Slack channel to send the message to (e.g. general, alerts)",
      },
      message: {
        type: "string",
        description: "The message content to send to Slack. Can include markdown formatting.",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the email was sent successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the email was not sent successfully",
      },
    },
  },
  name: "sendMessage",
  provider: "slack",
};
export const slackGetChannelMessagesDefinition: ActionTemplate = {
  description: "Gets messages from a Slack channel",
  scopes: ["channels:history"],
  parameters: {
    type: "object",
    required: ["channelName", "oldest"],
    properties: {
      channelName: {
        type: "string",
        description: "Name of the channel to summarize",
      },
      oldest: {
        type: "string",
        description: "Only messages after this Unix timestamp will be included in results",
      },
    },
  },
  output: {
    type: "object",
    required: ["messages"],
    properties: {
      messages: {
        type: "array",
        description: "The messages in the channel",
        items: {
          type: "object",
          description: "A message in the channel",
          required: ["user", "text", "ts"],
          properties: {
            user: {
              type: "string",
              description: "The user who sent the message",
            },
            text: {
              type: "string",
              description: "The text of the message",
            },
            ts: {
              type: "string",
              description: "The timestamp of the message",
            },
          },
        },
      },
    },
  },
  name: "getChannelMessages",
  provider: "slack",
};
export const mathAddDefinition: ActionTemplate = {
  description: "Adds two numbers together",
  scopes: [],
  parameters: {
    type: "object",
    required: ["a", "b"],
    properties: {
      a: {
        type: "number",
        description: "The first number to add",
      },
      b: {
        type: "number",
        description: "The second number to add",
      },
    },
  },
  output: {
    type: "object",
    required: ["result"],
    properties: {
      result: {
        type: "number",
        description: "The sum of the two numbers",
      },
    },
  },
  name: "add",
  provider: "math",
};
export const confluenceOverwritePageDefinition: ActionTemplate = {
  description: "Updates a Confluence page with the new content specified",
  scopes: [],
  parameters: {
    type: "object",
    required: ["pageId", "title", "content"],
    properties: {
      pageId: {
        type: "string",
        description: "The page id for the page to add content to",
      },
      title: {
        type: "string",
        description: "The title of the page that should be updated",
      },
      content: {
        type: "string",
        description: "The new content for the page",
      },
    },
  },
  name: "overwritePage",
  provider: "confluence",
};
export const confluenceFetchPageContentDefinition: ActionTemplate = {
  description: "Fetches content from a Confluence page",
  scopes: [],
  parameters: {
    type: "object",
    required: ["pageId"],
    properties: {
      pageId: {
        type: "string",
        description: "The ID of the page to fetch content from",
      },
    },
  },
  output: {
    type: "object",
    required: ["pageId", "title", "content"],
    properties: {
      pageId: {
        type: "string",
        description: "The ID of the page",
      },
      title: {
        type: "string",
        description: "The title of the page",
      },
      content: {
        type: "string",
        description: "The content of the page in storage format (HTML)",
      },
    },
  },
  name: "fetchPageContent",
  provider: "confluence",
};
export const jiraAssignJiraTicketDefinition: ActionTemplate = {
  description: "Assigns/Re-assignes a Jira ticket to a specified user",
  scopes: ["write:jira-work", "read:jira-user"],
  parameters: {
    type: "object",
    required: ["projectKey", "issueId", "assignee"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project you want to add it to",
      },
      assignee: {
        type: "string",
        description: "The assignee for the ticket, userID or email",
      },
      issueId: {
        type: "string",
        description: "The issue ID associated with the ticket to be assigned/re-assigned",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the ticket was successfully assigned/reassigned",
      },
      error: {
        type: "string",
        description: "The error that occurred if the ticket was not successfully assigned/reassigned",
      },
      ticketUrl: {
        type: "string",
        description: "The url to the newly assigned/reassigned Jira ticket",
      },
    },
  },
  name: "assignJiraTicket",
  provider: "jira",
};
export const jiraCommentJiraTicketDefinition: ActionTemplate = {
  description: "Comments on a Jira ticket with specified content",
  scopes: ["write:comment:jira"],
  parameters: {
    type: "object",
    required: ["projectKey", "issueId", "comment"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project",
      },
      issueId: {
        type: "string",
        description: "The issue ID associated with the ticket to be commented on",
      },
      comment: {
        type: "string",
        description: "The text to be commented on the ticket",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the comment was sent successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the comment was not sent successfully",
      },
      commentUrl: {
        type: "string",
        description: "The url to the created Jira comment",
      },
    },
  },
  name: "commentJiraTicket",
  provider: "jira",
};
export const jiraCreateJiraTicketDefinition: ActionTemplate = {
  description: "Create a jira ticket with new content specified",
  scopes: [],
  parameters: {
    type: "object",
    required: ["projectKey", "summary", "description", "issueType"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project you want to add it to",
      },
      summary: {
        type: "string",
        description: "The summary of the new ticket",
      },
      description: {
        type: "string",
        description: "The description for the new ticket",
      },
      issueType: {
        type: "string",
        description: "The issue type of the new ticket",
      },
      reporter: {
        type: "string",
        description: "The reporter for the new ticket creation",
      },
      assignee: {
        type: "string",
        description: "The assignee for the new ticket creation",
      },
      customFields: {
        type: "object",
        description: "Custom fields to be set on the create ticket request",
        additionalProperties: true,
      },
    },
  },
  output: {
    type: "object",
    required: ["ticketUrl"],
    properties: {
      ticketUrl: {
        type: "string",
        description: "The url to the created Jira Ticket",
      },
    },
  },
  name: "createJiraTicket",
  provider: "jira",
};
export const jiraGetJiraTicketDetailsDefinition: ActionTemplate = {
  description: "Get details of a ticket in Jira",
  scopes: ["read:jira-work"],
  parameters: {
    type: "object",
    required: ["projectKey", "issueId"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project",
      },
      issueId: {
        type: "string",
        description: "The ID of the ticket",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the status was updated successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the retrieval was unsuccessful",
      },
      data: {
        type: "object",
        description: "The data of the Jira ticket",
      },
    },
  },
  name: "getJiraTicketDetails",
  provider: "jira",
};
export const jiraGetJiraTicketHistoryDefinition: ActionTemplate = {
  description: "Get ticket history of a ticket in Jira",
  scopes: ["read:jira-work"],
  parameters: {
    type: "object",
    required: ["projectKey", "issueId"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project",
      },
      issueId: {
        type: "string",
        description: "The ID of the ticket",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the status was updated successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the retrieval was unsuccessful",
      },
      history: {
        type: "array",
        description: "The history data of the Jira ticket",
      },
    },
  },
  name: "getJiraTicketHistory",
  provider: "jira",
};
export const jiraUpdateJiraTicketDetailsDefinition: ActionTemplate = {
  description: "Update a Jira ticket with new content specified",
  scopes: ["write:jira-work"],
  parameters: {
    type: "object",
    required: ["projectKey", "issueId"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project you want to add it to",
      },
      issueId: {
        type: "string",
        description: "The issue ID associated with the ticket to be updated",
      },
      summary: {
        type: "string",
        description: "The updated summary",
      },
      description: {
        type: "string",
        description: "The updated description",
      },
      issueType: {
        type: "string",
        description: "The updated issue type",
      },
      customFields: {
        type: "object",
        description: "Custom fields to be set on the update ticket request",
        additionalProperties: true,
      },
    },
  },
  output: {
    type: "object",
    required: ["ticketUrl"],
    properties: {
      ticketUrl: {
        type: "string",
        description: "The url to the Jira ticket",
      },
    },
  },
  name: "updateJiraTicketDetails",
  provider: "jira",
};
export const jiraUpdateJiraTicketStatusDefinition: ActionTemplate = {
  description: "Updates the status of Jira ticket with specified status",
  scopes: ["read:jira-work", "write:jira-work"],
  parameters: {
    type: "object",
    required: ["projectKey", "issueId", "status"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project you want to add it to",
      },
      issueId: {
        type: "string",
        description: "The issue ID associated with the ticket",
      },
      status: {
        type: "string",
        description: 'The status the ticket should be changed to (eg "In Progress", "Closed")',
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the status was updated successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the status was not updated successfully",
      },
      ticketUrl: {
        type: "string",
        description: "The url to the Jira ticket",
      },
    },
  },
  name: "updateJiraTicketStatus",
  provider: "jira",
};
export const jiraGetJiraIssuesByQueryDefinition: ActionTemplate = {
  description: "Retrieve Jira Issues by JQL query",
  scopes: [],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "The JQL query to execute",
      },
      limit: {
        type: "number",
        description: "The maximum number of records to retrieve",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the records were successfully retrieved",
      },
      records: {
        type: "array",
        description: "The retrieved records",
        items: {
          type: "object",
          description: "An issue from Jira",
          additionalProperties: {
            type: "string",
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the records were not successfully retrieved",
      },
    },
  },
  name: "getJiraIssuesByQuery",
  provider: "jira",
};
export const kandjiGetFVRecoveryKeyForDeviceDefinition: ActionTemplate = {
  description: "Get the FileVault recovery key for a device",
  scopes: [],
  parameters: {
    type: "object",
    required: ["userEmail", "subdomain"],
    properties: {
      userEmail: {
        type: "string",
        description: "The email of the user requesting the recovery key",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Kandji account",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the recovery key was retrieved successfully",
      },
      recoveryKey: {
        type: "string",
        description: "The FileVault recovery key for the device",
      },
      error: {
        type: "string",
        description: "The error that occurred if the recovery key was not retrieved successfully",
      },
    },
  },
  name: "getFVRecoveryKeyForDevice",
  provider: "kandji",
};
export const googlemapsValidateAddressDefinition: ActionTemplate = {
  description: "Validate a Google Maps address",
  scopes: [],
  parameters: {
    type: "object",
    required: ["regionCode", "locality", "addressLines", "postalCode"],
    properties: {
      regionCode: {
        type: "string",
        description: "The country of the address being verified.",
      },
      locality: {
        type: "string",
        description: "The locality of the address being verified. This is likely a city.",
      },
      postalCode: {
        type: "string",
        description: "The postal code of the address being verified.",
      },
      addressLines: {
        type: "array",
        description: "A list of lines of the address. These should be in order as they would appear on an envelope.",
        items: {
          type: "string",
        },
      },
      addressType: {
        type: "string",
        description: "The type of address being validated.",
        enum: ["residential", "business", "poBox"],
      },
      allowFuzzyMatches: {
        type: "boolean",
        description: "Whether to allow fuzzy matches in the address validation by inferring components.",
      },
    },
  },
  output: {
    type: "object",
    required: ["valid"],
    properties: {
      valid: {
        type: "boolean",
        description: "Whether the address is valid.",
      },
      formattedAddress: {
        type: "string",
        description: "The standardized formatted address.",
      },
      addressComponents: {
        type: "array",
        description: "Components of the address, such as street number and route.",
        items: {
          type: "object",
          properties: {
            componentName: {
              type: "string",
              description: "The name of the address component.",
            },
            componentType: {
              type: "array",
              description: "The types associated with this component (e.g., street_number, route).",
              items: {
                type: "string",
              },
            },
          },
        },
      },
      missingComponentTypes: {
        type: "array",
        description: "List of components missing in the input address.",
        items: {
          type: "string",
        },
      },
      unresolvedTokens: {
        type: "array",
        description: "Unrecognized parts of the address.",
        items: {
          type: "string",
        },
      },
      geocode: {
        type: "object",
        description: "Geocode data for the address.",
        properties: {
          location: {
            type: "object",
            properties: {
              latitude: {
                type: "number",
                description: "The latitude of the address.",
              },
              longitude: {
                type: "number",
                description: "The longitude of the address.",
              },
            },
          },
          plusCode: {
            type: "object",
            description: "The Plus Code for the address.",
            properties: {
              globalCode: {
                type: "string",
                description: "The global Plus Code.",
              },
              compoundCode: {
                type: "string",
                description: "The compound Plus Code.",
              },
            },
          },
          bounds: {
            type: "object",
            description: "The viewport bounds for the address.",
            properties: {
              northeast: {
                type: "object",
                properties: {
                  latitude: {
                    type: "number",
                  },
                  longitude: {
                    type: "number",
                  },
                },
              },
              southwest: {
                type: "object",
                properties: {
                  latitude: {
                    type: "number",
                  },
                  longitude: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
      },
      uspsData: {
        type: "object",
        description: "USPS-specific validation details.",
        properties: {
          standardizedAddress: {
            type: "object",
            description: "The standardized USPS address.",
          },
          deliveryPointValidation: {
            type: "string",
            description: "The USPS delivery point validation status.",
          },
          uspsAddressPrecision: {
            type: "string",
            description: "The level of precision for the USPS address.",
          },
        },
      },
    },
  },
  name: "validateAddress",
  provider: "googlemaps",
};
export const googlemapsNearbysearchRestaurantsDefinition: ActionTemplate = {
  description: "Search for nearby places using Google Maps",
  scopes: [],
  parameters: {
    type: "object",
    required: ["latitude", "longitude"],
    properties: {
      latitude: {
        type: "number",
        description: "The latitude of the location to search nearby",
      },
      longitude: {
        type: "number",
        description: "The longitude of the location to search nearby",
      },
    },
  },
  output: {
    type: "object",
    required: ["results"],
    properties: {
      results: {
        type: "array",
        description: "The results of the nearby search",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the place",
            },
            address: {
              type: "string",
              description: "The address of the place",
            },
            rating: {
              type: "number",
              description: "The rating of the place",
            },
            priceLevel: {
              type: "string",
              description: "The price level of the place",
            },
            openingHours: {
              type: "string",
              description: "The opening hours of the place",
            },
            primaryType: {
              type: "string",
              description: "The primary type of the place",
            },
            editorialSummary: {
              type: "string",
              description: "The editorial summary of the place",
            },
            websiteUri: {
              type: "string",
              description: "The website URI of the place",
            },
          },
        },
      },
    },
  },
  name: "nearbysearchRestaurants",
  provider: "googlemaps",
};
export const bingGetTopNSearchResultUrlsDefinition: ActionTemplate = {
  description: "Get the top five search result URLs from Bing",
  scopes: [],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "The query to search for",
      },
      count: {
        type: "number",
        description: "The number of results to return. Default is 5.",
      },
      site: {
        type: "string",
        description:
          "The site to restrict the search to (by inserting site:<site.com> in the query). Examples include openai.com, github.com",
      },
    },
  },
  output: {
    type: "object",
    required: ["results"],
    properties: {
      results: {
        type: "array",
        description: "The top five search result objects",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name or title of the search result",
            },
            url: {
              type: "string",
              description: "The URL of the search result",
            },
          },
        },
      },
    },
  },
  name: "getTopNSearchResultUrls",
  provider: "bing",
};
export const zendeskCreateZendeskTicketDefinition: ActionTemplate = {
  description: "Create a ticket in Zendesk",
  scopes: [],
  parameters: {
    type: "object",
    required: ["subject", "subdomain"],
    properties: {
      subject: {
        type: "string",
        description: "The subject of the ticket",
      },
      body: {
        type: "string",
        description: "The body of the ticket",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
    },
  },
  output: {
    type: "object",
    required: ["ticketId"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket created",
      },
      ticketUrl: {
        type: "string",
        description: "The URL of the ticket created",
      },
    },
  },
  name: "createZendeskTicket",
  provider: "zendesk",
};
export const zendeskListZendeskTicketsDefinition: ActionTemplate = {
  description: "List tickets in Zendesk from the past 3 months",
  scopes: [],
  parameters: {
    type: "object",
    required: ["subdomain"],
    properties: {
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
      status: {
        type: "string",
        description: "Filter tickets by status (new, open, pending, hold, solved, closed)",
      },
    },
  },
  output: {
    type: "object",
    required: ["tickets", "count"],
    properties: {
      tickets: {
        type: "array",
        description: "List of tickets",
        items: {
          type: "object",
        },
      },
      count: {
        type: "number",
        description: "Number of tickets found",
      },
    },
  },
  name: "listZendeskTickets",
  provider: "zendesk",
};
export const zendeskGetTicketDetailsDefinition: ActionTemplate = {
  description: "Get details of a ticket in Zendesk",
  scopes: [],
  parameters: {
    type: "object",
    required: ["ticketId", "subdomain"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
    },
  },
  output: {
    type: "object",
    required: ["ticket"],
    properties: {
      ticket: {
        type: "object",
        description: "The details of the ticket",
      },
    },
  },
  name: "getTicketDetails",
  provider: "zendesk",
};
export const zendeskUpdateTicketStatusDefinition: ActionTemplate = {
  description: "Update the status of a ticket in Zendesk",
  scopes: [],
  parameters: {
    type: "object",
    required: ["ticketId", "subdomain", "status"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket to update",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
      status: {
        type: "string",
        description:
          'The state of the ticket. If your account has activated custom ticket statuses, this is the ticket\'s status category. Allowed values are "new", "open", "pending", "hold", "solved", or "closed".',
      },
    },
  },
  name: "updateTicketStatus",
  provider: "zendesk",
};
export const zendeskAddCommentToTicketDefinition: ActionTemplate = {
  description: "Add a comment to a ticket in Zendesk",
  scopes: [],
  parameters: {
    type: "object",
    required: ["ticketId", "subdomain", "comment"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket to update",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
      comment: {
        type: "object",
        description: "The comment to add to the ticket",
        required: ["body"],
        properties: {
          body: {
            type: "string",
            description: "The body of the comment",
          },
          public: {
            type: "boolean",
            description: "Whether the comment should be public",
          },
        },
      },
    },
  },
  name: "addCommentToTicket",
  provider: "zendesk",
};
export const zendeskAssignTicketDefinition: ActionTemplate = {
  description: "Assign a ticket in Zendesk to a specific user",
  scopes: [],
  parameters: {
    type: "object",
    required: ["ticketId", "subdomain", "assigneeEmail"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket to update",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
      assigneeEmail: {
        type: "string",
        description: "The email address of the agent to assign the ticket to",
      },
    },
  },
  name: "assignTicket",
  provider: "zendesk",
};
export const linkedinCreateShareLinkedinPostUrlDefinition: ActionTemplate = {
  description: "Create a share linkedin post link",
  scopes: [],
  parameters: {
    type: "object",
    required: [],
    properties: {
      text: {
        type: "string",
        description: "The text for the linkedin post",
      },
      url: {
        type: "string",
        description: "The url for the linkedin post",
      },
    },
  },
  output: {
    type: "object",
    required: ["linkedinUrl"],
    properties: {
      linkedinUrl: {
        type: "string",
        description: "The share post linkedin URL",
      },
    },
  },
  name: "createShareLinkedinPostUrl",
  provider: "linkedin",
};
export const xCreateShareXPostUrlDefinition: ActionTemplate = {
  description: "Create a share X (formerly twitter) post link",
  scopes: [],
  parameters: {
    type: "object",
    required: ["text"],
    properties: {
      text: {
        type: "string",
        description: "The text for the X(formerly twitter) post",
      },
      url: {
        type: "string",
        description: "The url for the X(formerly twitter) post",
      },
      hashtag: {
        type: "array",
        description: "List of hashtags to include in the X post",
        items: {
          type: "string",
        },
      },
      via: {
        type: "string",
        description: "The twitter username to associate with the tweet",
      },
      inReplyTo: {
        type: "string",
        description: "The tweet ID to reply to",
      },
    },
  },
  output: {
    type: "object",
    required: ["xUrl"],
    properties: {
      xUrl: {
        type: "string",
        description: "The share post X(formerly twitter) URL",
      },
    },
  },
  name: "createShareXPostUrl",
  provider: "x",
};
export const mongoInsertMongoDocDefinition: ActionTemplate = {
  description: "Insert a document into a MongoDB collection",
  scopes: [],
  parameters: {
    type: "object",
    required: ["databaseName", "collectionName", "document"],
    properties: {
      databaseName: {
        type: "string",
        description: "Database to connect to",
      },
      collectionName: {
        type: "string",
        description: "Collection to insert the document into",
      },
      document: {
        type: "object",
        description: "The document to insert",
      },
    },
  },
  output: {
    type: "object",
    required: ["objectId"],
    properties: {
      objectId: {
        type: "string",
        description: "The new ID of the document inserted",
      },
    },
  },
  name: "insertMongoDoc",
  provider: "mongo",
};
export const snowflakeGetRowByFieldValueDefinition: ActionTemplate = {
  description: "Get a row from a Snowflake table by a field value",
  scopes: [],
  parameters: {
    type: "object",
    required: ["tableName", "fieldName", "fieldValue"],
    properties: {
      databaseName: {
        type: "string",
        description: "The name of the database to query",
      },
      tableName: {
        type: "string",
        description: "The name of the table to query",
      },
      fieldName: {
        type: "string",
        description: "The name of the field to query",
      },
      fieldValue: {
        type: "string",
        description: "The value of the field to query",
      },
      accountName: {
        type: "string",
        description: "The name of the Snowflake account",
      },
      warehouse: {
        type: "string",
        description: "The warehouse to use",
      },
    },
  },
  output: {
    type: "object",
    required: ["row"],
    properties: {
      row: {
        type: "object",
        description: "The row from the Snowflake table",
        properties: {
          id: {
            type: "string",
            description: "The ID of the row",
          },
          rowContents: {
            type: "object",
            description: "The contents of the row",
          },
        },
      },
    },
  },
  name: "getRowByFieldValue",
  provider: "snowflake",
};
export const snowflakeRunSnowflakeQueryDefinition: ActionTemplate = {
  description: "Execute a Snowflake query and return output.",
  scopes: [],
  parameters: {
    type: "object",
    required: ["databaseName", "warehouse", "query", "accountName"],
    properties: {
      databaseName: {
        type: "string",
        description: "The name of the database to query",
      },
      warehouse: {
        type: "string",
        description: "The warehouse to use for executing the query",
      },
      query: {
        type: "string",
        description: "The SQL query to execute",
      },
      accountName: {
        type: "string",
        description: "The name of the Snowflake account",
      },
      outputFormat: {
        type: "string",
        description: "The format of the output",
        enum: ["json", "csv"],
      },
      limit: {
        type: "number",
        description: "A limit on the number of rows to return",
      },
      codeInterpreterLimit: {
        type: "number",
        description:
          "A minimum number of rows required to pass to code interpreter for analysis and image generation (if enabled)",
      },
      codeInterpreterImageGenLimit: {
        type: "number",
        description:
          "A minimum number of rows required to pass to code interpreter for image generation only (if enabled)",
      },
    },
  },
  output: {
    type: "object",
    required: ["format", "content", "rowCount"],
    properties: {
      format: {
        type: "string",
        description: "The format of the output",
        enum: ["json", "csv"],
      },
      content: {
        type: "string",
        description: "The content of the query result (json)",
      },
      rowCount: {
        type: "number",
        description: "The number of rows returned by the query",
      },
      error: {
        type: "string",
        description: "The error that occurred if the query results failed or were limited",
      },
    },
  },
  name: "runSnowflakeQuery",
  provider: "snowflake",
};
export const openstreetmapGetLatitudeLongitudeFromLocationDefinition: ActionTemplate = {
  description: "Get the latitude and longitude of a location",
  scopes: [],
  parameters: {
    type: "object",
    required: ["location"],
    properties: {
      location: {
        type: "string",
        description: "The location to get the latitude and longitude of",
      },
    },
  },
  output: {
    type: "object",
    required: [],
    properties: {
      results: {
        type: "array",
        description: "The results of the query",
        items: {
          type: "object",
          required: ["latitude", "longitude", "display_name"],
          properties: {
            latitude: {
              type: "number",
              description: "The latitude of the location",
            },
            longitude: {
              type: "number",
              description: "The longitude of the location",
            },
            display_name: {
              type: "string",
              description: "The display name of the location",
            },
          },
        },
      },
    },
  },
  name: "getLatitudeLongitudeFromLocation",
  provider: "openstreetmap",
};
export const nwsGetForecastForLocationDefinition: ActionTemplate = {
  description: "Get the weather forecast for a location using latitude and longitude",
  scopes: [],
  parameters: {
    type: "object",
    required: ["latitude", "longitude", "isoDate"],
    properties: {
      latitude: {
        type: "number",
        description: "The latitude of the location",
      },
      longitude: {
        type: "number",
        description: "The longitude of the location",
      },
      isoDate: {
        type: "string",
        description: "The date to get the forecast for, in ISO datetime format",
      },
    },
  },
  output: {
    type: "object",
    required: [],
    properties: {
      result: {
        type: "object",
        required: ["temperature", "temperatureUnit", "forecast"],
        properties: {
          temperature: {
            type: "number",
            description: "The temperature at the location",
          },
          temperatureUnit: {
            type: "string",
            description: "The unit of temperature",
          },
          forecast: {
            type: "string",
            description: "The forecast for the location",
          },
        },
      },
    },
  },
  name: "getForecastForLocation",
  provider: "nws",
};
export const firecrawlDeepResearchDefinition: ActionTemplate = {
  description: "Deep research on a topic using Firecrawl",
  scopes: [],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "The query to search for",
      },
      maxDepth: {
        type: "number",
        description: "The maximum depth of the search",
      },
      timeLimit: {
        type: "number",
        description: "The time limit for the search in seconds",
      },
      maxUrls: {
        type: "number",
        description: "The maximum number of URLs to scrape",
      },
    },
  },
  output: {
    type: "object",
    required: ["finalAnalysis", "sources"],
    properties: {
      finalAnalysis: {
        type: "string",
        description: "The content of the research",
      },
      sources: {
        type: "array",
        description: "The sources of the research",
        items: {
          type: "object",
          required: ["url", "title"],
          properties: {
            url: {
              type: "string",
              description: "The URL of the source",
            },
            title: {
              type: "string",
              description: "The title of the source",
            },
            description: {
              type: "string",
              description: "The description of the source",
            },
          },
        },
      },
    },
  },
  name: "deepResearch",
  provider: "firecrawl",
};
export const firecrawlScrapeUrlDefinition: ActionTemplate = {
  description: "Scrape a URL and get website content using Firecrawl",
  scopes: [],
  parameters: {
    type: "object",
    required: ["url"],
    properties: {
      url: {
        type: "string",
        description: "The URL to scrape",
      },
    },
  },
  output: {
    type: "object",
    required: ["content"],
    properties: {
      content: {
        type: "string",
        description: "The content of the URL",
      },
    },
  },
  name: "scrapeUrl",
  provider: "firecrawl",
};
export const firecrawlScrapeTweetDataWithNitterDefinition: ActionTemplate = {
  description: "Given A tweet URL scrape the tweet data with nitter+firecrawl",
  scopes: [],
  parameters: {
    type: "object",
    required: ["tweetUrl"],
    properties: {
      tweetUrl: {
        type: "string",
        description: "The url for the X(formerly twitter) post",
      },
    },
  },
  output: {
    type: "object",
    required: ["text"],
    properties: {
      text: {
        type: "string",
        description: "The text in the tweet URL",
      },
    },
  },
  name: "scrapeTweetDataWithNitter",
  provider: "firecrawl",
};
export const resendSendEmailDefinition: ActionTemplate = {
  description: "Send an email using Resend",
  scopes: [],
  parameters: {
    type: "object",
    required: ["to", "subject", "content"],
    properties: {
      to: {
        type: "string",
        description: "The email address to send the email to",
      },
      subject: {
        type: "string",
        description: "The subject of the email",
      },
      content: {
        type: "string",
        description: "The content of the email",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the email was sent successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the email was not sent successfully",
      },
    },
  },
  name: "sendEmail",
  provider: "resend",
};
export const googleOauthSearchFilesByKeywordsDefinition: ActionTemplate = {
  description: "Search Google Drive files that contain one or more keywords in their full text.",
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  parameters: {
    type: "object",
    required: ["keywords"],
    properties: {
      keywords: {
        type: "array",
        description: "List of keywords to search for in file contents.",
        items: {
          type: "string",
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "files"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the search was successful",
      },
      files: {
        type: "array",
        description: "List of files matching the search",
        items: {
          type: "object",
          required: ["id", "name", "mimeType", "webViewLink"],
          properties: {
            id: {
              type: "string",
              description: "The file ID",
            },
            name: {
              type: "string",
              description: "The file name",
            },
            mimeType: {
              type: "string",
              description: "The MIME type of the file",
            },
            webViewLink: {
              type: "string",
              description: "The web link to view the file",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "Error message if search failed",
      },
    },
  },
  name: "searchFilesByKeywords",
  provider: "googleOauth",
};
export const googleOauthCreateNewGoogleDocDefinition: ActionTemplate = {
  description: "Create a new Google Docs document using OAuth authentication",
  scopes: [],
  parameters: {
    type: "object",
    required: ["title"],
    properties: {
      title: {
        type: "string",
        description: "The title of the new Google Doc",
      },
      content: {
        type: "string",
        description: "The content to add to the new Google Doc",
      },
    },
  },
  output: {
    type: "object",
    required: ["documentId"],
    properties: {
      documentId: {
        type: "string",
        description: "The ID of the created Google Doc",
      },
      documentUrl: {
        type: "string",
        description: "The URL to access the created Google Doc",
      },
    },
  },
  name: "createNewGoogleDoc",
  provider: "googleOauth",
};
export const googleOauthUpdateDocDefinition: ActionTemplate = {
  description: "Update an existing Google Docs document using OAuth authentication with batch requests",
  scopes: [],
  parameters: {
    type: "object",
    required: ["documentId"],
    properties: {
      documentId: {
        type: "string",
        description: "The ID of the Google Doc to update",
      },
      requests: {
        type: "array",
        description:
          "Array of requests to apply to the document. See https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#Request",
        items: {
          type: "object",
          description: "A single update request that must contain exactly one of the following operations",
          oneOf: [
            {
              type: "object",
              required: ["replaceAllText"],
              properties: {
                replaceAllText: {
                  type: "object",
                  description: "Replaces all instances of text matching a criteria",
                  required: ["replaceText", "containsText"],
                  properties: {
                    replaceText: {
                      type: "string",
                      description: "The text that will replace the matched text",
                    },
                    containsText: {
                      type: "object",
                      description: "The text to search for",
                      required: ["text"],
                      properties: {
                        text: {
                          type: "string",
                          description: "The text to search for in the document",
                        },
                        matchCase: {
                          type: "boolean",
                          description: "Whether the search should be case sensitive",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertText"],
              properties: {
                insertText: {
                  type: "object",
                  description: "Inserts text at a specific location",
                  required: ["text", "location"],
                  properties: {
                    text: {
                      type: "string",
                      description: "The text to insert",
                    },
                    location: {
                      type: "object",
                      description: "The location where the text will be inserted",
                      required: ["index"],
                      properties: {
                        index: {
                          type: "integer",
                          description: "The zero-based index in the document where to insert the text",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateTextStyle"],
              properties: {
                updateTextStyle: {
                  type: "object",
                  description: "Updates the styling of text",
                  required: ["textStyle", "fields"],
                  properties: {
                    textStyle: {
                      type: "object",
                      description: "The styles to set on the text",
                      properties: {
                        backgroundColor: {
                          type: "object",
                          description: "The background color of the text",
                        },
                        baselineOffset: {
                          type: "string",
                          description: "The text's vertical offset from its normal position",
                          enum: ["BASELINE_OFFSET_UNSPECIFIED", "NONE", "SUPERSCRIPT", "SUBSCRIPT"],
                        },
                        bold: {
                          type: "boolean",
                          description: "Whether the text is bold",
                        },
                        fontSize: {
                          type: "object",
                          description: "The size of the text's font",
                          properties: {
                            magnitude: {
                              type: "number",
                              description: "The font size in points",
                            },
                            unit: {
                              type: "string",
                              description: "The units for the font size",
                            },
                          },
                        },
                        foregroundColor: {
                          type: "object",
                          description: "The foreground color of the text",
                        },
                        italic: {
                          type: "boolean",
                          description: "Whether the text is italicized",
                        },
                        link: {
                          type: "object",
                          description: "The hyperlink destination of the text",
                          properties: {
                            url: {
                              type: "string",
                              description: "The URL of the link",
                            },
                          },
                        },
                        strikethrough: {
                          type: "boolean",
                          description: "Whether the text is struck through",
                        },
                        underline: {
                          type: "boolean",
                          description: "Whether the text is underlined",
                        },
                        weightedFontFamily: {
                          type: "object",
                          description: "The font family and weight of the text",
                          properties: {
                            fontFamily: {
                              type: "string",
                              description: "The font family of the text",
                            },
                            weight: {
                              type: "integer",
                              description: "The weight of the font",
                            },
                          },
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields that should be updated",
                    },
                    range: {
                      type: "object",
                      description: "The range of text to style",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteContentRange"],
              properties: {
                deleteContentRange: {
                  type: "object",
                  description: "Deletes content between two structural locations",
                  required: ["range"],
                  properties: {
                    range: {
                      type: "object",
                      description: "The range of content to delete",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertTableRow"],
              properties: {
                insertTableRow: {
                  type: "object",
                  description: "Inserts a new table row",
                  required: ["tableCellLocation", "insertBelow"],
                  properties: {
                    tableCellLocation: {
                      type: "object",
                      description: "The location where the table row will be inserted",
                      required: ["tableStartLocation"],
                      properties: {
                        tableStartLocation: {
                          type: "object",
                          description: "The location where the table starts",
                          required: ["index"],
                          properties: {
                            index: {
                              type: "integer",
                              description: "The zero-based index in the document",
                            },
                          },
                        },
                        rowIndex: {
                          type: "integer",
                          description: "The zero-based row index",
                        },
                        columnIndex: {
                          type: "integer",
                          description: "The zero-based column index",
                        },
                      },
                    },
                    insertBelow: {
                      type: "boolean",
                      description: "Whether to insert the row below the reference row",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertTableColumn"],
              properties: {
                insertTableColumn: {
                  type: "object",
                  description: "Inserts a new table column",
                  required: ["tableCellLocation", "insertRight"],
                  properties: {
                    tableCellLocation: {
                      type: "object",
                      description: "The location where the table column will be inserted",
                      required: ["tableStartLocation"],
                      properties: {
                        tableStartLocation: {
                          type: "object",
                          description: "The location where the table starts",
                          required: ["index"],
                          properties: {
                            index: {
                              type: "integer",
                              description: "The zero-based index in the document",
                            },
                          },
                        },
                        rowIndex: {
                          type: "integer",
                          description: "The zero-based row index",
                        },
                        columnIndex: {
                          type: "integer",
                          description: "The zero-based column index",
                        },
                      },
                    },
                    insertRight: {
                      type: "boolean",
                      description: "Whether to insert the column to the right of the reference column",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteTableRow"],
              properties: {
                deleteTableRow: {
                  type: "object",
                  description: "Deletes a table row",
                  required: ["tableCellLocation"],
                  properties: {
                    tableCellLocation: {
                      type: "object",
                      description: "The location of the row to delete",
                      required: ["tableStartLocation"],
                      properties: {
                        tableStartLocation: {
                          type: "object",
                          description: "The location where the table starts",
                          required: ["index"],
                          properties: {
                            index: {
                              type: "integer",
                              description: "The zero-based index in the document",
                            },
                          },
                        },
                        rowIndex: {
                          type: "integer",
                          description: "The zero-based row index",
                        },
                        columnIndex: {
                          type: "integer",
                          description: "The zero-based column index",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteTableColumn"],
              properties: {
                deleteTableColumn: {
                  type: "object",
                  description: "Deletes a table column",
                  required: ["tableCellLocation"],
                  properties: {
                    tableCellLocation: {
                      type: "object",
                      description: "The location of the column to delete",
                      required: ["tableStartLocation"],
                      properties: {
                        tableStartLocation: {
                          type: "object",
                          description: "The location where the table starts",
                          required: ["index"],
                          properties: {
                            index: {
                              type: "integer",
                              description: "The zero-based index in the document",
                            },
                          },
                        },
                        rowIndex: {
                          type: "integer",
                          description: "The zero-based row index",
                        },
                        columnIndex: {
                          type: "integer",
                          description: "The zero-based column index",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateParagraphStyle"],
              properties: {
                updateParagraphStyle: {
                  type: "object",
                  description: "Updates the style of paragraphs",
                  required: ["range", "paragraphStyle", "fields"],
                  properties: {
                    range: {
                      type: "object",
                      description: "The range of paragraphs to update",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                    paragraphStyle: {
                      type: "object",
                      description: "The styles to set on the paragraphs",
                      properties: {
                        alignment: {
                          type: "string",
                          description: "The text alignment",
                          enum: ["ALIGNMENT_UNSPECIFIED", "START", "CENTER", "END", "JUSTIFIED"],
                        },
                        direction: {
                          type: "string",
                          description: "The text direction",
                          enum: ["CONTENT_DIRECTION_UNSPECIFIED", "LEFT_TO_RIGHT", "RIGHT_TO_LEFT"],
                        },
                        indentStart: {
                          type: "object",
                          description: "The amount of indentation for the paragraph",
                          properties: {
                            magnitude: {
                              type: "number",
                              description: "The magnitude of indentation",
                            },
                            unit: {
                              type: "string",
                              description: "The units of indentation",
                            },
                          },
                        },
                        indentEnd: {
                          type: "object",
                          description: "The amount of indentation from the end",
                        },
                        indentFirstLine: {
                          type: "object",
                          description: "The amount of indentation for the first line",
                        },
                        keepLinesTogether: {
                          type: "boolean",
                          description: "Whether to keep all lines on the same page",
                        },
                        keepWithNext: {
                          type: "boolean",
                          description: "Whether to keep with the next paragraph",
                        },
                        lineSpacing: {
                          type: "number",
                          description: "The amount of space between lines",
                        },
                        spaceAbove: {
                          type: "object",
                          description: "The amount of space above the paragraph",
                        },
                        spaceBelow: {
                          type: "object",
                          description: "The amount of space below the paragraph",
                        },
                        spacingMode: {
                          type: "string",
                          description: "The spacing mode",
                          enum: ["SPACING_MODE_UNSPECIFIED", "NEVER_COLLAPSE", "COLLAPSE_LISTS"],
                        },
                        tabStops: {
                          type: "array",
                          description: "The tab stops for the paragraph",
                          items: {
                            type: "object",
                            properties: {
                              offset: {
                                type: "object",
                                description: "The offset of the tab stop",
                              },
                              alignment: {
                                type: "string",
                                description: "The alignment of the tab stop",
                              },
                            },
                          },
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields that should be updated",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createParagraphBullets"],
              properties: {
                createParagraphBullets: {
                  type: "object",
                  description: "Creates bullets for paragraphs",
                  required: ["range", "bulletPreset"],
                  properties: {
                    range: {
                      type: "object",
                      description: "The range of paragraphs to bullet",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                    bulletPreset: {
                      type: "string",
                      description: "The preset type of bullet to use",
                      enum: [
                        "BULLET_UNSPECIFIED",
                        "BULLET_DISC_CIRCLE_SQUARE",
                        "BULLET_DIAMONDX_ARROW3D_SQUARE",
                        "BULLET_CHECKBOX",
                        "BULLET_ARROW_DIAMOND_DISC",
                        "BULLET_STAR_CIRCLE_SQUARE",
                        "BULLET_ARROW3D_CIRCLE_SQUARE",
                        "BULLET_LEFTTRIANGLE_DIAMOND_DISC",
                        "BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE",
                        "BULLET_DIAMOND_CIRCLE_SQUARE",
                        "NUMBERED_DECIMAL_NESTED",
                        "NUMBERED_DECIMAL_PARENTHESIS_NESTED",
                        "NUMBERED_DECIMAL_PERIOD_NESTED",
                        "NUMBERED_UPPERALPHA_PARENTHESIS_NESTED",
                        "NUMBERED_UPPERROMAN_PARENTHESIS_NESTED",
                        "NUMBERED_LOWERALPHA_PARENTHESIS_NESTED",
                        "NUMBERED_LOWERROMAN_PARENTHESIS_NESTED",
                      ],
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteParagraphBullets"],
              properties: {
                deleteParagraphBullets: {
                  type: "object",
                  description: "Deletes bullets from paragraphs",
                  required: ["range"],
                  properties: {
                    range: {
                      type: "object",
                      description: "The range of paragraphs to remove bullets from",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertPageBreak"],
              properties: {
                insertPageBreak: {
                  type: "object",
                  description: "Inserts a page break",
                  required: ["location"],
                  properties: {
                    location: {
                      type: "object",
                      description: "The location at which to insert the page break",
                      required: ["index"],
                      properties: {
                        index: {
                          type: "integer",
                          description: "The zero-based index in the document",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateDocumentStyle"],
              properties: {
                updateDocumentStyle: {
                  type: "object",
                  description: "Updates the style of the document",
                  required: ["documentStyle", "fields"],
                  properties: {
                    documentStyle: {
                      type: "object",
                      description: "The styles to set on the document",
                      properties: {
                        background: {
                          type: "object",
                          description: "The background of the document",
                        },
                        defaultHeaderId: {
                          type: "string",
                          description: "The ID of the default header",
                        },
                        defaultFooterId: {
                          type: "string",
                          description: "The ID of the default footer",
                        },
                        evenPageHeaderId: {
                          type: "string",
                          description: "The ID of the header used on even pages",
                        },
                        evenPageFooterId: {
                          type: "string",
                          description: "The ID of the footer used on even pages",
                        },
                        firstPageHeaderId: {
                          type: "string",
                          description: "The ID of the header used on the first page",
                        },
                        firstPageFooterId: {
                          type: "string",
                          description: "The ID of the footer used on the first page",
                        },
                        marginTop: {
                          type: "object",
                          description: "The top page margin",
                        },
                        marginBottom: {
                          type: "object",
                          description: "The bottom page margin",
                        },
                        marginRight: {
                          type: "object",
                          description: "The right page margin",
                        },
                        marginLeft: {
                          type: "object",
                          description: "The left page margin",
                        },
                        pageNumberStart: {
                          type: "integer",
                          description: "The page number from which to start counting",
                        },
                        pageSize: {
                          type: "object",
                          description: "The size of the pages in the document",
                          properties: {
                            width: {
                              type: "object",
                              description: "The width of the page",
                            },
                            height: {
                              type: "object",
                              description: "The height of the page",
                            },
                          },
                        },
                        useCustomHeaderFooterMargins: {
                          type: "boolean",
                          description: "Whether to use custom margins for headers and footers",
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields that should be updated",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createHeader"],
              properties: {
                createHeader: {
                  type: "object",
                  description: "Creates a header",
                  required: ["type"],
                  properties: {
                    type: {
                      type: "string",
                      description: "The type of header to create",
                      enum: ["HEADER_TYPE_UNSPECIFIED", "DEFAULT", "FIRST_PAGE", "EVEN_PAGE"],
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createFooter"],
              properties: {
                createFooter: {
                  type: "object",
                  description: "Creates a footer",
                  required: ["type"],
                  properties: {
                    type: {
                      type: "string",
                      description: "The type of footer to create",
                      enum: ["FOOTER_TYPE_UNSPECIFIED", "DEFAULT", "FIRST_PAGE", "EVEN_PAGE"],
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateTableCellStyle"],
              properties: {
                updateTableCellStyle: {
                  type: "object",
                  description: "Updates the style of table cells",
                  required: ["tableCellStyle", "fields", "tableRange"],
                  properties: {
                    tableCellStyle: {
                      type: "object",
                      description: "The style to apply to the cells",
                      properties: {
                        backgroundColor: {
                          type: "object",
                          description: "The background color of the cells",
                        },
                        borderBottom: {
                          type: "object",
                          description: "The bottom border of the cells",
                        },
                        borderLeft: {
                          type: "object",
                          description: "The left border of the cells",
                        },
                        borderRight: {
                          type: "object",
                          description: "The right border of the cells",
                        },
                        borderTop: {
                          type: "object",
                          description: "The top border of the cells",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns that the cell spans",
                        },
                        contentAlignment: {
                          type: "string",
                          description: "The alignment of the content within the cells",
                        },
                        paddingBottom: {
                          type: "object",
                          description: "The bottom padding of the cells",
                        },
                        paddingLeft: {
                          type: "object",
                          description: "The left padding of the cells",
                        },
                        paddingRight: {
                          type: "object",
                          description: "The right padding of the cells",
                        },
                        paddingTop: {
                          type: "object",
                          description: "The top padding of the cells",
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows that the cell spans",
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields that should be updated",
                    },
                    tableRange: {
                      type: "object",
                      description: "The table range to apply the style to",
                      required: ["tableCellLocation", "rowSpan", "columnSpan"],
                      properties: {
                        tableCellLocation: {
                          type: "object",
                          description: "The location of the table cell",
                          required: ["tableStartLocation"],
                          properties: {
                            tableStartLocation: {
                              type: "object",
                              description: "The location where the table starts",
                              required: ["index"],
                              properties: {
                                index: {
                                  type: "integer",
                                  description: "The zero-based index in the document",
                                },
                              },
                            },
                            rowIndex: {
                              type: "integer",
                              description: "The zero-based row index",
                            },
                            columnIndex: {
                              type: "integer",
                              description: "The zero-based column index",
                            },
                          },
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows that the range should span",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns that the range should span",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["mergeTableCells"],
              properties: {
                mergeTableCells: {
                  type: "object",
                  description: "Merges table cells together",
                  required: ["tableRange"],
                  properties: {
                    tableRange: {
                      type: "object",
                      description: "The table range to merge",
                      required: ["tableCellLocation", "rowSpan", "columnSpan"],
                      properties: {
                        tableCellLocation: {
                          type: "object",
                          description: "The location of the table cell",
                          required: ["tableStartLocation"],
                          properties: {
                            tableStartLocation: {
                              type: "object",
                              description: "The location where the table starts",
                              required: ["index"],
                              properties: {
                                index: {
                                  type: "integer",
                                  description: "The zero-based index in the document",
                                },
                              },
                            },
                            rowIndex: {
                              type: "integer",
                              description: "The zero-based row index",
                            },
                            columnIndex: {
                              type: "integer",
                              description: "The zero-based column index",
                            },
                          },
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows that the range should span",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns that the range should span",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["unmergeTableCells"],
              properties: {
                unmergeTableCells: {
                  type: "object",
                  description: "Unmerges merged table cells",
                  required: ["tableRange"],
                  properties: {
                    tableRange: {
                      type: "object",
                      description: "The table range to unmerge",
                      required: ["tableCellLocation", "rowSpan", "columnSpan"],
                      properties: {
                        tableCellLocation: {
                          type: "object",
                          description: "The location of the table cell",
                          required: ["tableStartLocation"],
                          properties: {
                            tableStartLocation: {
                              type: "object",
                              description: "The location where the table starts",
                              required: ["index"],
                              properties: {
                                index: {
                                  type: "integer",
                                  description: "The zero-based index in the document",
                                },
                              },
                            },
                            rowIndex: {
                              type: "integer",
                              description: "The zero-based row index",
                            },
                            columnIndex: {
                              type: "integer",
                              description: "The zero-based column index",
                            },
                          },
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows that the range should span",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns that the range should span",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createNamedRange"],
              properties: {
                createNamedRange: {
                  type: "object",
                  description: "Creates a named range",
                  required: ["name", "range"],
                  properties: {
                    name: {
                      type: "string",
                      description: "The name of the range",
                    },
                    range: {
                      type: "object",
                      description: "The range to name",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteNamedRange"],
              properties: {
                deleteNamedRange: {
                  type: "object",
                  description: "Deletes a named range",
                  required: ["name"],
                  properties: {
                    name: {
                      type: "string",
                      description: "The name of the range to delete",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["replaceNamedRangeContent"],
              properties: {
                replaceNamedRangeContent: {
                  type: "object",
                  description: "Replaces the content of a named range",
                  required: ["name", "text"],
                  properties: {
                    name: {
                      type: "string",
                      description: "The name of the range to replace",
                    },
                    text: {
                      type: "string",
                      description: "The text to replace with",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertInlineImage"],
              properties: {
                insertInlineImage: {
                  type: "object",
                  description: "Inserts an inline image at a specific location",
                  required: ["location", "uri", "objectSize"],
                  properties: {
                    location: {
                      type: "object",
                      description: "The location at which to insert the image",
                      required: ["index"],
                      properties: {
                        index: {
                          type: "integer",
                          description: "The zero-based index in the document",
                        },
                      },
                    },
                    uri: {
                      type: "string",
                      description: "The image URI",
                    },
                    objectSize: {
                      type: "object",
                      description: "The size that the object should appear as in the document",
                      properties: {
                        width: {
                          type: "object",
                          description: "The width of the image",
                        },
                        height: {
                          type: "object",
                          description: "The height of the image",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteHeader"],
              properties: {
                deleteHeader: {
                  type: "object",
                  description: "Deletes a header",
                  required: ["headerId"],
                  properties: {
                    headerId: {
                      type: "string",
                      description: "The ID of the header to delete",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteFooter"],
              properties: {
                deleteFooter: {
                  type: "object",
                  description: "Deletes a footer",
                  required: ["footerId"],
                  properties: {
                    footerId: {
                      type: "string",
                      description: "The ID of the footer to delete",
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the document was updated successfully",
      },
      documentId: {
        type: "string",
        description: "The ID of the updated Google Doc",
      },
      documentUrl: {
        type: "string",
        description: "The URL to access the updated Google Doc",
      },
      error: {
        type: "string",
        description: "The error message if the update failed",
      },
    },
  },
  name: "updateDoc",
  provider: "googleOauth",
};
export const googleOauthScheduleCalendarMeetingDefinition: ActionTemplate = {
  description: "Schedule a meeting on google calendar using OAuth authentication",
  scopes: [],
  parameters: {
    type: "object",
    required: ["calendarId", "name", "start", "end"],
    properties: {
      calendarId: {
        type: "string",
        description: "The ID of the calendar to schedule the meeting on",
      },
      name: {
        type: "string",
        description: "The name of the meeting",
      },
      start: {
        type: "string",
        description: "The start time of the meeting",
      },
      end: {
        type: "string",
        description: "The end time of the meeting",
      },
      description: {
        type: "string",
        description: "The description of the meeting",
      },
      attendees: {
        type: "array",
        description: "The attendees of the meeting",
        items: {
          type: "string",
          description: "The email of the attendee",
        },
      },
      useGoogleMeet: {
        type: "boolean",
        description: "Whether to use Google Meet for the meeting",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the meeting was scheduled successfully",
      },
      eventId: {
        type: "string",
        description: "The ID of the event that was scheduled",
      },
      eventUrl: {
        type: "string",
        description: "The URL to access the scheduled event",
      },
      error: {
        type: "string",
        description: "The error that occurred if the meeting was not scheduled successfully",
      },
    },
  },
  name: "scheduleCalendarMeeting",
  provider: "googleOauth",
};
export const googleOauthListCalendarsDefinition: ActionTemplate = {
  description: "List all Google Calendars for the authenticated user",
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  parameters: {
    type: "object",
    required: [],
    properties: {
      maxResults: {
        type: "integer",
        description: "Maximum number of calendars to return, defaults to 250",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "calendars"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the calendars were listed successfully",
      },
      calendars: {
        type: "array",
        description: "List of calendars",
        items: {
          type: "object",
          required: ["id", "summary"],
          properties: {
            id: {
              type: "string",
              description: "The calendar ID",
            },
            summary: {
              type: "string",
              description: "The calendar name",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "Error message if listing failed",
      },
    },
  },
  name: "listCalendars",
  provider: "googleOauth",
};
export const googleOauthListCalendarEventsDefinition: ActionTemplate = {
  description: "List events on a Google Calendar, optionally searching by query.",
  scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  parameters: {
    type: "object",
    required: ["calendarId"],
    properties: {
      calendarId: {
        type: "string",
        description: "The ID of the calendar to list events from",
      },
      query: {
        type: "string",
        description: "Optional free-text search query to filter events",
      },
      maxResults: {
        type: "integer",
        description: "Maximum number of events to return, defaults to 250",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "events"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the events were listed successfully",
      },
      events: {
        type: "array",
        description: "List of events",
        items: {
          type: "object",
          description: "A calendar event",
          properties: {
            id: {
              type: "string",
              description: "Event unique identifier",
            },
            status: {
              type: "string",
              description: "Status of the event (e.g., confirmed, cancelled)",
            },
            url: {
              type: "string",
              description: "Link to the event in the Google Calendar web UI",
            },
            title: {
              type: "string",
              description: "Title of the event",
            },
            description: {
              type: "string",
              description: "Description of the event",
            },
            location: {
              type: "string",
              description: "Geographic location of the event as free-form text",
            },
            start: {
              type: "string",
              description: "Start date/time (for timed events, RFC3339 timestamp)",
            },
            end: {
              type: "string",
              description: "End date/time (for timed events, RFC3339 timestamp)",
            },
            attendees: {
              type: "array",
              description: "List of attendees",
              items: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    description: "The attendee's email address",
                  },
                  displayName: {
                    type: "string",
                    description: "The attendee's name",
                  },
                  responseStatus: {
                    type: "string",
                    description: "The attendee's response status (accepted, declined, etc.)",
                  },
                },
              },
            },
            organizer: {
              type: "object",
              description: "The organizer of the event",
              properties: {
                email: {
                  type: "string",
                  description: "The organizer's email address",
                },
                displayName: {
                  type: "string",
                  description: "The organizer's name",
                },
              },
            },
            hangoutLink: {
              type: "string",
              description: "Google Meet link for the event, if available",
            },
            created: {
              type: "string",
              description: "Creation time of the event (RFC3339 timestamp)",
            },
            updated: {
              type: "string",
              description: "Last modification time of the event (RFC3339 timestamp)",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "Error message if listing failed",
      },
    },
  },
  name: "listCalendarEvents",
  provider: "googleOauth",
};
export const googleOauthUpdateCalendarEventDefinition: ActionTemplate = {
  description: "Update an event on a Google Calendar using OAuth authentication",
  scopes: ["https://www.googleapis.com/auth/calendar"],
  parameters: {
    type: "object",
    required: ["calendarId", "eventId"],
    properties: {
      calendarId: {
        type: "string",
        description: "The ID of the calendar containing the event",
      },
      eventId: {
        type: "string",
        description: "The ID of the event to update",
      },
      updates: {
        type: "object",
        description: "The fields to update on the event",
        properties: {
          title: {
            type: "string",
            description: "The new title of the event",
          },
          description: {
            type: "string",
            description: "The new description of the event",
          },
          start: {
            type: "string",
            description: "The new start date/time (RFC3339 timestamp)",
          },
          end: {
            type: "string",
            description: "The new end date/time (RFC3339 timestamp)",
          },
          location: {
            type: "string",
            description: "The new location of the event",
          },
          attendees: {
            type: "array",
            description: "The new list of attendees",
            items: {
              type: "string",
              description: "The email of the attendee",
            },
          },
          status: {
            type: "string",
            description: "The new status of the event (e.g., confirmed, cancelled)",
          },
          organizer: {
            type: "object",
            description: "The new organizer of the event",
            properties: {
              email: {
                type: "string",
                description: "The organizer's email address",
              },
              displayName: {
                type: "string",
                description: "The organizer's name",
              },
            },
          },
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the event was updated successfully",
      },
      eventId: {
        type: "string",
        description: "The ID of the updated event",
      },
      eventUrl: {
        type: "string",
        description: "The URL to access the updated event",
      },
      error: {
        type: "string",
        description: "The error that occurred if the event was not updated successfully",
      },
    },
  },
  name: "updateCalendarEvent",
  provider: "googleOauth",
};
export const googleOauthDeleteCalendarEventDefinition: ActionTemplate = {
  description: "Delete an event from a Google Calendar using OAuth authentication",
  scopes: ["https://www.googleapis.com/auth/calendar"],
  parameters: {
    type: "object",
    required: ["calendarId", "eventId"],
    properties: {
      calendarId: {
        type: "string",
        description: "The ID of the calendar containing the event",
      },
      eventId: {
        type: "string",
        description: "The ID of the event to delete",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the event was deleted successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the event was not deleted successfully",
      },
    },
  },
  name: "deleteCalendarEvent",
  provider: "googleOauth",
};
export const googleOauthCreateSpreadsheetDefinition: ActionTemplate = {
  description: "Create a new Google Spreadsheet using OAuth authentication",
  scopes: [],
  parameters: {
    type: "object",
    required: ["title"],
    properties: {
      title: {
        type: "string",
        description: "The title of the new spreadsheet",
      },
      sheets: {
        type: "array",
        description: "The initial sheets to create in the spreadsheet",
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title of the sheet",
            },
            gridProperties: {
              type: "object",
              properties: {
                rowCount: {
                  type: "integer",
                  description: "The number of rows in the sheet",
                },
                columnCount: {
                  type: "integer",
                  description: "The number of columns in the sheet",
                },
                frozenRowCount: {
                  type: "integer",
                  description: "The number of frozen rows",
                },
                frozenColumnCount: {
                  type: "integer",
                  description: "The number of frozen columns",
                },
              },
            },
          },
        },
      },
      properties: {
        type: "object",
        description: "Properties for the spreadsheet",
        properties: {
          locale: {
            type: "string",
            description: "The locale of the spreadsheet (e.g., en_US)",
          },
          timeZone: {
            type: "string",
            description: "The time zone of the spreadsheet (e.g., America/New_York)",
          },
          autoRecalc: {
            type: "string",
            enum: ["ON_CHANGE", "MINUTE", "HOUR"],
            description: "When to recalculate the spreadsheet",
          },
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the spreadsheet was created successfully",
      },
      spreadsheetId: {
        type: "string",
        description: "The ID of the created spreadsheet",
      },
      spreadsheetUrl: {
        type: "string",
        description: "The URL to access the created spreadsheet",
      },
      sheets: {
        type: "array",
        description: "Information about the created sheets",
        items: {
          type: "object",
          properties: {
            sheetId: {
              type: "integer",
              description: "The ID of the sheet",
            },
            title: {
              type: "string",
              description: "The title of the sheet",
            },
            index: {
              type: "integer",
              description: "The index of the sheet",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the spreadsheet was not created successfully",
      },
    },
  },
  name: "createSpreadsheet",
  provider: "googleOauth",
};
export const googleOauthUpdateSpreadsheetDefinition: ActionTemplate = {
  description: "Update a Google Spreadsheet with new content specified",
  scopes: [],
  parameters: {
    type: "object",
    required: ["spreadsheetId", "requests"],
    properties: {
      spreadsheetId: {
        type: "string",
        description: "The ID of the Google Spreadsheet to update",
      },
      requests: {
        type: "array",
        description: "The requests to update the spreadsheet with",
        items: {
          type: "object",
          oneOf: [
            {
              type: "object",
              description: "Add or update a sheet",
              properties: {
                addSheet: {
                  type: "object",
                  properties: {
                    properties: {
                      type: "object",
                      properties: {
                        title: {
                          type: "string",
                          description: "The title of the new sheet",
                        },
                        gridProperties: {
                          type: "object",
                          properties: {
                            rowCount: {
                              type: "integer",
                              description: "The number of rows in the sheet",
                            },
                            columnCount: {
                              type: "integer",
                              description: "The number of columns in the sheet",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              description: "Delete a sheet",
              properties: {
                deleteSheet: {
                  type: "object",
                  properties: {
                    sheetId: {
                      type: "integer",
                      description: "The ID of the sheet to delete",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              description: "Update cells in a range",
              properties: {
                updateCells: {
                  type: "object",
                  properties: {
                    range: {
                      type: "object",
                      properties: {
                        sheetId: {
                          type: "integer",
                          description: "The ID of the sheet",
                        },
                        startRowIndex: {
                          type: "integer",
                          description: "The start row (0-based, inclusive)",
                        },
                        endRowIndex: {
                          type: "integer",
                          description: "The end row (0-based, exclusive)",
                        },
                        startColumnIndex: {
                          type: "integer",
                          description: "The start column (0-based, inclusive)",
                        },
                        endColumnIndex: {
                          type: "integer",
                          description: "The end column (0-based, exclusive)",
                        },
                      },
                    },
                    rows: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          values: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                userEnteredValue: {
                                  type: "object",
                                  properties: {
                                    stringValue: {
                                      type: "string",
                                    },
                                    numberValue: {
                                      type: "number",
                                    },
                                    boolValue: {
                                      type: "boolean",
                                    },
                                    formulaValue: {
                                      type: "string",
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              description: "Update sheet properties",
              properties: {
                updateSheetProperties: {
                  type: "object",
                  properties: {
                    properties: {
                      type: "object",
                      properties: {
                        sheetId: {
                          type: "integer",
                          description: "The ID of the sheet to update",
                        },
                        title: {
                          type: "string",
                          description: "The new title of the sheet",
                        },
                        gridProperties: {
                          type: "object",
                          properties: {
                            rowCount: {
                              type: "integer",
                              description: "The new number of rows",
                            },
                            columnCount: {
                              type: "integer",
                              description: "The new number of columns",
                            },
                            frozenRowCount: {
                              type: "integer",
                              description: "The number of frozen rows",
                            },
                            frozenColumnCount: {
                              type: "integer",
                              description: "The number of frozen columns",
                            },
                          },
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields to update (comma-separated list using JSON field paths)",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              description: "Update spreadsheet properties",
              properties: {
                updateSpreadsheetProperties: {
                  type: "object",
                  properties: {
                    properties: {
                      type: "object",
                      properties: {
                        title: {
                          type: "string",
                          description: "The title of the spreadsheet",
                        },
                        locale: {
                          type: "string",
                          description: "The locale of the spreadsheet (e.g., en_US)",
                        },
                        timeZone: {
                          type: "string",
                          description: "The time zone of the spreadsheet (e.g., America/New_York)",
                        },
                        autoRecalc: {
                          type: "string",
                          enum: ["ON_CHANGE", "MINUTE", "HOUR"],
                          description: "When to recalculate the spreadsheet",
                        },
                        defaultFormat: {
                          type: "object",
                          properties: {
                            backgroundColor: {
                              type: "object",
                              properties: {
                                red: {
                                  type: "number",
                                  description: "The red component [0.0, 1.0]",
                                },
                                green: {
                                  type: "number",
                                  description: "The green component [0.0, 1.0]",
                                },
                                blue: {
                                  type: "number",
                                  description: "The blue component [0.0, 1.0]",
                                },
                                alpha: {
                                  type: "number",
                                  description: "The alpha component [0.0, 1.0]",
                                },
                              },
                            },
                            numberFormat: {
                              type: "object",
                              properties: {
                                type: {
                                  type: "string",
                                  enum: [
                                    "TEXT",
                                    "NUMBER",
                                    "PERCENT",
                                    "CURRENCY",
                                    "DATE",
                                    "TIME",
                                    "DATE_TIME",
                                    "SCIENTIFIC",
                                  ],
                                  description: "The type of the number format",
                                },
                                pattern: {
                                  type: "string",
                                  description: "Pattern string used for formatting",
                                },
                              },
                            },
                            textFormat: {
                              type: "object",
                              properties: {
                                foregroundColor: {
                                  type: "object",
                                  properties: {
                                    red: {
                                      type: "number",
                                      description: "The red component [0.0, 1.0]",
                                    },
                                    green: {
                                      type: "number",
                                      description: "The green component [0.0, 1.0]",
                                    },
                                    blue: {
                                      type: "number",
                                      description: "The blue component [0.0, 1.0]",
                                    },
                                    alpha: {
                                      type: "number",
                                      description: "The alpha component [0.0, 1.0]",
                                    },
                                  },
                                },
                                fontFamily: {
                                  type: "string",
                                  description: "The font family",
                                },
                                fontSize: {
                                  type: "integer",
                                  description: "The size of the font in points",
                                },
                                bold: {
                                  type: "boolean",
                                  description: "Whether the text is bold",
                                },
                                italic: {
                                  type: "boolean",
                                  description: "Whether the text is italic",
                                },
                                strikethrough: {
                                  type: "boolean",
                                  description: "Whether the text has a strikethrough",
                                },
                                underline: {
                                  type: "boolean",
                                  description: "Whether the text is underlined",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields to update (comma-separated list using JSON field paths)",
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the spreadsheet was updated successfully",
      },
      spreadsheetUrl: {
        type: "string",
        description: "The URL of the updated spreadsheet",
      },
      replies: {
        type: "array",
        description: "The replies to the requests",
        items: {
          type: "object",
          description: "The reply to a request",
          oneOf: [
            {
              type: "object",
              description: "Reply to adding a sheet",
              properties: {
                addSheet: {
                  type: "object",
                  properties: {
                    properties: {
                      type: "object",
                      properties: {
                        sheetId: {
                          type: "integer",
                          description: "The ID of the newly created sheet",
                        },
                        title: {
                          type: "string",
                          description: "The title of the new sheet",
                        },
                        index: {
                          type: "integer",
                          description: "The index of the new sheet",
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the spreadsheet was not updated successfully",
      },
    },
  },
  name: "updateSpreadsheet",
  provider: "googleOauth",
};
export const googleOauthCreatePresentationDefinition: ActionTemplate = {
  description: "Create a Google Presentation",
  scopes: [],
  parameters: {
    type: "object",
    required: ["title"],
    properties: {
      title: {
        type: "string",
        description: "The title of the presentation",
      },
      pageSize: {
        type: "object",
        properties: {
          width: {
            type: "object",
            description: "The width object of the presentation",
            properties: {
              unit: {
                type: "string",
                enum: ["EMU", "PT"],
                description: "The unit of the width",
              },
              magnitude: {
                type: "number",
                description: "The width of the presentation",
              },
            },
          },
          height: {
            type: "object",
            description: "The height object of the presentation",
            properties: {
              unit: {
                type: "string",
                enum: ["EMU", "PT"],
                description: "The unit of the height",
              },
              magnitude: {
                type: "number",
                description: "The height of the presentation",
              },
            },
          },
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the presentation was created successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the presentation was not created successfully",
      },
      presentationId: {
        type: "string",
        description: "The ID of the created presentation",
      },
      presentationUrl: {
        type: "string",
        description: "The URL of the created presentation",
      },
    },
  },
  name: "createPresentation",
  provider: "googleOauth",
};
export const googleOauthUpdatePresentationDefinition: ActionTemplate = {
  description: "Update a Google Presentation",
  scopes: [],
  parameters: {
    type: "object",
    required: ["presentationId", "requests"],
    properties: {
      presentationId: {
        type: "string",
        description: "The ID of the presentation to update",
      },
      requests: {
        type: "array",
        description: "The requests to update the presentation with",
        items: {
          type: "object",
          oneOf: [
            {
              type: "object",
              required: ["createSlide"],
              properties: {
                createSlide: {
                  type: "object",
                  description: "Creates a new slide in the presentation",
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID for the created slide",
                    },
                    insertionIndex: {
                      type: "integer",
                      description: "The 0-based index where the new slide should be inserted",
                    },
                    slideLayoutReference: {
                      type: "object",
                      description: "Layout reference of the slide to be created",
                      properties: {
                        predefinedLayout: {
                          type: "string",
                          description: "Predefined layout of the slide",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createShape"],
              properties: {
                createShape: {
                  type: "object",
                  description: "Creates a new shape in the presentation",
                  required: ["objectId", "shapeType"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID for the created shape",
                    },
                    shapeType: {
                      type: "string",
                      description: "The type of shape to create",
                    },
                    elementProperties: {
                      type: "object",
                      description: "The element's size and position",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createTable"],
              properties: {
                createTable: {
                  type: "object",
                  description: "Creates a new table in the presentation",
                  required: ["rows", "columns"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID for the created table",
                    },
                    rows: {
                      type: "integer",
                      description: "Number of rows in the table",
                    },
                    columns: {
                      type: "integer",
                      description: "Number of columns in the table",
                    },
                    elementProperties: {
                      type: "object",
                      description: "The element's size and position",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertText"],
              properties: {
                insertText: {
                  type: "object",
                  description: "Inserts text into a shape or table cell",
                  required: ["objectId", "text"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the shape or table cell",
                    },
                    text: {
                      type: "string",
                      description: "The text to be inserted",
                    },
                    insertionIndex: {
                      type: "integer",
                      description: "The index where the text will be inserted",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertTableRows"],
              properties: {
                insertTableRows: {
                  type: "object",
                  description: "Inserts rows into a table",
                  required: ["tableObjectId", "insertBelow"],
                  properties: {
                    tableObjectId: {
                      type: "string",
                      description: "The table to insert rows into",
                    },
                    insertBelow: {
                      type: "boolean",
                      description: "Whether to insert the rows below the reference cell",
                    },
                    number: {
                      type: "integer",
                      description: "The number of rows to insert",
                    },
                    cellLocation: {
                      type: "object",
                      description: "The location where rows will be inserted",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertTableColumns"],
              properties: {
                insertTableColumns: {
                  type: "object",
                  description: "Inserts columns into a table",
                  required: ["tableObjectId", "insertRight"],
                  properties: {
                    tableObjectId: {
                      type: "string",
                      description: "The table to insert columns into",
                    },
                    insertRight: {
                      type: "boolean",
                      description: "Whether to insert the columns to the right of the reference cell",
                    },
                    number: {
                      type: "integer",
                      description: "The number of columns to insert",
                    },
                    cellLocation: {
                      type: "object",
                      description: "The location where columns will be inserted",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteTableRow"],
              properties: {
                deleteTableRow: {
                  type: "object",
                  description: "Deletes a row from a table",
                  required: ["tableObjectId", "cellLocation"],
                  properties: {
                    tableObjectId: {
                      type: "string",
                      description: "The table to delete a row from",
                    },
                    cellLocation: {
                      type: "object",
                      description: "The location of the row to delete",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteTableColumn"],
              properties: {
                deleteTableColumn: {
                  type: "object",
                  description: "Deletes a column from a table",
                  required: ["tableObjectId", "cellLocation"],
                  properties: {
                    tableObjectId: {
                      type: "string",
                      description: "The table to delete a column from",
                    },
                    cellLocation: {
                      type: "object",
                      description: "The location of the column to delete",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["replaceAllText"],
              properties: {
                replaceAllText: {
                  type: "object",
                  description: "Replaces all instances of text matching a criteria",
                  required: ["replaceText", "containsText"],
                  properties: {
                    replaceText: {
                      type: "string",
                      description: "The text that will replace the matched text",
                    },
                    containsText: {
                      type: "object",
                      description: "The text to search for",
                      required: ["text"],
                      properties: {
                        text: {
                          type: "string",
                          description: "The text to search for in the presentation",
                        },
                        matchCase: {
                          type: "boolean",
                          description: "Whether the search should be case sensitive",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteObject"],
              properties: {
                deleteObject: {
                  type: "object",
                  description: "Deletes an object from the presentation",
                  required: ["objectId"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the element to delete",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updatePageElementTransform"],
              properties: {
                updatePageElementTransform: {
                  type: "object",
                  description: "Updates the transform of a page element",
                  required: ["objectId", "transform"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the element to update",
                    },
                    transform: {
                      type: "object",
                      description: "The transform to apply",
                      properties: {
                        scaleX: {
                          type: "number",
                          description: "The horizontal scale factor",
                        },
                        scaleY: {
                          type: "number",
                          description: "The vertical scale factor",
                        },
                        translateX: {
                          type: "number",
                          description: "The horizontal translation",
                        },
                        translateY: {
                          type: "number",
                          description: "The vertical translation",
                        },
                        unit: {
                          type: "string",
                          description: "The unit for translate values",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateSlidesPosition"],
              properties: {
                updateSlidesPosition: {
                  type: "object",
                  description: "Updates the position of slides in the presentation",
                  required: ["slideObjectIds"],
                  properties: {
                    slideObjectIds: {
                      type: "array",
                      description: "The IDs of the slides to reorder",
                      items: {
                        type: "string",
                      },
                    },
                    insertionIndex: {
                      type: "integer",
                      description: "The 0-based index where the slides should be moved to",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteText"],
              properties: {
                deleteText: {
                  type: "object",
                  description: "Deletes text from a shape or table cell",
                  required: ["objectId"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the shape or table cell",
                    },
                    textRange: {
                      type: "object",
                      description: "The range of text to delete",
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The starting index of the range (0-based)",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The ending index of the range (0-based)",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createImage"],
              properties: {
                createImage: {
                  type: "object",
                  description: "Creates an image in the presentation",
                  required: ["url"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID for the created image",
                    },
                    url: {
                      type: "string",
                      description: "The URL of the image to insert",
                    },
                    elementProperties: {
                      type: "object",
                      description: "The element's size and position",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createVideo"],
              properties: {
                createVideo: {
                  type: "object",
                  description: "Creates a video in the presentation",
                  required: ["url"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID for the created video",
                    },
                    url: {
                      type: "string",
                      description: "The URL of the video to insert",
                    },
                    elementProperties: {
                      type: "object",
                      description: "The element's size and position",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createSheetsChart"],
              properties: {
                createSheetsChart: {
                  type: "object",
                  description: "Creates a linked chart from Google Sheets",
                  required: ["spreadsheetId", "chartId"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID for the created chart",
                    },
                    spreadsheetId: {
                      type: "string",
                      description: "The ID of the Google Sheets spreadsheet containing the chart",
                    },
                    chartId: {
                      type: "integer",
                      description: "The ID of the specific chart in the spreadsheet",
                    },
                    elementProperties: {
                      type: "object",
                      description: "The element's size and position",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createLine"],
              properties: {
                createLine: {
                  type: "object",
                  description: "Creates a line in the presentation",
                  required: ["lineCategory"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID for the created line",
                    },
                    lineCategory: {
                      type: "string",
                      description: "The category of line to create",
                    },
                    elementProperties: {
                      type: "object",
                      description: "The element's size and position",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["refreshSheetsChart"],
              properties: {
                refreshSheetsChart: {
                  type: "object",
                  description: "Refreshes an existing linked sheets chart",
                  required: ["objectId"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the chart to refresh",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateShapeProperties"],
              properties: {
                updateShapeProperties: {
                  type: "object",
                  description: "Updates the properties of a shape",
                  required: ["objectId", "shapeProperties"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the shape",
                    },
                    shapeProperties: {
                      type: "object",
                      description: "The properties to update",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateImageProperties"],
              properties: {
                updateImageProperties: {
                  type: "object",
                  description: "Updates the properties of an image",
                  required: ["objectId", "imageProperties"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the image",
                    },
                    imageProperties: {
                      type: "object",
                      description: "The properties to update",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateVideoProperties"],
              properties: {
                updateVideoProperties: {
                  type: "object",
                  description: "Updates the properties of a video",
                  required: ["objectId", "videoProperties"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the video",
                    },
                    videoProperties: {
                      type: "object",
                      description: "The properties to update",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updatePageProperties"],
              properties: {
                updatePageProperties: {
                  type: "object",
                  description: "Updates the properties of a page",
                  required: ["objectId", "pageProperties"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the page",
                    },
                    pageProperties: {
                      type: "object",
                      description: "The properties to update",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateTableCellProperties"],
              properties: {
                updateTableCellProperties: {
                  type: "object",
                  description: "Updates the properties of table cells",
                  required: ["objectId", "tableCellProperties"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the table cell",
                    },
                    tableCellProperties: {
                      type: "object",
                      description: "The properties to update for the table cell",
                    },
                    fields: {
                      type: "string",
                      description:
                        "Comma-separated list of fields to update (e.g., 'contentAlignment,backgroundColor')",
                    },
                    tableRange: {
                      type: "object",
                      description: "The range of cells to update the properties for",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateLineProperties"],
              properties: {
                updateLineProperties: {
                  type: "object",
                  description: "Updates the properties of a line",
                  required: ["objectId", "lineProperties"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the line",
                    },
                    lineProperties: {
                      type: "object",
                      description: "The properties to update for the line",
                    },
                    fields: {
                      type: "string",
                      description: "Comma-separated list of fields to update (e.g., 'lineFill,weight')",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createParagraphBullets"],
              properties: {
                createParagraphBullets: {
                  type: "object",
                  description: "Creates bullets for paragraphs",
                  required: ["objectId", "bulletPreset"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the shape or table cell containing the paragraph",
                    },
                    bulletPreset: {
                      type: "string",
                      description: "The preset type of bullet to use (e.g., BULLET_DISC_CIRCLE_SQUARE)",
                    },
                    textRange: {
                      type: "object",
                      description: "The range of text to apply bullets to (defaults to all text if unspecified)",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["replaceAllShapesWithImage"],
              properties: {
                replaceAllShapesWithImage: {
                  type: "object",
                  description: "Replaces all shapes matching criteria with an image",
                  required: ["imageUrl", "containsText"],
                  properties: {
                    imageUrl: {
                      type: "string",
                      description: "The URL of the image to replace shapes with",
                    },
                    containsText: {
                      type: "object",
                      description: "The text to search for in shapes to be replaced",
                      required: ["text"],
                      properties: {
                        text: {
                          type: "string",
                          description: "The text the shape must contain to be replaced",
                        },
                        matchCase: {
                          type: "boolean",
                          description: "Whether the text match is case-sensitive",
                        },
                      },
                    },
                    replaceMethod: {
                      type: "string",
                      enum: ["CENTER_INSIDE", "CENTER_CROP"],
                      description: "The image replace method (Defaults to CENTER_INSIDE)",
                    },
                    pageObjectIds: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      description: "Optional list of page object IDs to scope the replacement to",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["duplicateObject"],
              properties: {
                duplicateObject: {
                  type: "object",
                  description: "Duplicates a slide object (shape, image, table, etc.)",
                  required: ["objectId"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the object to duplicate",
                    },
                    objectIds: {
                      type: "object",
                      description:
                        "Optional map for assigning specific object IDs to the duplicated elements (key is original ID, value is new ID)",
                      additionalProperties: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateTextStyle"],
              properties: {
                updateTextStyle: {
                  type: "object",
                  description: "Updates the style of a range of text",
                  required: ["objectId", "style", "fields"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the shape or table cell containing the text",
                    },
                    style: {
                      type: "object",
                      description: "The text style properties to apply (e.g., bold, fontSize)",
                    },
                    fields: {
                      type: "string",
                      description:
                        "Comma-separated list of style fields to update using FieldMask syntax (e.g., 'bold,italic,fontSize')",
                    },
                    textRange: {
                      type: "object",
                      description: "The range of text to style (defaults to all text if unspecified)",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["ALL", "FROM_START_INDEX", "FIXED_RANGE"],
                          description: "The type of range",
                        },
                        startIndex: {
                          type: "integer",
                          description: "The start index for FROM_START_INDEX or FIXED_RANGE",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The end index for FIXED_RANGE",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["replaceAllShapesWithSheetsChart"],
              properties: {
                replaceAllShapesWithSheetsChart: {
                  type: "object",
                  description: "Replaces all shapes matching criteria with a Google Sheets chart",
                  required: ["spreadsheetId", "chartId", "containsText"],
                  properties: {
                    spreadsheetId: {
                      type: "string",
                      description: "The ID of the Google Sheets spreadsheet containing the chart",
                    },
                    chartId: {
                      type: "integer",
                      description: "The ID of the chart within the spreadsheet",
                    },
                    containsText: {
                      type: "object",
                      description: "Criteria for shapes to replace (must contain specified text)",
                      required: ["text"],
                      properties: {
                        text: {
                          type: "string",
                          description: "The text the shape must contain to be replaced",
                        },
                        matchCase: {
                          type: "boolean",
                          description: "Whether the text match is case-sensitive",
                        },
                      },
                    },
                    linkingMode: {
                      type: "string",
                      enum: ["LINKED", "NOT_LINKED_IMAGE"],
                      description: "The linking mode of the chart (Defaults to LINKED)",
                    },
                    pageObjectIds: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      description: "Optional list of page object IDs to scope the replacement to",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteParagraphBullets"],
              properties: {
                deleteParagraphBullets: {
                  type: "object",
                  description: "Deletes bullets from a range of paragraphs",
                  required: ["objectId"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the shape or table cell containing the paragraph",
                    },
                    textRange: {
                      type: "object",
                      description: "The range of text to delete bullets from (defaults to all text if unspecified)",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["ALL", "FROM_START_INDEX", "FIXED_RANGE"],
                          description: "The type of range",
                        },
                        startIndex: {
                          type: "integer",
                          description: "The start index for FROM_START_INDEX or FIXED_RANGE",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The end index for FIXED_RANGE",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateParagraphStyle"],
              properties: {
                updateParagraphStyle: {
                  type: "object",
                  description: "Updates the style of paragraphs",
                  required: ["objectId", "style", "fields"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the shape or table cell containing the paragraph",
                    },
                    style: {
                      type: "object",
                      description: "The paragraph style properties to apply (e.g., alignment, lineSpacing)",
                    },
                    fields: {
                      type: "string",
                      description:
                        "Comma-separated list of style fields to update using FieldMask syntax (e.g., 'alignment,direction,lineSpacing')",
                    },
                    textRange: {
                      type: "object",
                      description:
                        "The range of text to apply the style to (defaults to all paragraphs if unspecified)",
                      properties: {
                        type: {
                          type: "string",
                          enum: ["ALL", "FROM_START_INDEX", "FIXED_RANGE"],
                          description: "The type of range",
                        },
                        startIndex: {
                          type: "integer",
                          description: "The start index for FROM_START_INDEX or FIXED_RANGE",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The end index for FIXED_RANGE",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateTableBorderProperties"],
              properties: {
                updateTableBorderProperties: {
                  type: "object",
                  description: "Updates the properties of a table border",
                  required: ["objectId", "tableBorderProperties"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the table",
                    },
                    tableBorderProperties: {
                      type: "object",
                      description: "The border properties to update (e.g., dashStyle, weight, color)",
                    },
                    fields: {
                      type: "string",
                      description: "Comma-separated list of fields to update (e.g., 'dashStyle,weight')",
                    },
                    borderPosition: {
                      type: "string",
                      enum: ["ALL", "BOTTOM", "TOP", "LEFT", "RIGHT", "INNER_HORIZONTAL", "INNER_VERTICAL"],
                      description: "The position of the border segments to update (defaults to ALL if unspecified)",
                    },
                    tableRange: {
                      type: "object",
                      description:
                        "The range of cells whose border should be updated (defaults to the entire table if unspecified)",
                      properties: {
                        location: {
                          type: "object",
                          description: "The starting cell location",
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows in the range",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns in the range",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateTableColumnProperties"],
              properties: {
                updateTableColumnProperties: {
                  type: "object",
                  description: "Updates the properties of table columns",
                  required: ["objectId", "columnIndices", "tableColumnProperties", "fields"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the table",
                    },
                    columnIndices: {
                      type: "array",
                      items: {
                        type: "integer",
                      },
                      description: "The 0-based indices of the columns to update",
                    },
                    tableColumnProperties: {
                      type: "object",
                      description: "The properties to update (e.g., columnWidth)",
                    },
                    fields: {
                      type: "string",
                      description:
                        "Comma-separated list of fields to update using FieldMask syntax (e.g., 'columnWidth')",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateTableRowProperties"],
              properties: {
                updateTableRowProperties: {
                  type: "object",
                  description: "Updates the properties of table rows",
                  required: ["objectId", "rowIndices", "tableRowProperties", "fields"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the table",
                    },
                    rowIndices: {
                      type: "array",
                      items: {
                        type: "integer",
                      },
                      description: "The 0-based indices of the rows to update",
                    },
                    tableRowProperties: {
                      type: "object",
                      description: "The properties to update (e.g., minRowHeight)",
                    },
                    fields: {
                      type: "string",
                      description:
                        "Comma-separated list of fields to update using FieldMask syntax (e.g., 'minRowHeight')",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["mergeTableCells"],
              properties: {
                mergeTableCells: {
                  type: "object",
                  description: "Merges cells in a table",
                  required: ["objectId", "tableRange"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the table",
                    },
                    tableRange: {
                      type: "object",
                      description: "The range of cells to merge",
                      properties: {
                        location: {
                          type: "object",
                          description: "The starting cell location",
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows in the range",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns in the range",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["unmergeTableCells"],
              properties: {
                unmergeTableCells: {
                  type: "object",
                  description: "Unmerges cells in a table",
                  required: ["objectId", "tableRange"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the table",
                    },
                    tableRange: {
                      type: "object",
                      description: "The range of cells to unmerge",
                      properties: {
                        location: {
                          type: "object",
                          description: "The starting cell location",
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows in the range",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns in the range",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["groupObjects"],
              properties: {
                groupObjects: {
                  type: "object",
                  description: "Groups multiple page elements together",
                  required: ["childrenObjectIds", "groupObjectId"],
                  properties: {
                    childrenObjectIds: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      description: "The object IDs of the elements to group",
                    },
                    groupObjectId: {
                      type: "string",
                      description: "The object ID to assign to the created group",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["ungroupObjects"],
              properties: {
                ungroupObjects: {
                  type: "object",
                  description: "Ungroups page elements",
                  required: ["objectIds"],
                  properties: {
                    objectIds: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      description: "The object IDs of the groups to ungroup",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updatePageElementAltText"],
              properties: {
                updatePageElementAltText: {
                  type: "object",
                  description: "Updates the alt text for a page element",
                  required: ["objectId", "title", "description"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the page element",
                    },
                    title: {
                      type: "string",
                      description: "The title for the alt text",
                    },
                    description: {
                      type: "string",
                      description: "The description for the alt text",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["replaceImage"],
              properties: {
                replaceImage: {
                  type: "object",
                  description: "Replaces an existing image with a new one",
                  required: ["imageObjectId", "url"],
                  properties: {
                    imageObjectId: {
                      type: "string",
                      description: "The object ID of the image to replace",
                    },
                    url: {
                      type: "string",
                      description: "The URL of the new image",
                    },
                    replaceMethod: {
                      type: "string",
                      enum: ["CENTER_INSIDE", "CENTER_CROP"],
                      description: "The image replace method (Defaults to CENTER_INSIDE)",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateSlideProperties"],
              properties: {
                updateSlideProperties: {
                  type: "object",
                  description: "Updates the properties of a slide",
                  required: ["objectId", "slideProperties", "fields"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the slide",
                    },
                    slideProperties: {
                      type: "object",
                      description: "The properties to update (e.g., master reference, layout reference)",
                    },
                    fields: {
                      type: "string",
                      description:
                        "Comma-separated list of fields to update using FieldMask syntax (e.g., 'slideBackgroundFill')",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updatePageElementsZOrder"],
              properties: {
                updatePageElementsZOrder: {
                  type: "object",
                  description: "Updates the Z-order of page elements",
                  required: ["pageObjectIds", "operation"],
                  properties: {
                    pageObjectIds: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      description: "The object IDs of the page elements to reorder",
                    },
                    operation: {
                      type: "string",
                      enum: ["BRING_TO_FRONT", "BRING_FORWARD", "SEND_BACKWARD", "SEND_TO_BACK"],
                      description: "The Z-order operation to apply",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateLineCategory"],
              properties: {
                updateLineCategory: {
                  type: "object",
                  description: "Updates the category of a line",
                  required: ["objectId", "lineCategory"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the line",
                    },
                    lineCategory: {
                      type: "string",
                      enum: ["STRAIGHT", "BENT", "CURVED"],
                      description: "The new line category",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["rerouteLine"],
              properties: {
                rerouteLine: {
                  type: "object",
                  description: "Reroutes a line connection",
                  required: ["objectId"],
                  properties: {
                    objectId: {
                      type: "string",
                      description: "The object ID of the line to reroute",
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the presentation was created successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the presentation was not created successfully",
      },
      presentationUrl: {
        type: "string",
        description: "The URL of the created presentation",
      },
    },
  },
  name: "updatePresentation",
  provider: "googleOauth",
};
export const googleOauthSearchDriveByKeywordsDefinition: ActionTemplate = {
  description: "Search Google Drive files that contain one or more keywords in their full text.",
  scopes: ["drive.readonly"],
  parameters: {
    type: "object",
    required: ["keywords"],
    properties: {
      keywords: {
        type: "array",
        description: "List of keywords to search for in file contents.",
        items: {
          type: "string",
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the search was successful",
      },
      files: {
        type: "array",
        description: "List of files matching the search",
        items: {
          type: "object",
          required: ["id", "name", "mimeType", "url"],
          properties: {
            id: {
              type: "string",
              description: "The file ID",
            },
            name: {
              type: "string",
              description: "The file name",
            },
            mimeType: {
              type: "string",
              description: "The MIME type of the file",
            },
            url: {
              type: "string",
              description: "The web link to view the file",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "Error message if search failed",
      },
    },
  },
  name: "searchDriveByKeywords",
  provider: "googleOauth",
};
export const googleOauthListGroupsDefinition: ActionTemplate = {
  description: "List all Google Groups for the customer.",
  scopes: ["https://www.googleapis.com/auth/admin.directory.group.readonly"],
  parameters: {
    type: "object",
    required: [],
    properties: {
      maxResults: {
        type: "integer",
        description: "The maximum number of groups to return (max allowed is 200)",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "groups"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the groups were listed successfully",
      },
      groups: {
        type: "array",
        description: "The list of Google Groups",
        items: {
          type: "object",
          required: ["id", "email", "name"],
          properties: {
            id: {
              type: "string",
              description: "The unique ID of the group",
            },
            email: {
              type: "string",
              description: "The email address of the group",
            },
            name: {
              type: "string",
              description: "The name of the group",
            },
            description: {
              type: "string",
              description: "The description of the group",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the groups could not be listed",
      },
    },
  },
  name: "listGroups",
  provider: "googleOauth",
};
export const googleOauthGetGroupDefinition: ActionTemplate = {
  description: "Get details for a specific Google Group by group email or ID.",
  scopes: ["https://www.googleapis.com/auth/admin.directory.group.readonly"],
  parameters: {
    type: "object",
    required: ["groupKey"],
    properties: {
      groupKey: {
        type: "string",
        description: "The group's email address or unique group ID",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "group"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the group was retrieved successfully",
      },
      group: {
        type: "object",
        required: ["id", "email", "name"],
        properties: {
          id: {
            type: "string",
            description: "The unique ID of the group",
          },
          email: {
            type: "string",
            description: "The email address of the group",
          },
          name: {
            type: "string",
            description: "The name of the group",
          },
          description: {
            type: "string",
            description: "The description of the group",
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the group could not be retrieved",
      },
    },
  },
  name: "getGroup",
  provider: "googleOauth",
};
export const googleOauthListGroupMembersDefinition: ActionTemplate = {
  description: "List all members of a Google Group.",
  scopes: ["https://www.googleapis.com/auth/admin.directory.group.member.readonly"],
  parameters: {
    type: "object",
    required: ["groupKey"],
    properties: {
      groupKey: {
        type: "string",
        description: "The group's email address or unique group ID",
      },
      maxResults: {
        type: "integer",
        description: "The maximum number of members to return (max allowed is 200)",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "members"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the members were listed successfully",
      },
      members: {
        type: "array",
        description: "The list of group members",
        items: {
          type: "object",
          required: ["id", "email", "role", "type"],
          properties: {
            id: {
              type: "string",
              description: "The unique ID of the member",
            },
            email: {
              type: "string",
              description: "The email address of the member",
            },
            role: {
              type: "string",
              description: "The role of the member in the group (OWNER, MANAGER, MEMBER)",
            },
            type: {
              type: "string",
              description: "The type of the member (USER, GROUP)",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the members could not be listed",
      },
    },
  },
  name: "listGroupMembers",
  provider: "googleOauth",
};
export const googleOauthHasGroupMemberDefinition: ActionTemplate = {
  description: "Check if a user is a member of a Google Group.",
  scopes: ["https://www.googleapis.com/auth/admin.directory.group.member.readonly"],
  parameters: {
    type: "object",
    required: ["groupKey", "memberKey"],
    properties: {
      groupKey: {
        type: "string",
        description: "The group's email address or unique group ID",
      },
      memberKey: {
        type: "string",
        description: "The member's email address or unique member ID",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "isMember"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the check was performed successfully",
      },
      isMember: {
        type: "boolean",
        description: "Whether the user is a member of the group",
      },
      error: {
        type: "string",
        description: "The error that occurred if the check could not be performed",
      },
    },
  },
  name: "hasGroupMember",
  provider: "googleOauth",
};
export const googleOauthAddGroupMemberDefinition: ActionTemplate = {
  description: "Add a member to a Google Group.",
  scopes: ["https://www.googleapis.com/auth/admin.directory.group.member"],
  parameters: {
    type: "object",
    required: ["groupKey", "email"],
    properties: {
      groupKey: {
        type: "string",
        description: "The group's email address or unique group ID",
      },
      email: {
        type: "string",
        description: "The email address of the user to add",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "memberID"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the member was added successfully",
      },
      memberID: {
        type: "string",
        description: "The unique ID of the member",
      },
      error: {
        type: "string",
        description: "The error that occurred if the member could not be added",
      },
    },
  },
  name: "addGroupMember",
  provider: "googleOauth",
};
export const googleOauthDeleteGroupMemberDefinition: ActionTemplate = {
  description: "Remove a member from a Google Group.",
  scopes: ["https://www.googleapis.com/auth/admin.directory.group.member"],
  parameters: {
    type: "object",
    required: ["groupKey", "memberKey"],
    properties: {
      groupKey: {
        type: "string",
        description: "The group's email address or unique group ID",
      },
      memberKey: {
        type: "string",
        description: "The member's email address or unique member ID",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the member was removed successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the member could not be removed",
      },
    },
  },
  name: "deleteGroupMember",
  provider: "googleOauth",
};
export const googlemailSearchGmailMessagesDefinition: ActionTemplate = {
  description: "Search Gmail messages in a user's inbox using a query string.",
  scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: 'Gmail search query (e.g. "from:alice subject:urgent")',
      },
      maxResults: {
        type: "integer",
        description: "Maximum number of messages to return (optional)",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "messages"],
    properties: {
      success: {
        type: "boolean",
      },
      messages: {
        type: "array",
        description: "List of matching Gmail messages",
        items: {
          type: "object",
          required: ["id", "threadId"],
          properties: {
            id: {
              type: "string",
              description: "The message ID",
            },
            threadId: {
              type: "string",
              description: "The thread ID",
            },
            snippet: {
              type: "string",
              description: "A short part of the message text",
            },
            labelIds: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Labels on the message",
            },
            internalDate: {
              type: "string",
              description: "Internal timestamp of the message",
            },
            emailBody: {
              type: "string",
              description: "The body of the message",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "Error message if search failed",
      },
    },
  },
  name: "searchGmailMessages",
  provider: "googlemail",
};
export const googlemailListGmailThreadsDefinition: ActionTemplate = {
  description: "List Gmail threads in a user's inbox using a query string.",
  scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: 'Gmail search query (e.g. "from:alice subject:project")',
      },
      maxResults: {
        type: "integer",
        description: "Maximum number of threads to return",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "threads"],
    properties: {
      success: {
        type: "boolean",
      },
      threads: {
        type: "array",
        description: "List of matching Gmail threads",
        items: {
          type: "object",
          required: ["id", "historyId", "messages"],
          properties: {
            id: {
              type: "string",
              description: "The thread ID",
            },
            historyId: {
              type: "string",
              description: "The thread history ID",
            },
            messages: {
              type: "array",
              description: "The messages in the thread",
              items: {
                type: "object",
                required: ["id", "threadId", "snippet", "labelIds", "internalDate", "emailBody"],
                properties: {
                  id: {
                    type: "string",
                  },
                  threadId: {
                    type: "string",
                  },
                  snippet: {
                    type: "string",
                  },
                  labelIds: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                  internalDate: {
                    type: "string",
                  },
                  emailBody: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      error: {
        type: "string",
        description: "Error message if search failed",
      },
    },
  },
  name: "listGmailThreads",
  provider: "googlemail",
};
export const gongGetGongTranscriptsDefinition: ActionTemplate = {
  description: "Get sales call transcripts from Gong",
  scopes: [],
  parameters: {
    type: "object",
    required: ["userRole"],
    properties: {
      userRole: {
        type: "string",
        description: "The role of users whose transcripts are being fetched",
      },
      trackers: {
        type: "array",
        description: "The trackers to fetch transcripts for",
        items: {
          type: "string",
          description: "The names of the trackers to fetch transcripts for",
        },
      },
      company: {
        type: "string",
        description: "The company to get calls with",
      },
      startDate: {
        type: "string",
        description: "The start date of the transcripts to fetch in ISO 8601 format",
      },
      endDate: {
        type: "string",
        description: "The end date of the transcripts to fetch in ISO 8601 format",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the transcripts were fetched successfully",
      },
      callTranscripts: {
        type: "array",
        description: "The transcripts fetched",
        items: {
          type: "object",
          description: "A transcript",
          properties: {
            callId: {
              type: "string",
              description: "The ID of the call",
            },
            callName: {
              type: "string",
              description: "The name of the call",
            },
            startTime: {
              type: "string",
              description: "The start time of the call in ISO 8601 format",
            },
            transcript: {
              type: "array",
              description: "The transcript",
              items: {
                type: "object",
                description: "A transcript",
                properties: {
                  speakerName: {
                    type: "string",
                    description: "The name of the speaker",
                  },
                  speakerEmail: {
                    type: "string",
                    description: "The email of the speaker",
                  },
                  topic: {
                    type: "string",
                    nullable: true,
                    description: "The topic of the transcript",
                  },
                  sentences: {
                    type: "array",
                    description: "The sentences in the transcript",
                    items: {
                      type: "object",
                      description: "A sentence",
                      properties: {
                        start: {
                          type: "number",
                          description: "The start time of the sentence in seconds",
                        },
                        end: {
                          type: "number",
                          description: "The end time of the sentence in seconds",
                        },
                        text: {
                          type: "string",
                          description: "The text of the sentence",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the transcripts weren't fetched successfully",
      },
    },
  },
  name: "getGongTranscripts",
  provider: "gong",
};
export const finnhubSymbolLookupDefinition: ActionTemplate = {
  description: "Look up a stock symbol by name",
  scopes: [],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "The symbol or colloquial name of the company to look up",
      },
    },
  },
  output: {
    type: "object",
    required: ["result"],
    properties: {
      result: {
        type: "array",
        description: "The results of the symbol lookup",
        items: {
          type: "object",
          description: "The metadata of the stock",
          properties: {
            symbol: {
              type: "string",
              description: "The symbol of the stock",
            },
            description: {
              type: "string",
              description: "The description of the stock",
            },
          },
        },
      },
    },
  },
  name: "symbolLookup",
  provider: "finnhub",
};
export const finnhubGetBasicFinancialsDefinition: ActionTemplate = {
  description: "Get company basic financials such as margin, P/E ratio, 52-week high/low etc.",
  scopes: [],
  parameters: {
    type: "object",
    required: ["symbol"],
    properties: {
      symbol: {
        type: "string",
        description: "The symbol/TICKER of the stock",
      },
    },
  },
  output: {
    type: "object",
    required: ["result"],
    properties: {
      result: {
        type: "object",
        description: "The basic financials of the stock",
        properties: {
          annual: {
            type: "array",
            description: "The annual financials of the stock",
            items: {
              type: "object",
              description: "The annual financials of the stock",
              properties: {
                metric: {
                  type: "string",
                  description: "The name of the financial metric",
                },
                series: {
                  type: "array",
                  description: "The series of values for the financial metric",
                  items: {
                    type: "object",
                    description: "The value of the financial metric",
                    properties: {
                      period: {
                        type: "string",
                        description: "The period of the financial metric in YYYY-MM-DD format",
                      },
                      v: {
                        type: "number",
                        description: "The value of the financial metric",
                      },
                    },
                  },
                },
              },
            },
          },
          quarterly: {
            type: "array",
            description: "The quarterly financials of the stock",
            items: {
              type: "object",
              description: "The quarterly financials of the stock",
              properties: {
                metric: {
                  type: "string",
                  description: "The name of the financial metric",
                },
                series: {
                  type: "array",
                  description: "The series of values for the financial metric",
                  items: {
                    type: "object",
                    description: "The value of the financial metric",
                    properties: {
                      period: {
                        type: "string",
                        description: "The period of the financial metric in YYYY-MM-DD format",
                      },
                      v: {
                        type: "number",
                        description: "The value of the financial metric",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  name: "getBasicFinancials",
  provider: "finnhub",
};
export const lookerEnableUserByEmailDefinition: ActionTemplate = {
  description: "Search for a Looker user by email and enable them if disabled",
  scopes: [],
  parameters: {
    type: "object",
    required: ["userEmail"],
    properties: {
      userEmail: {
        type: "string",
        description: "The email address of the user to search for",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "message"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the operation was successful",
      },
      message: {
        type: "string",
        description: "Status message about the operation",
      },
      userId: {
        type: "string",
        description: "The ID of the user that was found",
      },
      userDetails: {
        type: "object",
        required: ["id", "firstName", "lastName", "email", "isDisabled"],
        description: "Details about the user",
        properties: {
          id: {
            type: "string",
            description: "The ID of the user",
          },
          firstName: {
            type: "string",
            description: "The first name of the user",
          },
          lastName: {
            type: "string",
            description: "The last name of the user",
          },
          email: {
            type: "string",
            description: "The email of the user",
          },
          isDisabled: {
            type: "boolean",
            description: "Whether the user is disabled",
          },
        },
      },
    },
  },
  name: "enableUserByEmail",
  provider: "looker",
};
export const ashbyCreateNoteDefinition: ActionTemplate = {
  description: "Creates a note on a candidate",
  scopes: [],
  parameters: {
    type: "object",
    required: ["candidateId", "note"],
    properties: {
      candidateId: {
        type: "string",
        description: "The ID of the candidate to create a note for",
      },
      note: {
        type: "string",
        description: "The note content",
      },
    },
  },
  name: "createNote",
  provider: "ashby",
};
export const ashbyGetCandidateInfoDefinition: ActionTemplate = {
  description: "Gets a candidate's information",
  scopes: [],
  parameters: {
    type: "object",
    required: ["candidateId"],
    properties: {
      candidateId: {
        type: "string",
        description: "The ID of the candidate whose information is to be retrieved",
      },
    },
  },
  output: {
    type: "object",
    required: ["candidate"],
    properties: {
      candidate: {
        type: "object",
        description: "The candidate's information",
        required: [],
      },
    },
  },
  name: "getCandidateInfo",
  provider: "ashby",
};
export const ashbyAddCandidateToProjectDefinition: ActionTemplate = {
  description: "Adds a candidate to a project",
  scopes: [],
  parameters: {
    type: "object",
    required: ["candidateId", "projectId"],
    properties: {
      candidateId: {
        type: "string",
        description: "The ID of the candidate to add to the project",
      },
      projectId: {
        type: "string",
        description: "The ID of the project to add the candidate to",
      },
    },
  },
  name: "addCandidateToProject",
  provider: "ashby",
};
export const ashbyListCandidatesDefinition: ActionTemplate = {
  description: "Lists all candidates",
  scopes: [],
  output: {
    type: "object",
    required: ["candidates"],
    properties: {
      candidates: {
        type: "array",
        description: "A list of candidates",
      },
    },
  },
  name: "listCandidates",
  provider: "ashby",
};
export const ashbySearchCandidatesDefinition: ActionTemplate = {
  description: "Search for candidates by email and/or name.",
  scopes: [],
  parameters: {
    type: "object",
    required: [],
    properties: {
      email: {
        type: "string",
        description: "The email address of the candidate to search for",
      },
      name: {
        type: "string",
        description: "The name of the candidate to search for",
      },
    },
  },
  output: {
    type: "object",
    required: ["candidates"],
    properties: {
      candidates: {
        type: "array",
        description: "A list of candidates",
      },
    },
  },
  name: "searchCandidates",
  provider: "ashby",
};
export const ashbyListCandidateNotesDefinition: ActionTemplate = {
  description: "Lists all notes on a candidate",
  scopes: [],
  parameters: {
    type: "object",
    required: ["candidateId"],
    properties: {
      candidateId: {
        type: "string",
        description: "The ID of the candidate",
      },
    },
  },
  output: {
    type: "object",
    required: ["notes"],
    properties: {
      notes: {
        type: "array",
        description: "A list of notes",
      },
    },
  },
  name: "listCandidateNotes",
  provider: "ashby",
};
export const ashbyCreateCandidateDefinition: ActionTemplate = {
  description: "Creates a candidate",
  scopes: [],
  parameters: {
    type: "object",
    required: ["name"],
    properties: {
      name: {
        type: "string",
        description: "The first and last name of the candidate to be created.",
      },
      email: {
        type: "string",
        description: "Primary, personal email of the candidate to be created.",
      },
      phoneNumber: {
        type: "string",
        description: "Primary, personal phone number of the candidate to be created.",
      },
      linkedInUrl: {
        type: "string",
        description: "Url to the candidate's LinkedIn profile. Must be a valid Url.",
      },
      githubUrl: {
        type: "string",
        description: "Url to the candidate's Github profile. Must be a valid Url.",
      },
      website: {
        type: "string",
        description: "Url of the candidate's website. Must be a valid Url.",
      },
      alternateEmailAddresses: {
        type: "array",
        description: "Array of alternate email address to add to the candidate's profile.",
        items: {
          type: "string",
        },
      },
      sourceId: {
        type: "string",
        description: "The source to set on the candidate being created.",
      },
      creditedToUserId: {
        type: "string",
        description: "The id of the user the candidate will be credited to.",
      },
      location: {
        type: "object",
        description: "The location of the candidate.",
        properties: {
          city: {
            type: "string",
            description: "The city of the candidate.",
          },
          region: {
            type: "string",
            description: "The region of the candidate.",
          },
          country: {
            type: "string",
            description: "The country of the candidate.",
          },
        },
      },
    },
  },
  name: "createCandidate",
  provider: "ashby",
};
export const ashbyUpdateCandidateDefinition: ActionTemplate = {
  description: "Updates a candidate",
  scopes: [],
  parameters: {
    type: "object",
    required: ["candidateId"],
    properties: {
      candidateId: {
        type: "string",
        description: "The ID of the candidate to update",
      },
      name: {
        type: "string",
        description: "The first and last name of the candidate to update.",
      },
      email: {
        type: "string",
        description: "Primary, personal email of the candidate to update.",
      },
      phoneNumber: {
        type: "string",
        description: "Primary, personal phone number of the candidate to update.",
      },
      linkedInUrl: {
        type: "string",
        description: "Url to the candidate's LinkedIn profile. Must be a valid Url.",
      },
      githubUrl: {
        type: "string",
        description: "Url to the candidate's Github profile. Must be a valid Url.",
      },
      websiteUrl: {
        type: "string",
        description: "Url of the candidate's website. Must be a valid Url.",
      },
      alternateEmail: {
        type: "string",
        description: "An alternate email address to add to the candidate's profile.",
      },
      socialLinks: {
        type: "array",
        description:
          "An array of social links to set on the candidate. This value replaces existing socialLinks that have been set on the candidate.",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "The type of social link",
            },
            url: {
              type: "string",
              description: "The URL of the social link",
            },
          },
        },
      },
      sourceId: {
        type: "string",
        description: "The id of source for this candidate.",
      },
      creditedToUserId: {
        type: "string",
        description: "The id of the user the candidate will be credited to.",
      },
      location: {
        type: "object",
        description: "The location of the candidate.",
        properties: {
          city: {
            type: "string",
            description: "The city of the candidate",
          },
          region: {
            type: "string",
            description: "The region of the candidate",
          },
          country: {
            type: "string",
            description: "The country of the candidate",
          },
        },
      },
      createdAt: {
        type: "string",
        description: "An ISO date string to set the candidate's createdAt timestamp.",
      },
      sendNotifications: {
        type: "boolean",
        description:
          "Whether or not users who are subscribed to the candidate should be notified that candidate was updated. Default is true.",
      },
    },
  },
  name: "updateCandidate",
  provider: "ashby",
};
export const salesforceUpdateRecordDefinition: ActionTemplate = {
  description: "Update a record in Salesforce",
  scopes: [],
  parameters: {
    type: "object",
    required: ["objectType", "recordId", "fieldsToUpdate"],
    properties: {
      objectType: {
        type: "string",
        description: "The Salesforce object type to update (e.g., Lead, Account, Contact)",
      },
      recordId: {
        type: "string",
        description: "The ID of the record to update",
      },
      fieldsToUpdate: {
        type: "object",
        description:
          "A key,value pair where the keys are the fields to update on the record and the values are the new values of those fields.",
        additionalProperties: {
          type: "string",
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the record was successfully updated",
      },
      error: {
        type: "string",
        description: "The error that occurred if the record was not successfully updated",
      },
    },
  },
  name: "updateRecord",
  provider: "salesforce",
};
export const salesforceCreateRecordDefinition: ActionTemplate = {
  description: "Create a record in Salesforce",
  scopes: [],
  parameters: {
    type: "object",
    required: ["objectType"],
    properties: {
      objectType: {
        type: "string",
        description: "The Salesforce object type to create (e.g., Lead, Account, Contact)",
      },
      fieldsToCreate: {
        type: "object",
        description: "The fields to create on the record",
        additionalProperties: {
          type: "string",
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the record was successfully created",
      },
      recordId: {
        type: "string",
        description: "The ID of the created object",
      },
      error: {
        type: "string",
        description: "The error that occurred if the record was not successfully created",
      },
    },
  },
  name: "createRecord",
  provider: "salesforce",
};
export const salesforceCreateCaseDefinition: ActionTemplate = {
  description: "Create a case or support ticket in Salesforce",
  scopes: [],
  parameters: {
    type: "object",
    required: ["subject", "description", "priority", "origin"],
    properties: {
      subject: {
        type: "string",
        description: "The subject of the case",
      },
      description: {
        type: "string",
        description: "The detailed description of the case",
      },
      priority: {
        type: "string",
        description: "The priority of the case (e.g., High, Medium, Low)",
      },
      origin: {
        type: "string",
        description: "The origin of the case (e.g., Phone, Email, Web)",
      },
      customFields: {
        type: "object",
        description: "Additional custom fields to set on the case",
        additionalProperties: {
          type: "string",
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the case was successfully created",
      },
      caseId: {
        type: "string",
        description: "The ID of the created case",
      },
      error: {
        type: "string",
        description: "The error that occurred if the case was not successfully created",
      },
    },
  },
  name: "createCase",
  provider: "salesforce",
};
export const salesforceGenerateSalesReportDefinition: ActionTemplate = {
  description: "Generate a sales report from Salesforce",
  scopes: [],
  parameters: {
    type: "object",
    required: ["startDate", "endDate"],
    properties: {
      startDate: {
        type: "string",
        description: "The start date for the sales report in ISO 8601 format (e.g., 2025-01-01).",
      },
      endDate: {
        type: "string",
        description: "The end date for the sales report in ISO 8601 format (e.g., 2025-01-31).",
      },
      filters: {
        type: "object",
        description: "Additional filters for the sales report (e.g., by region, product).",
        additionalProperties: {
          type: "string",
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the sales report was successfully generated.",
      },
      reportData: {
        type: "array",
        description: "The data of the sales report.",
        items: {
          type: "object",
          description: "A row in the sales report.",
          additionalProperties: {
            type: "string",
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the sales report was not successfully generated.",
      },
    },
  },
  name: "generateSalesReport",
  provider: "salesforce",
};
export const salesforceGetSalesforceRecordsByQueryDefinition: ActionTemplate = {
  description: "Retrieve Salesforce records by SOQL query",
  scopes: [],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "The SOQL query to execute",
      },
      limit: {
        type: "number",
        description: "The maximum number of records to retrieve",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the records were successfully retrieved",
      },
      records: {
        type: "array",
        description: "The retrieved records",
        items: {
          type: "object",
          description: "A record from Salesforce",
          additionalProperties: {
            type: "string",
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the records were not successfully retrieved",
      },
    },
  },
  name: "getSalesforceRecordsByQuery",
  provider: "salesforce",
};
export const salesforceGetRecordDefinition: ActionTemplate = {
  description: "Retrieve a record from Salesforce",
  scopes: [],
  parameters: {
    type: "object",
    required: ["objectType", "recordId"],
    properties: {
      objectType: {
        type: "string",
        description: "The Salesforce object type to retrieve (e.g., Lead, Account, Contact)",
      },
      recordId: {
        type: "string",
        description: "The ID of the record to retrieve",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the record was successfully retrieved",
      },
      record: {
        type: "object",
        description: "The retrieved record data",
        additionalProperties: {
          type: "string",
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the record was not successfully retrieved",
      },
    },
  },
  name: "getRecord",
  provider: "salesforce",
};
export const salesforceFetchSalesforceSchemaByObjectDefinition: ActionTemplate = {
  description: "Fetch the schema of a Salesforce object",
  scopes: [],
  parameters: {
    type: "object",
    required: ["objectType"],
    properties: {
      objectType: {
        type: "string",
        description: "The Salesforce object type to fetch the schema for (e.g., Lead, Account, Contact)",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the schema was successfully retrieved",
      },
      schema: {
        type: "object",
        description: "The retrieved schema data",
        additionalProperties: {
          type: "string",
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the schema was not successfully retrieved",
      },
    },
  },
  name: "fetchSalesforceSchemaByObject",
  provider: "salesforce",
};
export const microsoftCreateDocumentDefinition: ActionTemplate = {
  description: "Creates a new Office365 document",
  scopes: ["Files.ReadWrite", "Sites.Manage.All", "Sites.ReadWrite.All"],
  parameters: {
    type: "object",
    required: ["name", "content"],
    properties: {
      siteId: {
        type: "string",
        description: "The ID of the site where the document will be created",
      },
      name: {
        type: "string",
        description: "The name of the new document (include extension like .docx or .xlsx)",
      },
      content: {
        type: "string",
        description: "The content to add to the new document",
      },
      folderId: {
        type: "string",
        description: "The ID of the folder to create the document in (optional)",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      documentId: {
        type: "string",
        description: "The ID of the created document",
      },
      documentUrl: {
        type: "string",
        description: "The URL to access the created document",
      },
      fileName: {
        type: "string",
        description: "The name of the created document (could be sanitized version of the name)",
      },
      success: {
        type: "boolean",
        description: "Whether the document was created successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the document was not created successfully",
      },
    },
  },
  name: "createDocument",
  provider: "microsoft",
};
export const microsoftUpdateDocumentDefinition: ActionTemplate = {
  description: "Updates a Office365 document",
  scopes: ["Files.ReadWrite", "Sites.ReadWrite.All"],
  parameters: {
    type: "object",
    required: ["documentId", "content"],
    properties: {
      siteId: {
        type: "string",
        description: "The ID of the site where the document is located",
      },
      documentId: {
        type: "string",
        description: "The ID of the document",
      },
      content: {
        type: "string",
        description: "The new content to update in the document",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the document was updated successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the update was not successful",
      },
      documentUrl: {
        type: "string",
        description: "The URL to access the updated document",
      },
    },
  },
  name: "updateDocument",
  provider: "microsoft",
};
export const microsoftUpdateSpreadsheetDefinition: ActionTemplate = {
  description: "Updates a Microsoft Excel spreadsheet",
  scopes: ["Files.ReadWrite", "Sites.ReadWrite.All"],
  parameters: {
    type: "object",
    required: ["spreadsheetId", "range", "values"],
    properties: {
      spreadsheetId: {
        type: "string",
        description: "The ID of the spreadsheet to update",
      },
      range: {
        type: "string",
        description: 'The range of cells to update (e.g., "Sheet1!A1:B2")',
      },
      values: {
        type: "array",
        description: "The values to update in the specified range",
        items: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      siteId: {
        type: "string",
        description: "The ID of the site where the spreadsheet is located",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the spreadsheet was updated successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the update was not successful",
      },
      updatedRange: {
        type: "string",
        description: "The range that was updated in the spreadsheet",
      },
    },
  },
  name: "updateSpreadsheet",
  provider: "microsoft",
};
export const microsoftMessageTeamsChatDefinition: ActionTemplate = {
  description: "Sends a message to a Microsoft Teams chat",
  scopes: ["ChatMessage.Send"],
  parameters: {
    type: "object",
    required: ["chatId", "message"],
    properties: {
      chatId: {
        type: "string",
        description: "The chat ID of the Microsoft Teams chat",
      },
      message: {
        type: "string",
        description: "The text to be messaged to the chat",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the message was sent successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the message was not sent successfully",
      },
      messageId: {
        type: "string",
        description: "The ID of the message that was sent",
      },
    },
  },
  name: "messageTeamsChat",
  provider: "microsoft",
};
export const microsoftMessageTeamsChannelDefinition: ActionTemplate = {
  description: "Sends a message to a Microsoft Teams channel",
  scopes: ["ChannelMessage.Send"],
  parameters: {
    type: "object",
    required: ["teamId", "channelId", "message"],
    properties: {
      teamId: {
        type: "string",
        description: "The team ID of the Microsoft Teams channel",
      },
      channelId: {
        type: "string",
        description: "The channel ID of the Microsoft Teams channel",
      },
      message: {
        type: "string",
        description: "The text to be messaged to the channel",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the message was sent successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the message was not sent successfully",
      },
      messageId: {
        type: "string",
        description: "The ID of the message that was sent",
      },
    },
  },
  name: "messageTeamsChannel",
  provider: "microsoft",
};
export const microsoftGetDocumentDefinition: ActionTemplate = {
  description: "Retrieves the content of a Microsoft Office document",
  scopes: ["Files.ReadWrite", "Sites.ReadWrite.All"],
  parameters: {
    type: "object",
    required: ["documentId"],
    properties: {
      siteId: {
        type: "string",
        description: "The ID of the site where the document is located (optional for OneDrive)",
      },
      documentId: {
        type: "string",
        description: "The ID of the document to retrieve",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the document was successfully retrieved",
      },
      content: {
        type: "string",
        description: "The content of the document",
      },
      error: {
        type: "string",
        description: "The error that occurred if the document was not successfully retrieved",
      },
    },
  },
  name: "getDocument",
  provider: "microsoft",
};
export const githubCreateOrUpdateFileDefinition: ActionTemplate = {
  description: "Create or update a file in a GitHub repository",
  scopes: [],
  parameters: {
    type: "object",
    required: ["repositoryOwner", "repositoryName", "filePath", "branch", "fileContent", "commitMessage"],
    properties: {
      repositoryOwner: {
        type: "string",
        description: "The owner of the repository",
      },
      repositoryName: {
        type: "string",
        description: "The name of the repository",
      },
      filePath: {
        type: "string",
        description: "The path of the file to create or update",
      },
      branch: {
        type: "string",
        description: "The branch where the file will be created or updated",
      },
      fileContent: {
        type: "string",
        description: "The content of the file",
      },
      commitMessage: {
        type: "string",
        description: "The commit message for the operation",
      },
      noOverwrite: {
        type: "boolean",
        description: "Whether to prevent overwriting existing files",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the operation was successful",
      },
      error: {
        type: "string",
        description: "The error that occurred if the operation was not successful",
      },
      newCommitSha: {
        type: "string",
        description: "The SHA of the new commit created",
      },
      operation: {
        type: "string",
        description: "Indicates whether the file was created or updated",
        enum: ["created", "updated"],
      },
    },
  },
  name: "createOrUpdateFile",
  provider: "github",
};
export const githubCreateBranchDefinition: ActionTemplate = {
  description: "Create a new branch in a GitHub repository",
  scopes: [],
  parameters: {
    type: "object",
    required: ["repositoryOwner", "repositoryName", "branchName", "baseRefOrHash"],
    properties: {
      repositoryOwner: {
        type: "string",
        description: "The owner of the repository",
      },
      repositoryName: {
        type: "string",
        description: "The name of the repository",
      },
      branchName: {
        type: "string",
        description: "The name of the new branch to create",
      },
      baseRefOrHash: {
        type: "string",
        description: "The ref or hash of the base commit to create the new branch from",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the branch was created successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the branch was not created successfully",
      },
    },
  },
  name: "createBranch",
  provider: "github",
};
export const githubCreatePullRequestDefinition: ActionTemplate = {
  description: "Create a pull request in a GitHub repository",
  scopes: [],
  parameters: {
    type: "object",
    required: ["repositoryOwner", "repositoryName", "head", "base", "title"],
    properties: {
      repositoryOwner: {
        type: "string",
        description: "The owner of the repository",
      },
      repositoryName: {
        type: "string",
        description: "The name of the repository",
      },
      head: {
        type: "string",
        description:
          "The branch containing the changes to be merged (prefix with owner: if different from the repository owner)",
      },
      base: {
        type: "string",
        description: "The branch to merge the changes into",
      },
      title: {
        type: "string",
        description: "The title of the pull request",
      },
      description: {
        type: "string",
        description: "The description of the pull request",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the pull request was created successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the pull request was not created successfully",
      },
      pullRequestUrl: {
        type: "string",
        description: "The URL of the created pull request",
      },
      pullRequestNumber: {
        type: "number",
        description: "The number of the created pull request",
      },
    },
  },
  name: "createPullRequest",
  provider: "github",
};
export const githubListPullRequestsDefinition: ActionTemplate = {
  description: "List pull requests in a GitHub repository",
  scopes: [],
  parameters: {
    type: "object",
    required: ["repositoryOwner", "repositoryName"],
    properties: {
      repositoryOwner: {
        type: "string",
        description: "The owner of the repository",
      },
      repositoryName: {
        type: "string",
        description: "The name of the repository",
      },
      state: {
        type: "string",
        description: "The state of the pull requests to list (e.g., open, closed)",
      },
    },
  },
  output: {
    type: "object",
    required: ["pullRequests"],
    properties: {
      pullRequests: {
        type: "array",
        description: "A list of pull requests in the repository",
        items: {
          type: "object",
          properties: {
            number: {
              type: "number",
              description: "The number of the pull request",
            },
            title: {
              type: "string",
              description: "The title of the pull request",
            },
            state: {
              type: "string",
              description: "The state of the pull request (e.g., open, closed)",
            },
            url: {
              type: "string",
              description: "The URL of the pull request",
            },
            createdAt: {
              type: "string",
              description: "The date and time when the pull request was created",
            },
            updatedAt: {
              type: "string",
              description: "The date and time when the pull request was last updated",
            },
            user: {
              type: "object",
              properties: {
                login: {
                  type: "string",
                  description: "The username of the user who created the pull request",
                },
              },
            },
            description: {
              type: "string",
              description: "The description of the pull request",
            },
          },
        },
      },
    },
  },
  name: "listPullRequests",
  provider: "github",
};
export const notionSearchByTitleDefinition: ActionTemplate = {
  description: "Search Notion pages and databases by title",
  scopes: [],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "The query to search for in Notion titles",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the search was successful",
      },
      results: {
        type: "array",
        description: "List of matching Notion pages",
        items: {
          type: "object",
          required: ["id", "url"],
          properties: {
            id: {
              type: "string",
              description: "The Notion page ID",
            },
            title: {
              type: "string",
              description: "The page title",
              nullable: true,
            },
            url: {
              type: "string",
              description: "The URL to the Notion page",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "Error message if search failed",
      },
    },
  },
  name: "searchByTitle",
  provider: "notion",
};
export const jamfGetJamfFileVaultRecoveryKeyDefinition: ActionTemplate = {
  description: "Retrieves the FileVault2 recovery key for a specified computer",
  scopes: [],
  parameters: {
    type: "object",
    required: ["computerId"],
    properties: {
      computerId: {
        type: "string",
        description: "The computerId of the device to get the FileVault2 recovery key for",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the request was successful",
      },
      data: {
        type: "string",
        description: "The FileVault2 recovery key data",
      },
      error: {
        type: "string",
        description: "Error message if the request failed",
      },
    },
  },
  name: "getJamfFileVaultRecoveryKey",
  provider: "jamf",
};
export const jamfGetJamfComputerInventoryDefinition: ActionTemplate = {
  description: "Retrieves computer inventory information from Jamf",
  scopes: [],
  parameters: {
    type: "object",
    required: [],
    properties: {
      section: {
        type: "string",
        description: "Optional section parameter to filter inventory data",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the request was successful",
      },
      data: {
        type: "array",
        description: "The computer inventory data",
      },
      error: {
        type: "string",
        description: "Error message if the request failed",
      },
    },
  },
  name: "getJamfComputerInventory",
  provider: "jamf",
};
