import { z } from "zod";

export type ActionFunction<P, A, O> = (input: { params: P; authParams: A }) => Promise<O>;

export const AuthParamsSchema = z.object({
  authToken: z.string().optional(),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  userAgent: z.string().optional(),
  emailFrom: z.string().optional(),
  emailReplyTo: z.string().optional(),
  emailBcc: z.string().optional(),
  cloudId: z.string().optional(),
  subdomain: z.string().optional(),
  password: z.string().optional(),
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  tenantId: z.string().optional(),
  refreshToken: z.string().optional(),
  redirectUri: z.string().optional(),
});

export type AuthParamsType = z.infer<typeof AuthParamsSchema>;

export const genericFillTemplateParamsSchema = z.object({
  template: z.string().describe("The template string to be processed and returned"),
});

export type genericFillTemplateParamsType = z.infer<typeof genericFillTemplateParamsSchema>;

export const genericFillTemplateOutputSchema = z.object({
  result: z.string().describe("The template string returned filled in"),
});

export type genericFillTemplateOutputType = z.infer<typeof genericFillTemplateOutputSchema>;
export type genericFillTemplateFunction = ActionFunction<
  genericFillTemplateParamsType,
  AuthParamsType,
  genericFillTemplateOutputType
>;

export const asanaCommentTaskParamsSchema = z.object({
  taskId: z.string().describe("Task gid the comment should be added to"),
  commentText: z.string().describe("The comment text to be added"),
  isPinned: z.boolean().describe("Whether the comment should be pinned").optional(),
});

export type asanaCommentTaskParamsType = z.infer<typeof asanaCommentTaskParamsSchema>;

export const asanaCommentTaskOutputSchema = z.object({
  error: z.string().describe("Error if comment was unsuccessful").optional(),
  success: z.boolean().describe("Whether comment was successfully made"),
  commentUrl: z.string().describe("The url to the created comment").optional(),
});

export type asanaCommentTaskOutputType = z.infer<typeof asanaCommentTaskOutputSchema>;
export type asanaCommentTaskFunction = ActionFunction<
  asanaCommentTaskParamsType,
  AuthParamsType,
  asanaCommentTaskOutputType
>;

export const asanaListAsanaTasksByProjectParamsSchema = z.object({
  projectId: z.string().describe("Project gid the tasks belong to"),
});

export type asanaListAsanaTasksByProjectParamsType = z.infer<typeof asanaListAsanaTasksByProjectParamsSchema>;

export const asanaListAsanaTasksByProjectOutputSchema = z.object({
  error: z.string().describe("Error if task retrieval was unsuccessful").optional(),
  success: z.boolean().describe("Whether task retrieval was successful"),
  tasks: z
    .array(
      z
        .object({
          task: z.object({
            name: z.string().optional(),
            resource_type: z.string().optional(),
            completed: z.boolean().optional(),
            modified_at: z.string().optional(),
            notes: z.string().optional(),
            custom_fields: z
              .array(
                z.object({
                  gid: z.string().optional(),
                  name: z.string().optional(),
                  display_value: z.string().nullable().optional(),
                }),
              )
              .nullable()
              .optional(),
            num_subtasks: z.number().optional(),
          }),
          subtasks: z
            .array(
              z.object({
                name: z.string().optional(),
                resource_type: z.string().optional(),
                completed: z.boolean().optional(),
                modified_at: z.string().optional(),
                notes: z.string().optional(),
                assignee: z.string().optional(),
                custom_fields: z
                  .array(
                    z.object({
                      gid: z.string().optional(),
                      name: z.string().optional(),
                      display_value: z.string().nullable().optional(),
                    }),
                  )
                  .nullable()
                  .optional(),
                num_subtasks: z.number().optional(),
              }),
            )
            .nullable()
            .optional(),
          taskStories: z
            .array(
              z.object({
                gid: z.string().optional(),
                created_at: z.string().optional(),
                text: z.string().optional(),
                resource_type: z.string().optional(),
                created_by: z
                  .object({
                    gid: z.string().optional(),
                    name: z.string().optional(),
                    resource_type: z.string().optional(),
                  })
                  .optional(),
              }),
            )
            .nullable()
            .optional(),
        })
        .describe("A task in the project"),
    )
    .describe("The list of tasks in the project")
    .optional(),
});

export type asanaListAsanaTasksByProjectOutputType = z.infer<typeof asanaListAsanaTasksByProjectOutputSchema>;
export type asanaListAsanaTasksByProjectFunction = ActionFunction<
  asanaListAsanaTasksByProjectParamsType,
  AuthParamsType,
  asanaListAsanaTasksByProjectOutputType
>;

export const asanaCreateTaskParamsSchema = z.object({
  projectId: z.string().describe("Project gid the task belongs to"),
  name: z.string().describe("The name of the new task"),
  approvalStatus: z.string().describe("Status of task (pending, approved, ...)").optional(),
  description: z.string().describe("The description for the new task").optional(),
  dueAt: z.string().describe("ISO 8601 date string in UTC for due date of task").optional(),
  assignee: z.string().describe("The assignee gid or email for the new task").optional(),
  taskTemplate: z.string().describe("The template to use, takes id or name").optional(),
  customFields: z
    .object({})
    .catchall(z.any())
    .describe("Custom fields to be set on the create task request")
    .optional(),
});

export type asanaCreateTaskParamsType = z.infer<typeof asanaCreateTaskParamsSchema>;

export const asanaCreateTaskOutputSchema = z.object({
  error: z.string().describe("Error if task creation was unsuccessful").optional(),
  success: z.boolean().describe("Whether task creation was successful"),
  taskUrl: z.string().describe("The url to the created Asana task").optional(),
});

export type asanaCreateTaskOutputType = z.infer<typeof asanaCreateTaskOutputSchema>;
export type asanaCreateTaskFunction = ActionFunction<
  asanaCreateTaskParamsType,
  AuthParamsType,
  asanaCreateTaskOutputType
>;

export const asanaUpdateTaskParamsSchema = z.object({
  taskId: z.string().describe("Task gid of the task to update"),
  name: z.string().describe("The name of the task").optional(),
  approvalStatus: z.string().describe("Status of task (pending, approved, ...)").optional(),
  description: z.string().describe("The updated description").optional(),
  dueAt: z.string().describe("ISO 8601 date string in UTC for due date of task").optional(),
  assignee: z.string().describe("The assignee gid or email for the task").optional(),
  completed: z.boolean().describe("Whether the task should be marked as completed").optional(),
  customFields: z.object({}).catchall(z.any()).describe("Custom fields to be updated").optional(),
});

export type asanaUpdateTaskParamsType = z.infer<typeof asanaUpdateTaskParamsSchema>;

export const asanaUpdateTaskOutputSchema = z.object({
  error: z.string().describe("Error if task update was unsuccessful").optional(),
  success: z.boolean().describe("Whether task update was successful"),
  taskUrl: z.string().describe("The url to the updated Asana task").optional(),
});

export type asanaUpdateTaskOutputType = z.infer<typeof asanaUpdateTaskOutputSchema>;
export type asanaUpdateTaskFunction = ActionFunction<
  asanaUpdateTaskParamsType,
  AuthParamsType,
  asanaUpdateTaskOutputType
>;

export const asanaSearchTasksParamsSchema = z.object({ query: z.string().describe("Search query") });

export type asanaSearchTasksParamsType = z.infer<typeof asanaSearchTasksParamsSchema>;

export const asanaSearchTasksOutputSchema = z.object({
  error: z.string().describe("Error if search was unsuccessful").optional(),
  success: z.boolean().describe("Whether search was successful"),
  results: z
    .array(
      z
        .object({ id: z.string(), name: z.string(), resourceType: z.string().optional(), workspaceId: z.string() })
        .describe("List of tasks that match search query"),
    )
    .describe("The list of tasks that match search query")
    .optional(),
});

export type asanaSearchTasksOutputType = z.infer<typeof asanaSearchTasksOutputSchema>;
export type asanaSearchTasksFunction = ActionFunction<
  asanaSearchTasksParamsType,
  AuthParamsType,
  asanaSearchTasksOutputType
>;

export const asanaGetTasksDetailsParamsSchema = z.object({
  taskIds: z.array(z.string()).describe("The list of task ids to get details for"),
});

export type asanaGetTasksDetailsParamsType = z.infer<typeof asanaGetTasksDetailsParamsSchema>;

export const asanaGetTasksDetailsOutputSchema = z.object({
  errors: z.array(z.string()).describe("Errors if search was unsuccessful").optional(),
  success: z.boolean().describe("Whether search was successful"),
  results: z
    .array(
      z
        .object({
          id: z.string(),
          name: z.string(),
          approval_status: z.string(),
          completed: z.boolean(),
          created_at: z.string(),
          due_at: z.string().nullable().optional(),
          assignee_name: z.string(),
          notes: z.string(),
          comments: z.array(z.object({ text: z.string(), created_at: z.string(), creator_name: z.string() })),
        })
        .describe("List of tasks that match search query"),
    )
    .describe("The list of tasks that match search query")
    .optional(),
});

export type asanaGetTasksDetailsOutputType = z.infer<typeof asanaGetTasksDetailsOutputSchema>;
export type asanaGetTasksDetailsFunction = ActionFunction<
  asanaGetTasksDetailsParamsType,
  AuthParamsType,
  asanaGetTasksDetailsOutputType
>;

export const slackSendMessageParamsSchema = z.object({
  channelName: z.string().describe("The name of the Slack channel to send the message to (e.g. general, alerts)"),
  message: z.string().describe("The message content to send to Slack. Can include markdown formatting."),
});

export type slackSendMessageParamsType = z.infer<typeof slackSendMessageParamsSchema>;

export const slackSendMessageOutputSchema = z.object({
  success: z.boolean().describe("Whether the email was sent successfully"),
  error: z.string().describe("The error that occurred if the email was not sent successfully").optional(),
});

export type slackSendMessageOutputType = z.infer<typeof slackSendMessageOutputSchema>;
export type slackSendMessageFunction = ActionFunction<
  slackSendMessageParamsType,
  AuthParamsType,
  slackSendMessageOutputType
>;

export const slackGetChannelMessagesParamsSchema = z.object({
  channelName: z.string().describe("Name of the channel to summarize"),
  oldest: z.string().describe("Only messages after this Unix timestamp will be included in results"),
});

export type slackGetChannelMessagesParamsType = z.infer<typeof slackGetChannelMessagesParamsSchema>;

export const slackGetChannelMessagesOutputSchema = z.object({
  messages: z
    .array(
      z
        .object({
          user: z.string().describe("The user who sent the message"),
          text: z.string().describe("The text of the message"),
          ts: z.string().describe("The timestamp of the message"),
        })
        .describe("A message in the channel"),
    )
    .describe("The messages in the channel"),
});

export type slackGetChannelMessagesOutputType = z.infer<typeof slackGetChannelMessagesOutputSchema>;
export type slackGetChannelMessagesFunction = ActionFunction<
  slackGetChannelMessagesParamsType,
  AuthParamsType,
  slackGetChannelMessagesOutputType
>;

export const mathAddParamsSchema = z.object({
  a: z.number().describe("The first number to add"),
  b: z.number().describe("The second number to add"),
});

export type mathAddParamsType = z.infer<typeof mathAddParamsSchema>;

export const mathAddOutputSchema = z.object({ result: z.number().describe("The sum of the two numbers") });

export type mathAddOutputType = z.infer<typeof mathAddOutputSchema>;
export type mathAddFunction = ActionFunction<mathAddParamsType, AuthParamsType, mathAddOutputType>;

export const confluenceOverwritePageParamsSchema = z.object({
  pageId: z.string().describe("The page id for the page to add content to"),
  title: z.string().describe("The title of the page that should be updated"),
  content: z.string().describe("The new content for the page"),
});

export type confluenceOverwritePageParamsType = z.infer<typeof confluenceOverwritePageParamsSchema>;

export const confluenceOverwritePageOutputSchema = z.void();

export type confluenceOverwritePageOutputType = z.infer<typeof confluenceOverwritePageOutputSchema>;
export type confluenceOverwritePageFunction = ActionFunction<
  confluenceOverwritePageParamsType,
  AuthParamsType,
  confluenceOverwritePageOutputType
>;

export const confluenceFetchPageContentParamsSchema = z.object({
  pageId: z.string().describe("The ID of the page to fetch content from"),
});

export type confluenceFetchPageContentParamsType = z.infer<typeof confluenceFetchPageContentParamsSchema>;

export const confluenceFetchPageContentOutputSchema = z.object({
  pageId: z.string().describe("The ID of the page"),
  title: z.string().describe("The title of the page"),
  content: z.string().describe("The content of the page in storage format (HTML)"),
});

export type confluenceFetchPageContentOutputType = z.infer<typeof confluenceFetchPageContentOutputSchema>;
export type confluenceFetchPageContentFunction = ActionFunction<
  confluenceFetchPageContentParamsType,
  AuthParamsType,
  confluenceFetchPageContentOutputType
>;

export const jiraAssignJiraTicketParamsSchema = z.object({
  projectKey: z.string().describe("The key for the project you want to add it to"),
  assignee: z.string().describe("The assignee for the ticket, userID or email"),
  issueId: z.string().describe("The issue ID associated with the ticket to be assigned/re-assigned"),
});

export type jiraAssignJiraTicketParamsType = z.infer<typeof jiraAssignJiraTicketParamsSchema>;

export const jiraAssignJiraTicketOutputSchema = z.object({
  success: z.boolean().describe("Whether the ticket was successfully assigned/reassigned"),
  error: z
    .string()
    .describe("The error that occurred if the ticket was not successfully assigned/reassigned")
    .optional(),
  ticketUrl: z.string().describe("The url to the newly assigned/reassigned Jira ticket").optional(),
});

export type jiraAssignJiraTicketOutputType = z.infer<typeof jiraAssignJiraTicketOutputSchema>;
export type jiraAssignJiraTicketFunction = ActionFunction<
  jiraAssignJiraTicketParamsType,
  AuthParamsType,
  jiraAssignJiraTicketOutputType
>;

export const jiraCommentJiraTicketParamsSchema = z.object({
  projectKey: z.string().describe("The key for the project"),
  issueId: z.string().describe("The issue ID associated with the ticket to be commented on"),
  comment: z.string().describe("The text to be commented on the ticket"),
});

export type jiraCommentJiraTicketParamsType = z.infer<typeof jiraCommentJiraTicketParamsSchema>;

export const jiraCommentJiraTicketOutputSchema = z.object({
  success: z.boolean().describe("Whether the comment was sent successfully"),
  error: z.string().describe("The error that occurred if the comment was not sent successfully").optional(),
  commentUrl: z.string().describe("The url to the created Jira comment").optional(),
});

export type jiraCommentJiraTicketOutputType = z.infer<typeof jiraCommentJiraTicketOutputSchema>;
export type jiraCommentJiraTicketFunction = ActionFunction<
  jiraCommentJiraTicketParamsType,
  AuthParamsType,
  jiraCommentJiraTicketOutputType
>;

export const jiraCreateJiraTicketParamsSchema = z.object({
  projectKey: z.string().describe("The key for the project you want to add it to"),
  summary: z.string().describe("The summary of the new ticket"),
  description: z.string().describe("The description for the new ticket"),
  issueType: z.string().describe("The issue type of the new ticket"),
  reporter: z.string().describe("The reporter for the new ticket creation").optional(),
  assignee: z.string().describe("The assignee for the new ticket creation").optional(),
  customFields: z
    .object({})
    .catchall(z.any())
    .describe("Custom fields to be set on the create ticket request")
    .optional(),
});

export type jiraCreateJiraTicketParamsType = z.infer<typeof jiraCreateJiraTicketParamsSchema>;

export const jiraCreateJiraTicketOutputSchema = z.object({
  ticketUrl: z.string().describe("The url to the created Jira Ticket"),
});

export type jiraCreateJiraTicketOutputType = z.infer<typeof jiraCreateJiraTicketOutputSchema>;
export type jiraCreateJiraTicketFunction = ActionFunction<
  jiraCreateJiraTicketParamsType,
  AuthParamsType,
  jiraCreateJiraTicketOutputType
>;

export const jiraGetJiraTicketDetailsParamsSchema = z.object({
  projectKey: z.string().describe("The key for the project"),
  issueId: z.string().describe("The ID of the ticket"),
});

export type jiraGetJiraTicketDetailsParamsType = z.infer<typeof jiraGetJiraTicketDetailsParamsSchema>;

export const jiraGetJiraTicketDetailsOutputSchema = z.object({
  success: z.boolean().describe("Whether the status was updated successfully"),
  error: z.string().describe("The error that occurred if the retrieval was unsuccessful").optional(),
  data: z.object({}).catchall(z.any()).describe("The data of the Jira ticket").optional(),
});

export type jiraGetJiraTicketDetailsOutputType = z.infer<typeof jiraGetJiraTicketDetailsOutputSchema>;
export type jiraGetJiraTicketDetailsFunction = ActionFunction<
  jiraGetJiraTicketDetailsParamsType,
  AuthParamsType,
  jiraGetJiraTicketDetailsOutputType
>;

export const jiraGetJiraTicketHistoryParamsSchema = z.object({
  projectKey: z.string().describe("The key for the project"),
  issueId: z.string().describe("The ID of the ticket"),
});

export type jiraGetJiraTicketHistoryParamsType = z.infer<typeof jiraGetJiraTicketHistoryParamsSchema>;

export const jiraGetJiraTicketHistoryOutputSchema = z.object({
  success: z.boolean().describe("Whether the status was updated successfully"),
  error: z.string().describe("The error that occurred if the retrieval was unsuccessful").optional(),
  history: z.array(z.any()).describe("The history data of the Jira ticket").optional(),
});

export type jiraGetJiraTicketHistoryOutputType = z.infer<typeof jiraGetJiraTicketHistoryOutputSchema>;
export type jiraGetJiraTicketHistoryFunction = ActionFunction<
  jiraGetJiraTicketHistoryParamsType,
  AuthParamsType,
  jiraGetJiraTicketHistoryOutputType
>;

export const jiraUpdateJiraTicketDetailsParamsSchema = z.object({
  projectKey: z.string().describe("The key for the project you want to add it to"),
  issueId: z.string().describe("The issue ID associated with the ticket to be updated"),
  summary: z.string().describe("The updated summary").optional(),
  description: z.string().describe("The updated description").optional(),
  issueType: z.string().describe("The updated issue type").optional(),
  customFields: z
    .object({})
    .catchall(z.any())
    .describe("Custom fields to be set on the update ticket request")
    .optional(),
});

export type jiraUpdateJiraTicketDetailsParamsType = z.infer<typeof jiraUpdateJiraTicketDetailsParamsSchema>;

export const jiraUpdateJiraTicketDetailsOutputSchema = z.object({
  ticketUrl: z.string().describe("The url to the Jira ticket"),
});

export type jiraUpdateJiraTicketDetailsOutputType = z.infer<typeof jiraUpdateJiraTicketDetailsOutputSchema>;
export type jiraUpdateJiraTicketDetailsFunction = ActionFunction<
  jiraUpdateJiraTicketDetailsParamsType,
  AuthParamsType,
  jiraUpdateJiraTicketDetailsOutputType
>;

export const jiraUpdateJiraTicketStatusParamsSchema = z.object({
  projectKey: z.string().describe("The key for the project you want to add it to"),
  issueId: z.string().describe("The issue ID associated with the ticket"),
  status: z.string().describe('The status the ticket should be changed to (eg "In Progress", "Closed")'),
});

export type jiraUpdateJiraTicketStatusParamsType = z.infer<typeof jiraUpdateJiraTicketStatusParamsSchema>;

export const jiraUpdateJiraTicketStatusOutputSchema = z.object({
  success: z.boolean().describe("Whether the status was updated successfully"),
  error: z.string().describe("The error that occurred if the status was not updated successfully").optional(),
  ticketUrl: z.string().describe("The url to the Jira ticket").optional(),
});

export type jiraUpdateJiraTicketStatusOutputType = z.infer<typeof jiraUpdateJiraTicketStatusOutputSchema>;
export type jiraUpdateJiraTicketStatusFunction = ActionFunction<
  jiraUpdateJiraTicketStatusParamsType,
  AuthParamsType,
  jiraUpdateJiraTicketStatusOutputType
>;

export const jiraGetJiraIssuesByQueryParamsSchema = z.object({
  query: z.string().describe("The JQL query to execute"),
  limit: z.number().describe("The maximum number of records to retrieve").optional(),
});

export type jiraGetJiraIssuesByQueryParamsType = z.infer<typeof jiraGetJiraIssuesByQueryParamsSchema>;

export const jiraGetJiraIssuesByQueryOutputSchema = z.object({
  success: z.boolean().describe("Whether the records were successfully retrieved"),
  records: z.array(z.record(z.string()).describe("An issue from Jira")).describe("The retrieved records").optional(),
  error: z.string().describe("The error that occurred if the records were not successfully retrieved").optional(),
});

export type jiraGetJiraIssuesByQueryOutputType = z.infer<typeof jiraGetJiraIssuesByQueryOutputSchema>;
export type jiraGetJiraIssuesByQueryFunction = ActionFunction<
  jiraGetJiraIssuesByQueryParamsType,
  AuthParamsType,
  jiraGetJiraIssuesByQueryOutputType
>;

export const kandjiGetFVRecoveryKeyForDeviceParamsSchema = z.object({
  userEmail: z.string().describe("The email of the user requesting the recovery key"),
  subdomain: z.string().describe("The subdomain of the Kandji account"),
});

export type kandjiGetFVRecoveryKeyForDeviceParamsType = z.infer<typeof kandjiGetFVRecoveryKeyForDeviceParamsSchema>;

export const kandjiGetFVRecoveryKeyForDeviceOutputSchema = z.object({
  success: z.boolean().describe("Whether the recovery key was retrieved successfully"),
  recoveryKey: z.string().describe("The FileVault recovery key for the device").optional(),
  error: z.string().describe("The error that occurred if the recovery key was not retrieved successfully").optional(),
});

export type kandjiGetFVRecoveryKeyForDeviceOutputType = z.infer<typeof kandjiGetFVRecoveryKeyForDeviceOutputSchema>;
export type kandjiGetFVRecoveryKeyForDeviceFunction = ActionFunction<
  kandjiGetFVRecoveryKeyForDeviceParamsType,
  AuthParamsType,
  kandjiGetFVRecoveryKeyForDeviceOutputType
>;

export const googlemapsValidateAddressParamsSchema = z.object({
  regionCode: z.string().describe("The country of the address being verified."),
  locality: z.string().describe("The locality of the address being verified. This is likely a city."),
  postalCode: z.string().describe("The postal code of the address being verified."),
  addressLines: z
    .array(z.string())
    .describe("A list of lines of the address. These should be in order as they would appear on an envelope."),
  addressType: z.enum(["residential", "business", "poBox"]).describe("The type of address being validated.").optional(),
  allowFuzzyMatches: z
    .boolean()
    .describe("Whether to allow fuzzy matches in the address validation by inferring components.")
    .optional(),
});

export type googlemapsValidateAddressParamsType = z.infer<typeof googlemapsValidateAddressParamsSchema>;

export const googlemapsValidateAddressOutputSchema = z.object({
  valid: z.boolean().describe("Whether the address is valid."),
  formattedAddress: z.string().describe("The standardized formatted address.").optional(),
  addressComponents: z
    .array(
      z.object({
        componentName: z.string().describe("The name of the address component.").optional(),
        componentType: z
          .array(z.string())
          .describe("The types associated with this component (e.g., street_number, route).")
          .optional(),
      }),
    )
    .describe("Components of the address, such as street number and route.")
    .optional(),
  missingComponentTypes: z.array(z.string()).describe("List of components missing in the input address.").optional(),
  unresolvedTokens: z.array(z.string()).describe("Unrecognized parts of the address.").optional(),
  geocode: z
    .object({
      location: z
        .object({
          latitude: z.number().describe("The latitude of the address.").optional(),
          longitude: z.number().describe("The longitude of the address.").optional(),
        })
        .optional(),
      plusCode: z
        .object({
          globalCode: z.string().describe("The global Plus Code.").optional(),
          compoundCode: z.string().describe("The compound Plus Code.").optional(),
        })
        .describe("The Plus Code for the address.")
        .optional(),
      bounds: z
        .object({
          northeast: z.object({ latitude: z.number().optional(), longitude: z.number().optional() }).optional(),
          southwest: z.object({ latitude: z.number().optional(), longitude: z.number().optional() }).optional(),
        })
        .describe("The viewport bounds for the address.")
        .optional(),
    })
    .describe("Geocode data for the address.")
    .optional(),
  uspsData: z
    .object({
      standardizedAddress: z.object({}).catchall(z.any()).describe("The standardized USPS address.").optional(),
      deliveryPointValidation: z.string().describe("The USPS delivery point validation status.").optional(),
      uspsAddressPrecision: z.string().describe("The level of precision for the USPS address.").optional(),
    })
    .describe("USPS-specific validation details.")
    .optional(),
});

export type googlemapsValidateAddressOutputType = z.infer<typeof googlemapsValidateAddressOutputSchema>;
export type googlemapsValidateAddressFunction = ActionFunction<
  googlemapsValidateAddressParamsType,
  AuthParamsType,
  googlemapsValidateAddressOutputType
>;

export const googlemapsNearbysearchRestaurantsParamsSchema = z.object({
  latitude: z.number().describe("The latitude of the location to search nearby"),
  longitude: z.number().describe("The longitude of the location to search nearby"),
});

export type googlemapsNearbysearchRestaurantsParamsType = z.infer<typeof googlemapsNearbysearchRestaurantsParamsSchema>;

export const googlemapsNearbysearchRestaurantsOutputSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string().describe("The name of the place").optional(),
        address: z.string().describe("The address of the place").optional(),
        rating: z.number().describe("The rating of the place").optional(),
        priceLevel: z.string().describe("The price level of the place").optional(),
        openingHours: z.string().describe("The opening hours of the place").optional(),
        primaryType: z.string().describe("The primary type of the place").optional(),
        editorialSummary: z.string().describe("The editorial summary of the place").optional(),
        websiteUri: z.string().describe("The website URI of the place").optional(),
      }),
    )
    .describe("The results of the nearby search"),
});

export type googlemapsNearbysearchRestaurantsOutputType = z.infer<typeof googlemapsNearbysearchRestaurantsOutputSchema>;
export type googlemapsNearbysearchRestaurantsFunction = ActionFunction<
  googlemapsNearbysearchRestaurantsParamsType,
  AuthParamsType,
  googlemapsNearbysearchRestaurantsOutputType
>;

export const bingGetTopNSearchResultUrlsParamsSchema = z.object({
  query: z.string().describe("The query to search for"),
  count: z.number().describe("The number of results to return. Default is 5.").optional(),
  site: z
    .string()
    .describe(
      "The site to restrict the search to (by inserting site:<site.com> in the query). Examples include openai.com, github.com",
    )
    .optional(),
});

export type bingGetTopNSearchResultUrlsParamsType = z.infer<typeof bingGetTopNSearchResultUrlsParamsSchema>;

export const bingGetTopNSearchResultUrlsOutputSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string().describe("The name or title of the search result").optional(),
        url: z.string().describe("The URL of the search result").optional(),
      }),
    )
    .describe("The top five search result objects"),
});

export type bingGetTopNSearchResultUrlsOutputType = z.infer<typeof bingGetTopNSearchResultUrlsOutputSchema>;
export type bingGetTopNSearchResultUrlsFunction = ActionFunction<
  bingGetTopNSearchResultUrlsParamsType,
  AuthParamsType,
  bingGetTopNSearchResultUrlsOutputType
>;

export const credalCallCopilotParamsSchema = z.object({
  agentId: z.string().describe("The ID of the copilot to call"),
  query: z.string().describe("The query to ask Credal Copilot"),
  userEmail: z.string().describe("The email of the user sending or authorizing the query"),
});

export type credalCallCopilotParamsType = z.infer<typeof credalCallCopilotParamsSchema>;

export const credalCallCopilotOutputSchema = z.object({
  response: z.string().describe("The response from the Credal Copilot"),
  referencedSources: z
    .array(
      z
        .object({
          id: z.string().describe("The id of the source"),
          externalResourceId: z
            .object({
              externalResourceId: z.string().describe("The external resource id of the source"),
              resourceType: z.string().describe("The type of the resource"),
            })
            .describe("The external resource id of the source"),
          name: z.string().describe("The name of the source"),
          url: z.string().describe("The url of the source").optional(),
        })
        .describe("The source referenced in the response"),
    )
    .describe("The sources referenced in the response")
    .optional(),
  sourcesInDataContext: z
    .array(
      z
        .object({
          id: z.string().describe("The id of the source"),
          externalResourceId: z
            .object({
              externalResourceId: z.string().describe("The external resource id of the source"),
              resourceType: z.string().describe("The type of the resource"),
            })
            .describe("The external resource id of the source"),
          name: z.string().describe("The name of the source"),
          url: z.string().describe("The url of the source").optional(),
        })
        .describe("The source in the data context of the response"),
    )
    .describe("The sources in the data context of the response")
    .optional(),
  webSearchResults: z
    .array(
      z
        .object({
          title: z.string().describe("The title of the web search result"),
          url: z.string().describe("The url of the web search result"),
          contents: z.string().describe("The contents of the web search result").optional(),
        })
        .describe("The web search result in the response"),
    )
    .describe("The web search results in the response")
    .optional(),
});

export type credalCallCopilotOutputType = z.infer<typeof credalCallCopilotOutputSchema>;
export type credalCallCopilotFunction = ActionFunction<
  credalCallCopilotParamsType,
  AuthParamsType,
  credalCallCopilotOutputType
>;

export const zendeskCreateZendeskTicketParamsSchema = z.object({
  subject: z.string().describe("The subject of the ticket"),
  body: z.string().describe("The body of the ticket").optional(),
  subdomain: z.string().describe("The subdomain of the Zendesk account"),
});

export type zendeskCreateZendeskTicketParamsType = z.infer<typeof zendeskCreateZendeskTicketParamsSchema>;

export const zendeskCreateZendeskTicketOutputSchema = z.object({
  ticketId: z.string().describe("The ID of the ticket created"),
  ticketUrl: z.string().describe("The URL of the ticket created").optional(),
});

export type zendeskCreateZendeskTicketOutputType = z.infer<typeof zendeskCreateZendeskTicketOutputSchema>;
export type zendeskCreateZendeskTicketFunction = ActionFunction<
  zendeskCreateZendeskTicketParamsType,
  AuthParamsType,
  zendeskCreateZendeskTicketOutputType
>;

export const zendeskListZendeskTicketsParamsSchema = z.object({
  subdomain: z.string().describe("The subdomain of the Zendesk account"),
  status: z.string().describe("Filter tickets by status (new, open, pending, hold, solved, closed)").optional(),
});

export type zendeskListZendeskTicketsParamsType = z.infer<typeof zendeskListZendeskTicketsParamsSchema>;

export const zendeskListZendeskTicketsOutputSchema = z.object({
  tickets: z.array(z.object({}).catchall(z.any())).describe("List of tickets"),
  count: z.number().describe("Number of tickets found"),
});

export type zendeskListZendeskTicketsOutputType = z.infer<typeof zendeskListZendeskTicketsOutputSchema>;
export type zendeskListZendeskTicketsFunction = ActionFunction<
  zendeskListZendeskTicketsParamsType,
  AuthParamsType,
  zendeskListZendeskTicketsOutputType
>;

export const zendeskGetTicketDetailsParamsSchema = z.object({
  ticketId: z.string().describe("The ID of the ticket"),
  subdomain: z.string().describe("The subdomain of the Zendesk account"),
});

export type zendeskGetTicketDetailsParamsType = z.infer<typeof zendeskGetTicketDetailsParamsSchema>;

export const zendeskGetTicketDetailsOutputSchema = z.object({
  ticket: z.object({}).catchall(z.any()).describe("The details of the ticket"),
});

export type zendeskGetTicketDetailsOutputType = z.infer<typeof zendeskGetTicketDetailsOutputSchema>;
export type zendeskGetTicketDetailsFunction = ActionFunction<
  zendeskGetTicketDetailsParamsType,
  AuthParamsType,
  zendeskGetTicketDetailsOutputType
>;

export const zendeskUpdateTicketStatusParamsSchema = z.object({
  ticketId: z.string().describe("The ID of the ticket to update"),
  subdomain: z.string().describe("The subdomain of the Zendesk account"),
  status: z
    .string()
    .describe(
      'The state of the ticket. If your account has activated custom ticket statuses, this is the ticket\'s status category. Allowed values are "new", "open", "pending", "hold", "solved", or "closed".',
    ),
});

export type zendeskUpdateTicketStatusParamsType = z.infer<typeof zendeskUpdateTicketStatusParamsSchema>;

export const zendeskUpdateTicketStatusOutputSchema = z.void();

export type zendeskUpdateTicketStatusOutputType = z.infer<typeof zendeskUpdateTicketStatusOutputSchema>;
export type zendeskUpdateTicketStatusFunction = ActionFunction<
  zendeskUpdateTicketStatusParamsType,
  AuthParamsType,
  zendeskUpdateTicketStatusOutputType
>;

export const zendeskAddCommentToTicketParamsSchema = z.object({
  ticketId: z.string().describe("The ID of the ticket to update"),
  subdomain: z.string().describe("The subdomain of the Zendesk account"),
  comment: z
    .object({
      body: z.string().describe("The body of the comment"),
      public: z.boolean().describe("Whether the comment should be public").optional(),
    })
    .describe("The comment to add to the ticket"),
});

export type zendeskAddCommentToTicketParamsType = z.infer<typeof zendeskAddCommentToTicketParamsSchema>;

export const zendeskAddCommentToTicketOutputSchema = z.void();

export type zendeskAddCommentToTicketOutputType = z.infer<typeof zendeskAddCommentToTicketOutputSchema>;
export type zendeskAddCommentToTicketFunction = ActionFunction<
  zendeskAddCommentToTicketParamsType,
  AuthParamsType,
  zendeskAddCommentToTicketOutputType
>;

export const zendeskAssignTicketParamsSchema = z.object({
  ticketId: z.string().describe("The ID of the ticket to update"),
  subdomain: z.string().describe("The subdomain of the Zendesk account"),
  assigneeEmail: z.string().describe("The email address of the agent to assign the ticket to"),
});

export type zendeskAssignTicketParamsType = z.infer<typeof zendeskAssignTicketParamsSchema>;

export const zendeskAssignTicketOutputSchema = z.void();

export type zendeskAssignTicketOutputType = z.infer<typeof zendeskAssignTicketOutputSchema>;
export type zendeskAssignTicketFunction = ActionFunction<
  zendeskAssignTicketParamsType,
  AuthParamsType,
  zendeskAssignTicketOutputType
>;

export const linkedinCreateShareLinkedinPostUrlParamsSchema = z.object({
  text: z.string().describe("The text for the linkedin post").optional(),
  url: z.string().describe("The url for the linkedin post").optional(),
});

export type linkedinCreateShareLinkedinPostUrlParamsType = z.infer<
  typeof linkedinCreateShareLinkedinPostUrlParamsSchema
>;

export const linkedinCreateShareLinkedinPostUrlOutputSchema = z.object({
  linkedinUrl: z.string().describe("The share post linkedin URL"),
});

export type linkedinCreateShareLinkedinPostUrlOutputType = z.infer<
  typeof linkedinCreateShareLinkedinPostUrlOutputSchema
>;
export type linkedinCreateShareLinkedinPostUrlFunction = ActionFunction<
  linkedinCreateShareLinkedinPostUrlParamsType,
  AuthParamsType,
  linkedinCreateShareLinkedinPostUrlOutputType
>;

export const xCreateShareXPostUrlParamsSchema = z.object({
  text: z.string().describe("The text for the X(formerly twitter) post"),
  url: z.string().describe("The url for the X(formerly twitter) post").optional(),
  hashtag: z.array(z.string()).describe("List of hashtags to include in the X post").optional(),
  via: z.string().describe("The twitter username to associate with the tweet").optional(),
  inReplyTo: z.string().describe("The tweet ID to reply to").optional(),
});

export type xCreateShareXPostUrlParamsType = z.infer<typeof xCreateShareXPostUrlParamsSchema>;

export const xCreateShareXPostUrlOutputSchema = z.object({
  xUrl: z.string().describe("The share post X(formerly twitter) URL"),
});

export type xCreateShareXPostUrlOutputType = z.infer<typeof xCreateShareXPostUrlOutputSchema>;
export type xCreateShareXPostUrlFunction = ActionFunction<
  xCreateShareXPostUrlParamsType,
  AuthParamsType,
  xCreateShareXPostUrlOutputType
>;

export const mongoInsertMongoDocParamsSchema = z.object({
  databaseName: z.string().describe("Database to connect to"),
  collectionName: z.string().describe("Collection to insert the document into"),
  document: z.object({}).catchall(z.any()).describe("The document to insert"),
});

export type mongoInsertMongoDocParamsType = z.infer<typeof mongoInsertMongoDocParamsSchema>;

export const mongoInsertMongoDocOutputSchema = z.object({
  objectId: z.string().describe("The new ID of the document inserted"),
});

export type mongoInsertMongoDocOutputType = z.infer<typeof mongoInsertMongoDocOutputSchema>;
export type mongoInsertMongoDocFunction = ActionFunction<
  mongoInsertMongoDocParamsType,
  AuthParamsType,
  mongoInsertMongoDocOutputType
>;

export const snowflakeGetRowByFieldValueParamsSchema = z.object({
  databaseName: z.string().describe("The name of the database to query").optional(),
  tableName: z.string().describe("The name of the table to query"),
  fieldName: z.string().describe("The name of the field to query"),
  fieldValue: z.string().describe("The value of the field to query"),
  accountName: z.string().describe("The name of the Snowflake account").optional(),
  warehouse: z.string().describe("The warehouse to use").optional(),
});

export type snowflakeGetRowByFieldValueParamsType = z.infer<typeof snowflakeGetRowByFieldValueParamsSchema>;

export const snowflakeGetRowByFieldValueOutputSchema = z.object({
  row: z
    .object({
      id: z.string().describe("The ID of the row").optional(),
      rowContents: z.object({}).catchall(z.any()).describe("The contents of the row").optional(),
    })
    .describe("The row from the Snowflake table"),
});

export type snowflakeGetRowByFieldValueOutputType = z.infer<typeof snowflakeGetRowByFieldValueOutputSchema>;
export type snowflakeGetRowByFieldValueFunction = ActionFunction<
  snowflakeGetRowByFieldValueParamsType,
  AuthParamsType,
  snowflakeGetRowByFieldValueOutputType
>;

export const snowflakeRunSnowflakeQueryParamsSchema = z.object({
  databaseName: z.string().describe("The name of the database to query"),
  warehouse: z.string().describe("The warehouse to use for executing the query"),
  query: z.string().describe("The SQL query to execute"),
  accountName: z.string().describe("The name of the Snowflake account"),
  outputFormat: z.enum(["json", "csv"]).describe("The format of the output").optional(),
  limit: z.number().describe("A limit on the number of rows to return").optional(),
  codeInterpreterLimit: z
    .number()
    .describe(
      "A minimum number of rows required to pass to code interpreter for analysis and image generation (if enabled)",
    )
    .optional(),
  codeInterpreterImageGenLimit: z
    .number()
    .describe("A minimum number of rows required to pass to code interpreter for image generation only (if enabled)")
    .optional(),
});

export type snowflakeRunSnowflakeQueryParamsType = z.infer<typeof snowflakeRunSnowflakeQueryParamsSchema>;

export const snowflakeRunSnowflakeQueryOutputSchema = z.object({
  format: z.enum(["json", "csv"]).describe("The format of the output"),
  content: z.string().describe("The content of the query result (json)"),
  rowCount: z.number().describe("The number of rows returned by the query"),
  error: z.string().describe("The error that occurred if the query results failed or were limited").optional(),
});

export type snowflakeRunSnowflakeQueryOutputType = z.infer<typeof snowflakeRunSnowflakeQueryOutputSchema>;
export type snowflakeRunSnowflakeQueryFunction = ActionFunction<
  snowflakeRunSnowflakeQueryParamsType,
  AuthParamsType,
  snowflakeRunSnowflakeQueryOutputType
>;

export const openstreetmapGetLatitudeLongitudeFromLocationParamsSchema = z.object({
  location: z.string().describe("The location to get the latitude and longitude of"),
});

export type openstreetmapGetLatitudeLongitudeFromLocationParamsType = z.infer<
  typeof openstreetmapGetLatitudeLongitudeFromLocationParamsSchema
>;

export const openstreetmapGetLatitudeLongitudeFromLocationOutputSchema = z.object({
  results: z
    .array(
      z.object({
        latitude: z.number().describe("The latitude of the location"),
        longitude: z.number().describe("The longitude of the location"),
        display_name: z.string().describe("The display name of the location"),
      }),
    )
    .describe("The results of the query")
    .optional(),
});

export type openstreetmapGetLatitudeLongitudeFromLocationOutputType = z.infer<
  typeof openstreetmapGetLatitudeLongitudeFromLocationOutputSchema
>;
export type openstreetmapGetLatitudeLongitudeFromLocationFunction = ActionFunction<
  openstreetmapGetLatitudeLongitudeFromLocationParamsType,
  AuthParamsType,
  openstreetmapGetLatitudeLongitudeFromLocationOutputType
>;

export const nwsGetForecastForLocationParamsSchema = z.object({
  latitude: z.number().describe("The latitude of the location"),
  longitude: z.number().describe("The longitude of the location"),
  isoDate: z.string().describe("The date to get the forecast for, in ISO datetime format"),
});

export type nwsGetForecastForLocationParamsType = z.infer<typeof nwsGetForecastForLocationParamsSchema>;

export const nwsGetForecastForLocationOutputSchema = z.object({
  result: z
    .object({
      temperature: z.number().describe("The temperature at the location"),
      temperatureUnit: z.string().describe("The unit of temperature"),
      forecast: z.string().describe("The forecast for the location"),
    })
    .optional(),
});

export type nwsGetForecastForLocationOutputType = z.infer<typeof nwsGetForecastForLocationOutputSchema>;
export type nwsGetForecastForLocationFunction = ActionFunction<
  nwsGetForecastForLocationParamsType,
  AuthParamsType,
  nwsGetForecastForLocationOutputType
>;

export const firecrawlDeepResearchParamsSchema = z.object({
  query: z.string().describe("The query to search for"),
  maxDepth: z.number().describe("The maximum depth of the search").optional(),
  timeLimit: z.number().describe("The time limit for the search in seconds").optional(),
  maxUrls: z.number().describe("The maximum number of URLs to scrape").optional(),
});

export type firecrawlDeepResearchParamsType = z.infer<typeof firecrawlDeepResearchParamsSchema>;

export const firecrawlDeepResearchOutputSchema = z.object({
  finalAnalysis: z.string().describe("The content of the research"),
  sources: z
    .array(
      z.object({
        url: z.string().describe("The URL of the source"),
        title: z.string().describe("The title of the source"),
        description: z.string().describe("The description of the source").optional(),
      }),
    )
    .describe("The sources of the research"),
});

export type firecrawlDeepResearchOutputType = z.infer<typeof firecrawlDeepResearchOutputSchema>;
export type firecrawlDeepResearchFunction = ActionFunction<
  firecrawlDeepResearchParamsType,
  AuthParamsType,
  firecrawlDeepResearchOutputType
>;

export const firecrawlScrapeUrlParamsSchema = z.object({ url: z.string().describe("The URL to scrape") });

export type firecrawlScrapeUrlParamsType = z.infer<typeof firecrawlScrapeUrlParamsSchema>;

export const firecrawlScrapeUrlOutputSchema = z.object({ content: z.string().describe("The content of the URL") });

export type firecrawlScrapeUrlOutputType = z.infer<typeof firecrawlScrapeUrlOutputSchema>;
export type firecrawlScrapeUrlFunction = ActionFunction<
  firecrawlScrapeUrlParamsType,
  AuthParamsType,
  firecrawlScrapeUrlOutputType
>;

export const firecrawlScrapeTweetDataWithNitterParamsSchema = z.object({
  tweetUrl: z.string().describe("The url for the X(formerly twitter) post"),
});

export type firecrawlScrapeTweetDataWithNitterParamsType = z.infer<
  typeof firecrawlScrapeTweetDataWithNitterParamsSchema
>;

export const firecrawlScrapeTweetDataWithNitterOutputSchema = z.object({
  text: z.string().describe("The text in the tweet URL"),
});

export type firecrawlScrapeTweetDataWithNitterOutputType = z.infer<
  typeof firecrawlScrapeTweetDataWithNitterOutputSchema
>;
export type firecrawlScrapeTweetDataWithNitterFunction = ActionFunction<
  firecrawlScrapeTweetDataWithNitterParamsType,
  AuthParamsType,
  firecrawlScrapeTweetDataWithNitterOutputType
>;

export const resendSendEmailParamsSchema = z.object({
  to: z.string().describe("The email address to send the email to"),
  subject: z.string().describe("The subject of the email"),
  content: z.string().describe("The content of the email"),
});

export type resendSendEmailParamsType = z.infer<typeof resendSendEmailParamsSchema>;

export const resendSendEmailOutputSchema = z.object({
  success: z.boolean().describe("Whether the email was sent successfully"),
  error: z.string().describe("The error that occurred if the email was not sent successfully").optional(),
});

export type resendSendEmailOutputType = z.infer<typeof resendSendEmailOutputSchema>;
export type resendSendEmailFunction = ActionFunction<
  resendSendEmailParamsType,
  AuthParamsType,
  resendSendEmailOutputType
>;

export const googleOauthSearchFilesByKeywordsParamsSchema = z.object({
  keywords: z.array(z.string()).describe("List of keywords to search for in file contents."),
});

export type googleOauthSearchFilesByKeywordsParamsType = z.infer<typeof googleOauthSearchFilesByKeywordsParamsSchema>;

export const googleOauthSearchFilesByKeywordsOutputSchema = z.object({
  success: z.boolean().describe("Whether the search was successful"),
  files: z
    .array(
      z.object({
        id: z.string().describe("The file ID"),
        name: z.string().describe("The file name"),
        mimeType: z.string().describe("The MIME type of the file"),
        webViewLink: z.string().describe("The web link to view the file"),
      }),
    )
    .describe("List of files matching the search"),
  error: z.string().describe("Error message if search failed").optional(),
});

export type googleOauthSearchFilesByKeywordsOutputType = z.infer<typeof googleOauthSearchFilesByKeywordsOutputSchema>;
export type googleOauthSearchFilesByKeywordsFunction = ActionFunction<
  googleOauthSearchFilesByKeywordsParamsType,
  AuthParamsType,
  googleOauthSearchFilesByKeywordsOutputType
>;

export const googleOauthCreateNewGoogleDocParamsSchema = z.object({
  title: z.string().describe("The title of the new Google Doc"),
  content: z.string().describe("The content to add to the new Google Doc").optional(),
});

export type googleOauthCreateNewGoogleDocParamsType = z.infer<typeof googleOauthCreateNewGoogleDocParamsSchema>;

export const googleOauthCreateNewGoogleDocOutputSchema = z.object({
  documentId: z.string().describe("The ID of the created Google Doc"),
  documentUrl: z.string().describe("The URL to access the created Google Doc").optional(),
});

export type googleOauthCreateNewGoogleDocOutputType = z.infer<typeof googleOauthCreateNewGoogleDocOutputSchema>;
export type googleOauthCreateNewGoogleDocFunction = ActionFunction<
  googleOauthCreateNewGoogleDocParamsType,
  AuthParamsType,
  googleOauthCreateNewGoogleDocOutputType
>;

export const googleOauthUpdateDocParamsSchema = z.object({
  documentId: z.string().describe("The ID of the Google Doc to update"),
  requests: z
    .array(
      z
        .object({})
        .catchall(z.any())
        .and(
          z.any().superRefine((x, ctx) => {
            const schemas = [
              z.object({
                replaceAllText: z
                  .object({
                    replaceText: z.string().describe("The text that will replace the matched text"),
                    containsText: z
                      .object({
                        text: z.string().describe("The text to search for in the document"),
                        matchCase: z.boolean().describe("Whether the search should be case sensitive").optional(),
                      })
                      .describe("The text to search for"),
                  })
                  .describe("Replaces all instances of text matching a criteria"),
              }),
              z.object({
                insertText: z
                  .object({
                    text: z.string().describe("The text to insert"),
                    location: z
                      .object({
                        index: z
                          .number()
                          .int()
                          .describe("The zero-based index in the document where to insert the text"),
                      })
                      .describe("The location where the text will be inserted"),
                  })
                  .describe("Inserts text at a specific location"),
              }),
              z.object({
                updateTextStyle: z
                  .object({
                    textStyle: z
                      .object({
                        backgroundColor: z
                          .object({})
                          .catchall(z.any())
                          .describe("The background color of the text")
                          .optional(),
                        baselineOffset: z
                          .enum(["BASELINE_OFFSET_UNSPECIFIED", "NONE", "SUPERSCRIPT", "SUBSCRIPT"])
                          .describe("The text's vertical offset from its normal position")
                          .optional(),
                        bold: z.boolean().describe("Whether the text is bold").optional(),
                        fontSize: z
                          .object({
                            magnitude: z.number().describe("The font size in points").optional(),
                            unit: z.string().describe("The units for the font size").optional(),
                          })
                          .describe("The size of the text's font")
                          .optional(),
                        foregroundColor: z
                          .object({})
                          .catchall(z.any())
                          .describe("The foreground color of the text")
                          .optional(),
                        italic: z.boolean().describe("Whether the text is italicized").optional(),
                        link: z
                          .object({ url: z.string().describe("The URL of the link").optional() })
                          .describe("The hyperlink destination of the text")
                          .optional(),
                        strikethrough: z.boolean().describe("Whether the text is struck through").optional(),
                        underline: z.boolean().describe("Whether the text is underlined").optional(),
                        weightedFontFamily: z
                          .object({
                            fontFamily: z.string().describe("The font family of the text").optional(),
                            weight: z.number().int().describe("The weight of the font").optional(),
                          })
                          .describe("The font family and weight of the text")
                          .optional(),
                      })
                      .describe("The styles to set on the text"),
                    fields: z.string().describe("The fields that should be updated"),
                    range: z
                      .object({
                        startIndex: z.number().int().describe("The zero-based starting index of the range"),
                        endIndex: z.number().int().describe("The zero-based ending index of the range (exclusive)"),
                      })
                      .describe("The range of text to style")
                      .optional(),
                  })
                  .describe("Updates the styling of text"),
              }),
              z.object({
                deleteContentRange: z
                  .object({
                    range: z
                      .object({
                        startIndex: z.number().int().describe("The zero-based starting index of the range"),
                        endIndex: z.number().int().describe("The zero-based ending index of the range (exclusive)"),
                      })
                      .describe("The range of content to delete"),
                  })
                  .describe("Deletes content between two structural locations"),
              }),
              z.object({
                insertTableRow: z
                  .object({
                    tableCellLocation: z
                      .object({
                        tableStartLocation: z
                          .object({ index: z.number().int().describe("The zero-based index in the document") })
                          .describe("The location where the table starts"),
                        rowIndex: z.number().int().describe("The zero-based row index").optional(),
                        columnIndex: z.number().int().describe("The zero-based column index").optional(),
                      })
                      .describe("The location where the table row will be inserted"),
                    insertBelow: z.boolean().describe("Whether to insert the row below the reference row"),
                  })
                  .describe("Inserts a new table row"),
              }),
              z.object({
                insertTableColumn: z
                  .object({
                    tableCellLocation: z
                      .object({
                        tableStartLocation: z
                          .object({ index: z.number().int().describe("The zero-based index in the document") })
                          .describe("The location where the table starts"),
                        rowIndex: z.number().int().describe("The zero-based row index").optional(),
                        columnIndex: z.number().int().describe("The zero-based column index").optional(),
                      })
                      .describe("The location where the table column will be inserted"),
                    insertRight: z
                      .boolean()
                      .describe("Whether to insert the column to the right of the reference column"),
                  })
                  .describe("Inserts a new table column"),
              }),
              z.object({
                deleteTableRow: z
                  .object({
                    tableCellLocation: z
                      .object({
                        tableStartLocation: z
                          .object({ index: z.number().int().describe("The zero-based index in the document") })
                          .describe("The location where the table starts"),
                        rowIndex: z.number().int().describe("The zero-based row index").optional(),
                        columnIndex: z.number().int().describe("The zero-based column index").optional(),
                      })
                      .describe("The location of the row to delete"),
                  })
                  .describe("Deletes a table row"),
              }),
              z.object({
                deleteTableColumn: z
                  .object({
                    tableCellLocation: z
                      .object({
                        tableStartLocation: z
                          .object({ index: z.number().int().describe("The zero-based index in the document") })
                          .describe("The location where the table starts"),
                        rowIndex: z.number().int().describe("The zero-based row index").optional(),
                        columnIndex: z.number().int().describe("The zero-based column index").optional(),
                      })
                      .describe("The location of the column to delete"),
                  })
                  .describe("Deletes a table column"),
              }),
              z.object({
                updateParagraphStyle: z
                  .object({
                    range: z
                      .object({
                        startIndex: z.number().int().describe("The zero-based starting index of the range"),
                        endIndex: z.number().int().describe("The zero-based ending index of the range (exclusive)"),
                      })
                      .describe("The range of paragraphs to update"),
                    paragraphStyle: z
                      .object({
                        alignment: z
                          .enum(["ALIGNMENT_UNSPECIFIED", "START", "CENTER", "END", "JUSTIFIED"])
                          .describe("The text alignment")
                          .optional(),
                        direction: z
                          .enum(["CONTENT_DIRECTION_UNSPECIFIED", "LEFT_TO_RIGHT", "RIGHT_TO_LEFT"])
                          .describe("The text direction")
                          .optional(),
                        indentStart: z
                          .object({
                            magnitude: z.number().describe("The magnitude of indentation").optional(),
                            unit: z.string().describe("The units of indentation").optional(),
                          })
                          .describe("The amount of indentation for the paragraph")
                          .optional(),
                        indentEnd: z
                          .object({})
                          .catchall(z.any())
                          .describe("The amount of indentation from the end")
                          .optional(),
                        indentFirstLine: z
                          .object({})
                          .catchall(z.any())
                          .describe("The amount of indentation for the first line")
                          .optional(),
                        keepLinesTogether: z
                          .boolean()
                          .describe("Whether to keep all lines on the same page")
                          .optional(),
                        keepWithNext: z.boolean().describe("Whether to keep with the next paragraph").optional(),
                        lineSpacing: z.number().describe("The amount of space between lines").optional(),
                        spaceAbove: z
                          .object({})
                          .catchall(z.any())
                          .describe("The amount of space above the paragraph")
                          .optional(),
                        spaceBelow: z
                          .object({})
                          .catchall(z.any())
                          .describe("The amount of space below the paragraph")
                          .optional(),
                        spacingMode: z
                          .enum(["SPACING_MODE_UNSPECIFIED", "NEVER_COLLAPSE", "COLLAPSE_LISTS"])
                          .describe("The spacing mode")
                          .optional(),
                        tabStops: z
                          .array(
                            z.object({
                              offset: z.object({}).catchall(z.any()).describe("The offset of the tab stop").optional(),
                              alignment: z.string().describe("The alignment of the tab stop").optional(),
                            }),
                          )
                          .describe("The tab stops for the paragraph")
                          .optional(),
                      })
                      .describe("The styles to set on the paragraphs"),
                    fields: z.string().describe("The fields that should be updated"),
                  })
                  .describe("Updates the style of paragraphs"),
              }),
              z.object({
                createParagraphBullets: z
                  .object({
                    range: z
                      .object({
                        startIndex: z.number().int().describe("The zero-based starting index of the range"),
                        endIndex: z.number().int().describe("The zero-based ending index of the range (exclusive)"),
                      })
                      .describe("The range of paragraphs to bullet"),
                    bulletPreset: z
                      .enum([
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
                      ])
                      .describe("The preset type of bullet to use"),
                  })
                  .describe("Creates bullets for paragraphs"),
              }),
              z.object({
                deleteParagraphBullets: z
                  .object({
                    range: z
                      .object({
                        startIndex: z.number().int().describe("The zero-based starting index of the range"),
                        endIndex: z.number().int().describe("The zero-based ending index of the range (exclusive)"),
                      })
                      .describe("The range of paragraphs to remove bullets from"),
                  })
                  .describe("Deletes bullets from paragraphs"),
              }),
              z.object({
                insertPageBreak: z
                  .object({
                    location: z
                      .object({ index: z.number().int().describe("The zero-based index in the document") })
                      .describe("The location at which to insert the page break"),
                  })
                  .describe("Inserts a page break"),
              }),
              z.object({
                updateDocumentStyle: z
                  .object({
                    documentStyle: z
                      .object({
                        background: z
                          .object({})
                          .catchall(z.any())
                          .describe("The background of the document")
                          .optional(),
                        defaultHeaderId: z.string().describe("The ID of the default header").optional(),
                        defaultFooterId: z.string().describe("The ID of the default footer").optional(),
                        evenPageHeaderId: z.string().describe("The ID of the header used on even pages").optional(),
                        evenPageFooterId: z.string().describe("The ID of the footer used on even pages").optional(),
                        firstPageHeaderId: z
                          .string()
                          .describe("The ID of the header used on the first page")
                          .optional(),
                        firstPageFooterId: z
                          .string()
                          .describe("The ID of the footer used on the first page")
                          .optional(),
                        marginTop: z.object({}).catchall(z.any()).describe("The top page margin").optional(),
                        marginBottom: z.object({}).catchall(z.any()).describe("The bottom page margin").optional(),
                        marginRight: z.object({}).catchall(z.any()).describe("The right page margin").optional(),
                        marginLeft: z.object({}).catchall(z.any()).describe("The left page margin").optional(),
                        pageNumberStart: z
                          .number()
                          .int()
                          .describe("The page number from which to start counting")
                          .optional(),
                        pageSize: z
                          .object({
                            width: z.object({}).catchall(z.any()).describe("The width of the page").optional(),
                            height: z.object({}).catchall(z.any()).describe("The height of the page").optional(),
                          })
                          .describe("The size of the pages in the document")
                          .optional(),
                        useCustomHeaderFooterMargins: z
                          .boolean()
                          .describe("Whether to use custom margins for headers and footers")
                          .optional(),
                      })
                      .describe("The styles to set on the document"),
                    fields: z.string().describe("The fields that should be updated"),
                  })
                  .describe("Updates the style of the document"),
              }),
              z.object({
                createHeader: z
                  .object({
                    type: z
                      .enum(["HEADER_TYPE_UNSPECIFIED", "DEFAULT", "FIRST_PAGE", "EVEN_PAGE"])
                      .describe("The type of header to create"),
                  })
                  .describe("Creates a header"),
              }),
              z.object({
                createFooter: z
                  .object({
                    type: z
                      .enum(["FOOTER_TYPE_UNSPECIFIED", "DEFAULT", "FIRST_PAGE", "EVEN_PAGE"])
                      .describe("The type of footer to create"),
                  })
                  .describe("Creates a footer"),
              }),
              z.object({
                updateTableCellStyle: z
                  .object({
                    tableCellStyle: z
                      .object({
                        backgroundColor: z
                          .object({})
                          .catchall(z.any())
                          .describe("The background color of the cells")
                          .optional(),
                        borderBottom: z
                          .object({})
                          .catchall(z.any())
                          .describe("The bottom border of the cells")
                          .optional(),
                        borderLeft: z.object({}).catchall(z.any()).describe("The left border of the cells").optional(),
                        borderRight: z
                          .object({})
                          .catchall(z.any())
                          .describe("The right border of the cells")
                          .optional(),
                        borderTop: z.object({}).catchall(z.any()).describe("The top border of the cells").optional(),
                        columnSpan: z.number().int().describe("The number of columns that the cell spans").optional(),
                        contentAlignment: z
                          .string()
                          .describe("The alignment of the content within the cells")
                          .optional(),
                        paddingBottom: z
                          .object({})
                          .catchall(z.any())
                          .describe("The bottom padding of the cells")
                          .optional(),
                        paddingLeft: z
                          .object({})
                          .catchall(z.any())
                          .describe("The left padding of the cells")
                          .optional(),
                        paddingRight: z
                          .object({})
                          .catchall(z.any())
                          .describe("The right padding of the cells")
                          .optional(),
                        paddingTop: z.object({}).catchall(z.any()).describe("The top padding of the cells").optional(),
                        rowSpan: z.number().int().describe("The number of rows that the cell spans").optional(),
                      })
                      .describe("The style to apply to the cells"),
                    fields: z.string().describe("The fields that should be updated"),
                    tableRange: z
                      .object({
                        tableCellLocation: z
                          .object({
                            tableStartLocation: z
                              .object({ index: z.number().int().describe("The zero-based index in the document") })
                              .describe("The location where the table starts"),
                            rowIndex: z.number().int().describe("The zero-based row index").optional(),
                            columnIndex: z.number().int().describe("The zero-based column index").optional(),
                          })
                          .describe("The location of the table cell"),
                        rowSpan: z.number().int().describe("The number of rows that the range should span"),
                        columnSpan: z.number().int().describe("The number of columns that the range should span"),
                      })
                      .describe("The table range to apply the style to"),
                  })
                  .describe("Updates the style of table cells"),
              }),
              z.object({
                mergeTableCells: z
                  .object({
                    tableRange: z
                      .object({
                        tableCellLocation: z
                          .object({
                            tableStartLocation: z
                              .object({ index: z.number().int().describe("The zero-based index in the document") })
                              .describe("The location where the table starts"),
                            rowIndex: z.number().int().describe("The zero-based row index").optional(),
                            columnIndex: z.number().int().describe("The zero-based column index").optional(),
                          })
                          .describe("The location of the table cell"),
                        rowSpan: z.number().int().describe("The number of rows that the range should span"),
                        columnSpan: z.number().int().describe("The number of columns that the range should span"),
                      })
                      .describe("The table range to merge"),
                  })
                  .describe("Merges table cells together"),
              }),
              z.object({
                unmergeTableCells: z
                  .object({
                    tableRange: z
                      .object({
                        tableCellLocation: z
                          .object({
                            tableStartLocation: z
                              .object({ index: z.number().int().describe("The zero-based index in the document") })
                              .describe("The location where the table starts"),
                            rowIndex: z.number().int().describe("The zero-based row index").optional(),
                            columnIndex: z.number().int().describe("The zero-based column index").optional(),
                          })
                          .describe("The location of the table cell"),
                        rowSpan: z.number().int().describe("The number of rows that the range should span"),
                        columnSpan: z.number().int().describe("The number of columns that the range should span"),
                      })
                      .describe("The table range to unmerge"),
                  })
                  .describe("Unmerges merged table cells"),
              }),
              z.object({
                createNamedRange: z
                  .object({
                    name: z.string().describe("The name of the range"),
                    range: z
                      .object({
                        startIndex: z.number().int().describe("The zero-based starting index of the range"),
                        endIndex: z.number().int().describe("The zero-based ending index of the range (exclusive)"),
                      })
                      .describe("The range to name"),
                  })
                  .describe("Creates a named range"),
              }),
              z.object({
                deleteNamedRange: z
                  .object({ name: z.string().describe("The name of the range to delete") })
                  .describe("Deletes a named range"),
              }),
              z.object({
                replaceNamedRangeContent: z
                  .object({
                    name: z.string().describe("The name of the range to replace"),
                    text: z.string().describe("The text to replace with"),
                  })
                  .describe("Replaces the content of a named range"),
              }),
              z.object({
                insertInlineImage: z
                  .object({
                    location: z
                      .object({ index: z.number().int().describe("The zero-based index in the document") })
                      .describe("The location at which to insert the image"),
                    uri: z.string().describe("The image URI"),
                    objectSize: z
                      .object({
                        width: z.object({}).catchall(z.any()).describe("The width of the image").optional(),
                        height: z.object({}).catchall(z.any()).describe("The height of the image").optional(),
                      })
                      .describe("The size that the object should appear as in the document"),
                  })
                  .describe("Inserts an inline image at a specific location"),
              }),
              z.object({
                deleteHeader: z
                  .object({ headerId: z.string().describe("The ID of the header to delete") })
                  .describe("Deletes a header"),
              }),
              z.object({
                deleteFooter: z
                  .object({ footerId: z.string().describe("The ID of the footer to delete") })
                  .describe("Deletes a footer"),
              }),
            ];
            const errors = schemas.reduce<z.ZodError[]>(
              (errors, schema) => (result => (result.error ? [...errors, result.error] : errors))(schema.safeParse(x)),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          }),
        )
        .describe("A single update request that must contain exactly one of the following operations"),
    )
    .describe(
      "Array of requests to apply to the document. See https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#Request",
    )
    .optional(),
});

export type googleOauthUpdateDocParamsType = z.infer<typeof googleOauthUpdateDocParamsSchema>;

export const googleOauthUpdateDocOutputSchema = z.object({
  success: z.boolean().describe("Whether the document was updated successfully"),
  documentId: z.string().describe("The ID of the updated Google Doc").optional(),
  documentUrl: z.string().describe("The URL to access the updated Google Doc").optional(),
  error: z.string().describe("The error message if the update failed").optional(),
});

export type googleOauthUpdateDocOutputType = z.infer<typeof googleOauthUpdateDocOutputSchema>;
export type googleOauthUpdateDocFunction = ActionFunction<
  googleOauthUpdateDocParamsType,
  AuthParamsType,
  googleOauthUpdateDocOutputType
>;

export const googleOauthScheduleCalendarMeetingParamsSchema = z.object({
  calendarId: z.string().describe("The ID of the calendar to schedule the meeting on"),
  name: z.string().describe("The name of the meeting"),
  start: z.string().describe("The start time of the meeting"),
  end: z.string().describe("The end time of the meeting"),
  description: z.string().describe("The description of the meeting").optional(),
  attendees: z
    .array(z.string().describe("The email of the attendee"))
    .describe("The attendees of the meeting")
    .optional(),
  useGoogleMeet: z.boolean().describe("Whether to use Google Meet for the meeting").optional(),
});

export type googleOauthScheduleCalendarMeetingParamsType = z.infer<
  typeof googleOauthScheduleCalendarMeetingParamsSchema
>;

export const googleOauthScheduleCalendarMeetingOutputSchema = z.object({
  success: z.boolean().describe("Whether the meeting was scheduled successfully"),
  eventId: z.string().describe("The ID of the event that was scheduled").optional(),
  eventUrl: z.string().describe("The URL to access the scheduled event").optional(),
  error: z.string().describe("The error that occurred if the meeting was not scheduled successfully").optional(),
});

export type googleOauthScheduleCalendarMeetingOutputType = z.infer<
  typeof googleOauthScheduleCalendarMeetingOutputSchema
>;
export type googleOauthScheduleCalendarMeetingFunction = ActionFunction<
  googleOauthScheduleCalendarMeetingParamsType,
  AuthParamsType,
  googleOauthScheduleCalendarMeetingOutputType
>;

export const googleOauthListCalendarsParamsSchema = z.object({
  maxResults: z.number().int().describe("Maximum number of calendars to return, defaults to 250").optional(),
});

export type googleOauthListCalendarsParamsType = z.infer<typeof googleOauthListCalendarsParamsSchema>;

export const googleOauthListCalendarsOutputSchema = z.object({
  success: z.boolean().describe("Whether the calendars were listed successfully"),
  calendars: z
    .array(z.object({ id: z.string().describe("The calendar ID"), summary: z.string().describe("The calendar name") }))
    .describe("List of calendars"),
  error: z.string().describe("Error message if listing failed").optional(),
});

export type googleOauthListCalendarsOutputType = z.infer<typeof googleOauthListCalendarsOutputSchema>;
export type googleOauthListCalendarsFunction = ActionFunction<
  googleOauthListCalendarsParamsType,
  AuthParamsType,
  googleOauthListCalendarsOutputType
>;

export const googleOauthListCalendarEventsParamsSchema = z.object({
  calendarId: z.string().describe("The ID of the calendar to list events from"),
  query: z.string().describe("Optional free-text search query to filter events").optional(),
  maxResults: z.number().int().describe("Maximum number of events to return, defaults to 250").optional(),
});

export type googleOauthListCalendarEventsParamsType = z.infer<typeof googleOauthListCalendarEventsParamsSchema>;

export const googleOauthListCalendarEventsOutputSchema = z.object({
  success: z.boolean().describe("Whether the events were listed successfully"),
  events: z
    .array(
      z
        .object({
          id: z.string().describe("Event unique identifier").optional(),
          status: z.string().describe("Status of the event (e.g., confirmed, cancelled)").optional(),
          url: z.string().describe("Link to the event in the Google Calendar web UI").optional(),
          title: z.string().describe("Title of the event").optional(),
          description: z.string().describe("Description of the event").optional(),
          location: z.string().describe("Geographic location of the event as free-form text").optional(),
          start: z.string().describe("Start date/time (for timed events, RFC3339 timestamp)").optional(),
          end: z.string().describe("End date/time (for timed events, RFC3339 timestamp)").optional(),
          attendees: z
            .array(
              z.object({
                email: z.string().describe("The attendee's email address").optional(),
                displayName: z.string().describe("The attendee's name").optional(),
                responseStatus: z
                  .string()
                  .describe("The attendee's response status (accepted, declined, etc.)")
                  .optional(),
              }),
            )
            .describe("List of attendees")
            .optional(),
          organizer: z
            .object({
              email: z.string().describe("The organizer's email address").optional(),
              displayName: z.string().describe("The organizer's name").optional(),
            })
            .describe("The organizer of the event")
            .optional(),
          hangoutLink: z.string().describe("Google Meet link for the event, if available").optional(),
          created: z.string().describe("Creation time of the event (RFC3339 timestamp)").optional(),
          updated: z.string().describe("Last modification time of the event (RFC3339 timestamp)").optional(),
        })
        .describe("A calendar event"),
    )
    .describe("List of events"),
  error: z.string().describe("Error message if listing failed").optional(),
});

export type googleOauthListCalendarEventsOutputType = z.infer<typeof googleOauthListCalendarEventsOutputSchema>;
export type googleOauthListCalendarEventsFunction = ActionFunction<
  googleOauthListCalendarEventsParamsType,
  AuthParamsType,
  googleOauthListCalendarEventsOutputType
>;

export const googleOauthUpdateCalendarEventParamsSchema = z.object({
  calendarId: z.string().describe("The ID of the calendar containing the event"),
  eventId: z.string().describe("The ID of the event to update"),
  updates: z
    .object({
      title: z.string().describe("The new title of the event").optional(),
      description: z.string().describe("The new description of the event").optional(),
      start: z.string().describe("The new start date/time (RFC3339 timestamp)").optional(),
      end: z.string().describe("The new end date/time (RFC3339 timestamp)").optional(),
      location: z.string().describe("The new location of the event").optional(),
      attendees: z
        .array(z.string().describe("The email of the attendee"))
        .describe("The new list of attendees")
        .optional(),
      status: z.string().describe("The new status of the event (e.g., confirmed, cancelled)").optional(),
      organizer: z
        .object({
          email: z.string().describe("The organizer's email address").optional(),
          displayName: z.string().describe("The organizer's name").optional(),
        })
        .describe("The new organizer of the event")
        .optional(),
    })
    .describe("The fields to update on the event")
    .optional(),
});

export type googleOauthUpdateCalendarEventParamsType = z.infer<typeof googleOauthUpdateCalendarEventParamsSchema>;

export const googleOauthUpdateCalendarEventOutputSchema = z.object({
  success: z.boolean().describe("Whether the event was updated successfully"),
  eventId: z.string().describe("The ID of the updated event").optional(),
  eventUrl: z.string().describe("The URL to access the updated event").optional(),
  error: z.string().describe("The error that occurred if the event was not updated successfully").optional(),
});

export type googleOauthUpdateCalendarEventOutputType = z.infer<typeof googleOauthUpdateCalendarEventOutputSchema>;
export type googleOauthUpdateCalendarEventFunction = ActionFunction<
  googleOauthUpdateCalendarEventParamsType,
  AuthParamsType,
  googleOauthUpdateCalendarEventOutputType
>;

export const googleOauthDeleteCalendarEventParamsSchema = z.object({
  calendarId: z.string().describe("The ID of the calendar containing the event"),
  eventId: z.string().describe("The ID of the event to delete"),
});

export type googleOauthDeleteCalendarEventParamsType = z.infer<typeof googleOauthDeleteCalendarEventParamsSchema>;

export const googleOauthDeleteCalendarEventOutputSchema = z.object({
  success: z.boolean().describe("Whether the event was deleted successfully"),
  error: z.string().describe("The error that occurred if the event was not deleted successfully").optional(),
});

export type googleOauthDeleteCalendarEventOutputType = z.infer<typeof googleOauthDeleteCalendarEventOutputSchema>;
export type googleOauthDeleteCalendarEventFunction = ActionFunction<
  googleOauthDeleteCalendarEventParamsType,
  AuthParamsType,
  googleOauthDeleteCalendarEventOutputType
>;

export const googleOauthCreateSpreadsheetParamsSchema = z.object({
  title: z.string().describe("The title of the new spreadsheet"),
  sheets: z
    .array(
      z.object({
        title: z.string().describe("The title of the sheet").optional(),
        gridProperties: z
          .object({
            rowCount: z.number().int().describe("The number of rows in the sheet").optional(),
            columnCount: z.number().int().describe("The number of columns in the sheet").optional(),
            frozenRowCount: z.number().int().describe("The number of frozen rows").optional(),
            frozenColumnCount: z.number().int().describe("The number of frozen columns").optional(),
          })
          .optional(),
      }),
    )
    .describe("The initial sheets to create in the spreadsheet")
    .optional(),
  properties: z
    .object({
      locale: z.string().describe("The locale of the spreadsheet (e.g., en_US)").optional(),
      timeZone: z.string().describe("The time zone of the spreadsheet (e.g., America/New_York)").optional(),
      autoRecalc: z.enum(["ON_CHANGE", "MINUTE", "HOUR"]).describe("When to recalculate the spreadsheet").optional(),
    })
    .describe("Properties for the spreadsheet")
    .optional(),
});

export type googleOauthCreateSpreadsheetParamsType = z.infer<typeof googleOauthCreateSpreadsheetParamsSchema>;

export const googleOauthCreateSpreadsheetOutputSchema = z.object({
  success: z.boolean().describe("Whether the spreadsheet was created successfully"),
  spreadsheetId: z.string().describe("The ID of the created spreadsheet").optional(),
  spreadsheetUrl: z.string().describe("The URL to access the created spreadsheet").optional(),
  sheets: z
    .array(
      z.object({
        sheetId: z.number().int().describe("The ID of the sheet").optional(),
        title: z.string().describe("The title of the sheet").optional(),
        index: z.number().int().describe("The index of the sheet").optional(),
      }),
    )
    .describe("Information about the created sheets")
    .optional(),
  error: z.string().describe("The error that occurred if the spreadsheet was not created successfully").optional(),
});

export type googleOauthCreateSpreadsheetOutputType = z.infer<typeof googleOauthCreateSpreadsheetOutputSchema>;
export type googleOauthCreateSpreadsheetFunction = ActionFunction<
  googleOauthCreateSpreadsheetParamsType,
  AuthParamsType,
  googleOauthCreateSpreadsheetOutputType
>;

export const googleOauthUpdateSpreadsheetParamsSchema = z.object({
  spreadsheetId: z.string().describe("The ID of the Google Spreadsheet to update"),
  requests: z
    .array(
      z
        .object({})
        .catchall(z.any())
        .and(
          z.any().superRefine((x, ctx) => {
            const schemas = [
              z
                .object({
                  addSheet: z
                    .object({
                      properties: z
                        .object({
                          title: z.string().describe("The title of the new sheet").optional(),
                          gridProperties: z
                            .object({
                              rowCount: z.number().int().describe("The number of rows in the sheet").optional(),
                              columnCount: z.number().int().describe("The number of columns in the sheet").optional(),
                            })
                            .optional(),
                        })
                        .optional(),
                    })
                    .optional(),
                })
                .describe("Add or update a sheet"),
              z
                .object({
                  deleteSheet: z
                    .object({ sheetId: z.number().int().describe("The ID of the sheet to delete").optional() })
                    .optional(),
                })
                .describe("Delete a sheet"),
              z
                .object({
                  updateCells: z
                    .object({
                      range: z
                        .object({
                          sheetId: z.number().int().describe("The ID of the sheet").optional(),
                          startRowIndex: z.number().int().describe("The start row (0-based, inclusive)").optional(),
                          endRowIndex: z.number().int().describe("The end row (0-based, exclusive)").optional(),
                          startColumnIndex: z
                            .number()
                            .int()
                            .describe("The start column (0-based, inclusive)")
                            .optional(),
                          endColumnIndex: z.number().int().describe("The end column (0-based, exclusive)").optional(),
                        })
                        .optional(),
                      rows: z
                        .array(
                          z.object({
                            values: z
                              .array(
                                z.object({
                                  userEnteredValue: z
                                    .object({
                                      stringValue: z.string().optional(),
                                      numberValue: z.number().optional(),
                                      boolValue: z.boolean().optional(),
                                      formulaValue: z.string().optional(),
                                    })
                                    .optional(),
                                }),
                              )
                              .optional(),
                          }),
                        )
                        .optional(),
                    })
                    .optional(),
                })
                .describe("Update cells in a range"),
              z
                .object({
                  updateSheetProperties: z
                    .object({
                      properties: z
                        .object({
                          sheetId: z.number().int().describe("The ID of the sheet to update").optional(),
                          title: z.string().describe("The new title of the sheet").optional(),
                          gridProperties: z
                            .object({
                              rowCount: z.number().int().describe("The new number of rows").optional(),
                              columnCount: z.number().int().describe("The new number of columns").optional(),
                              frozenRowCount: z.number().int().describe("The number of frozen rows").optional(),
                              frozenColumnCount: z.number().int().describe("The number of frozen columns").optional(),
                            })
                            .optional(),
                        })
                        .optional(),
                      fields: z
                        .string()
                        .describe("The fields to update (comma-separated list using JSON field paths)")
                        .optional(),
                    })
                    .optional(),
                })
                .describe("Update sheet properties"),
              z
                .object({
                  updateSpreadsheetProperties: z
                    .object({
                      properties: z
                        .object({
                          title: z.string().describe("The title of the spreadsheet").optional(),
                          locale: z.string().describe("The locale of the spreadsheet (e.g., en_US)").optional(),
                          timeZone: z
                            .string()
                            .describe("The time zone of the spreadsheet (e.g., America/New_York)")
                            .optional(),
                          autoRecalc: z
                            .enum(["ON_CHANGE", "MINUTE", "HOUR"])
                            .describe("When to recalculate the spreadsheet")
                            .optional(),
                          defaultFormat: z
                            .object({
                              backgroundColor: z
                                .object({
                                  red: z.number().describe("The red component [0.0, 1.0]").optional(),
                                  green: z.number().describe("The green component [0.0, 1.0]").optional(),
                                  blue: z.number().describe("The blue component [0.0, 1.0]").optional(),
                                  alpha: z.number().describe("The alpha component [0.0, 1.0]").optional(),
                                })
                                .optional(),
                              numberFormat: z
                                .object({
                                  type: z
                                    .enum([
                                      "TEXT",
                                      "NUMBER",
                                      "PERCENT",
                                      "CURRENCY",
                                      "DATE",
                                      "TIME",
                                      "DATE_TIME",
                                      "SCIENTIFIC",
                                    ])
                                    .describe("The type of the number format")
                                    .optional(),
                                  pattern: z.string().describe("Pattern string used for formatting").optional(),
                                })
                                .optional(),
                              textFormat: z
                                .object({
                                  foregroundColor: z
                                    .object({
                                      red: z.number().describe("The red component [0.0, 1.0]").optional(),
                                      green: z.number().describe("The green component [0.0, 1.0]").optional(),
                                      blue: z.number().describe("The blue component [0.0, 1.0]").optional(),
                                      alpha: z.number().describe("The alpha component [0.0, 1.0]").optional(),
                                    })
                                    .optional(),
                                  fontFamily: z.string().describe("The font family").optional(),
                                  fontSize: z.number().int().describe("The size of the font in points").optional(),
                                  bold: z.boolean().describe("Whether the text is bold").optional(),
                                  italic: z.boolean().describe("Whether the text is italic").optional(),
                                  strikethrough: z
                                    .boolean()
                                    .describe("Whether the text has a strikethrough")
                                    .optional(),
                                  underline: z.boolean().describe("Whether the text is underlined").optional(),
                                })
                                .optional(),
                            })
                            .optional(),
                        })
                        .optional(),
                      fields: z
                        .string()
                        .describe("The fields to update (comma-separated list using JSON field paths)")
                        .optional(),
                    })
                    .optional(),
                })
                .describe("Update spreadsheet properties"),
            ];
            const errors = schemas.reduce<z.ZodError[]>(
              (errors, schema) => (result => (result.error ? [...errors, result.error] : errors))(schema.safeParse(x)),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          }),
        ),
    )
    .describe("The requests to update the spreadsheet with"),
});

export type googleOauthUpdateSpreadsheetParamsType = z.infer<typeof googleOauthUpdateSpreadsheetParamsSchema>;

export const googleOauthUpdateSpreadsheetOutputSchema = z.object({
  success: z.boolean().describe("Whether the spreadsheet was updated successfully"),
  spreadsheetUrl: z.string().describe("The URL of the updated spreadsheet").optional(),
  replies: z
    .array(
      z
        .object({})
        .catchall(z.any())
        .and(
          z
            .object({
              addSheet: z
                .object({
                  properties: z
                    .object({
                      sheetId: z.number().int().describe("The ID of the newly created sheet").optional(),
                      title: z.string().describe("The title of the new sheet").optional(),
                      index: z.number().int().describe("The index of the new sheet").optional(),
                    })
                    .optional(),
                })
                .optional(),
            })
            .describe("Reply to adding a sheet"),
        )
        .describe("The reply to a request"),
    )
    .describe("The replies to the requests")
    .optional(),
  error: z.string().describe("The error that occurred if the spreadsheet was not updated successfully").optional(),
});

export type googleOauthUpdateSpreadsheetOutputType = z.infer<typeof googleOauthUpdateSpreadsheetOutputSchema>;
export type googleOauthUpdateSpreadsheetFunction = ActionFunction<
  googleOauthUpdateSpreadsheetParamsType,
  AuthParamsType,
  googleOauthUpdateSpreadsheetOutputType
>;

export const googleOauthCreatePresentationParamsSchema = z.object({
  title: z.string().describe("The title of the presentation"),
  pageSize: z
    .object({
      width: z
        .object({
          unit: z.enum(["EMU", "PT"]).describe("The unit of the width").optional(),
          magnitude: z.number().describe("The width of the presentation").optional(),
        })
        .describe("The width object of the presentation")
        .optional(),
      height: z
        .object({
          unit: z.enum(["EMU", "PT"]).describe("The unit of the height").optional(),
          magnitude: z.number().describe("The height of the presentation").optional(),
        })
        .describe("The height object of the presentation")
        .optional(),
    })
    .optional(),
});

export type googleOauthCreatePresentationParamsType = z.infer<typeof googleOauthCreatePresentationParamsSchema>;

export const googleOauthCreatePresentationOutputSchema = z.object({
  success: z.boolean().describe("Whether the presentation was created successfully"),
  error: z.string().describe("The error that occurred if the presentation was not created successfully").optional(),
  presentationId: z.string().describe("The ID of the created presentation").optional(),
  presentationUrl: z.string().describe("The URL of the created presentation").optional(),
});

export type googleOauthCreatePresentationOutputType = z.infer<typeof googleOauthCreatePresentationOutputSchema>;
export type googleOauthCreatePresentationFunction = ActionFunction<
  googleOauthCreatePresentationParamsType,
  AuthParamsType,
  googleOauthCreatePresentationOutputType
>;

export const googleOauthUpdatePresentationParamsSchema = z.object({
  presentationId: z.string().describe("The ID of the presentation to update"),
  requests: z
    .array(
      z
        .object({})
        .catchall(z.any())
        .and(
          z.any().superRefine((x, ctx) => {
            const schemas = [
              z.object({
                createSlide: z
                  .object({
                    objectId: z.string().describe("The object ID for the created slide").optional(),
                    insertionIndex: z
                      .number()
                      .int()
                      .describe("The 0-based index where the new slide should be inserted")
                      .optional(),
                    slideLayoutReference: z
                      .object({ predefinedLayout: z.string().describe("Predefined layout of the slide").optional() })
                      .describe("Layout reference of the slide to be created")
                      .optional(),
                  })
                  .describe("Creates a new slide in the presentation"),
              }),
              z.object({
                createShape: z
                  .object({
                    objectId: z.string().describe("The object ID for the created shape"),
                    shapeType: z.string().describe("The type of shape to create"),
                    elementProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The element's size and position")
                      .optional(),
                  })
                  .describe("Creates a new shape in the presentation"),
              }),
              z.object({
                createTable: z
                  .object({
                    objectId: z.string().describe("The object ID for the created table").optional(),
                    rows: z.number().int().describe("Number of rows in the table"),
                    columns: z.number().int().describe("Number of columns in the table"),
                    elementProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The element's size and position")
                      .optional(),
                  })
                  .describe("Creates a new table in the presentation"),
              }),
              z.object({
                insertText: z
                  .object({
                    objectId: z.string().describe("The object ID of the shape or table cell"),
                    text: z.string().describe("The text to be inserted"),
                    insertionIndex: z.number().int().describe("The index where the text will be inserted").optional(),
                  })
                  .describe("Inserts text into a shape or table cell"),
              }),
              z.object({
                insertTableRows: z
                  .object({
                    tableObjectId: z.string().describe("The table to insert rows into"),
                    insertBelow: z.boolean().describe("Whether to insert the rows below the reference cell"),
                    number: z.number().int().describe("The number of rows to insert").optional(),
                    cellLocation: z
                      .object({})
                      .catchall(z.any())
                      .describe("The location where rows will be inserted")
                      .optional(),
                  })
                  .describe("Inserts rows into a table"),
              }),
              z.object({
                insertTableColumns: z
                  .object({
                    tableObjectId: z.string().describe("The table to insert columns into"),
                    insertRight: z
                      .boolean()
                      .describe("Whether to insert the columns to the right of the reference cell"),
                    number: z.number().int().describe("The number of columns to insert").optional(),
                    cellLocation: z
                      .object({})
                      .catchall(z.any())
                      .describe("The location where columns will be inserted")
                      .optional(),
                  })
                  .describe("Inserts columns into a table"),
              }),
              z.object({
                deleteTableRow: z
                  .object({
                    tableObjectId: z.string().describe("The table to delete a row from"),
                    cellLocation: z.object({}).catchall(z.any()).describe("The location of the row to delete"),
                  })
                  .describe("Deletes a row from a table"),
              }),
              z.object({
                deleteTableColumn: z
                  .object({
                    tableObjectId: z.string().describe("The table to delete a column from"),
                    cellLocation: z.object({}).catchall(z.any()).describe("The location of the column to delete"),
                  })
                  .describe("Deletes a column from a table"),
              }),
              z.object({
                replaceAllText: z
                  .object({
                    replaceText: z.string().describe("The text that will replace the matched text"),
                    containsText: z
                      .object({
                        text: z.string().describe("The text to search for in the presentation"),
                        matchCase: z.boolean().describe("Whether the search should be case sensitive").optional(),
                      })
                      .describe("The text to search for"),
                  })
                  .describe("Replaces all instances of text matching a criteria"),
              }),
              z.object({
                deleteObject: z
                  .object({ objectId: z.string().describe("The object ID of the element to delete") })
                  .describe("Deletes an object from the presentation"),
              }),
              z.object({
                updatePageElementTransform: z
                  .object({
                    objectId: z.string().describe("The object ID of the element to update"),
                    transform: z
                      .object({
                        scaleX: z.number().describe("The horizontal scale factor").optional(),
                        scaleY: z.number().describe("The vertical scale factor").optional(),
                        translateX: z.number().describe("The horizontal translation").optional(),
                        translateY: z.number().describe("The vertical translation").optional(),
                        unit: z.string().describe("The unit for translate values").optional(),
                      })
                      .describe("The transform to apply"),
                  })
                  .describe("Updates the transform of a page element"),
              }),
              z.object({
                updateSlidesPosition: z
                  .object({
                    slideObjectIds: z.array(z.string()).describe("The IDs of the slides to reorder"),
                    insertionIndex: z
                      .number()
                      .int()
                      .describe("The 0-based index where the slides should be moved to")
                      .optional(),
                  })
                  .describe("Updates the position of slides in the presentation"),
              }),
              z.object({
                deleteText: z
                  .object({
                    objectId: z.string().describe("The object ID of the shape or table cell"),
                    textRange: z
                      .object({
                        startIndex: z.number().int().describe("The starting index of the range (0-based)").optional(),
                        endIndex: z.number().int().describe("The ending index of the range (0-based)").optional(),
                      })
                      .describe("The range of text to delete")
                      .optional(),
                  })
                  .describe("Deletes text from a shape or table cell"),
              }),
              z.object({
                createImage: z
                  .object({
                    objectId: z.string().describe("The object ID for the created image").optional(),
                    url: z.string().describe("The URL of the image to insert"),
                    elementProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The element's size and position")
                      .optional(),
                  })
                  .describe("Creates an image in the presentation"),
              }),
              z.object({
                createVideo: z
                  .object({
                    objectId: z.string().describe("The object ID for the created video").optional(),
                    url: z.string().describe("The URL of the video to insert"),
                    elementProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The element's size and position")
                      .optional(),
                  })
                  .describe("Creates a video in the presentation"),
              }),
              z.object({
                createSheetsChart: z
                  .object({
                    objectId: z.string().describe("The object ID for the created chart").optional(),
                    spreadsheetId: z.string().describe("The ID of the Google Sheets spreadsheet containing the chart"),
                    chartId: z.number().int().describe("The ID of the specific chart in the spreadsheet"),
                    elementProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The element's size and position")
                      .optional(),
                  })
                  .describe("Creates a linked chart from Google Sheets"),
              }),
              z.object({
                createLine: z
                  .object({
                    objectId: z.string().describe("The object ID for the created line").optional(),
                    lineCategory: z.string().describe("The category of line to create"),
                    elementProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The element's size and position")
                      .optional(),
                  })
                  .describe("Creates a line in the presentation"),
              }),
              z.object({
                refreshSheetsChart: z
                  .object({ objectId: z.string().describe("The object ID of the chart to refresh") })
                  .describe("Refreshes an existing linked sheets chart"),
              }),
              z.object({
                updateShapeProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the shape"),
                    shapeProperties: z.object({}).catchall(z.any()).describe("The properties to update"),
                  })
                  .describe("Updates the properties of a shape"),
              }),
              z.object({
                updateImageProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the image"),
                    imageProperties: z.object({}).catchall(z.any()).describe("The properties to update"),
                  })
                  .describe("Updates the properties of an image"),
              }),
              z.object({
                updateVideoProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the video"),
                    videoProperties: z.object({}).catchall(z.any()).describe("The properties to update"),
                  })
                  .describe("Updates the properties of a video"),
              }),
              z.object({
                updatePageProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the page"),
                    pageProperties: z.object({}).catchall(z.any()).describe("The properties to update"),
                  })
                  .describe("Updates the properties of a page"),
              }),
              z.object({
                updateTableCellProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the table cell"),
                    tableCellProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The properties to update for the table cell"),
                    fields: z
                      .string()
                      .describe("Comma-separated list of fields to update (e.g., 'contentAlignment,backgroundColor')")
                      .optional(),
                    tableRange: z
                      .object({})
                      .catchall(z.any())
                      .describe("The range of cells to update the properties for")
                      .optional(),
                  })
                  .describe("Updates the properties of table cells"),
              }),
              z.object({
                updateLineProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the line"),
                    lineProperties: z.object({}).catchall(z.any()).describe("The properties to update for the line"),
                    fields: z
                      .string()
                      .describe("Comma-separated list of fields to update (e.g., 'lineFill,weight')")
                      .optional(),
                  })
                  .describe("Updates the properties of a line"),
              }),
              z.object({
                createParagraphBullets: z
                  .object({
                    objectId: z.string().describe("The object ID of the shape or table cell containing the paragraph"),
                    bulletPreset: z
                      .string()
                      .describe("The preset type of bullet to use (e.g., BULLET_DISC_CIRCLE_SQUARE)"),
                    textRange: z
                      .object({})
                      .catchall(z.any())
                      .describe("The range of text to apply bullets to (defaults to all text if unspecified)")
                      .optional(),
                  })
                  .describe("Creates bullets for paragraphs"),
              }),
              z.object({
                replaceAllShapesWithImage: z
                  .object({
                    imageUrl: z.string().describe("The URL of the image to replace shapes with"),
                    containsText: z
                      .object({
                        text: z.string().describe("The text the shape must contain to be replaced"),
                        matchCase: z.boolean().describe("Whether the text match is case-sensitive").optional(),
                      })
                      .describe("The text to search for in shapes to be replaced"),
                    replaceMethod: z
                      .enum(["CENTER_INSIDE", "CENTER_CROP"])
                      .describe("The image replace method (Defaults to CENTER_INSIDE)")
                      .optional(),
                    pageObjectIds: z
                      .array(z.string())
                      .describe("Optional list of page object IDs to scope the replacement to")
                      .optional(),
                  })
                  .describe("Replaces all shapes matching criteria with an image"),
              }),
              z.object({
                duplicateObject: z
                  .object({
                    objectId: z.string().describe("The object ID of the object to duplicate"),
                    objectIds: z
                      .record(z.string())
                      .describe(
                        "Optional map for assigning specific object IDs to the duplicated elements (key is original ID, value is new ID)",
                      )
                      .optional(),
                  })
                  .describe("Duplicates a slide object (shape, image, table, etc.)"),
              }),
              z.object({
                updateTextStyle: z
                  .object({
                    objectId: z.string().describe("The object ID of the shape or table cell containing the text"),
                    style: z
                      .object({})
                      .catchall(z.any())
                      .describe("The text style properties to apply (e.g., bold, fontSize)"),
                    fields: z
                      .string()
                      .describe(
                        "Comma-separated list of style fields to update using FieldMask syntax (e.g., 'bold,italic,fontSize')",
                      ),
                    textRange: z
                      .object({
                        type: z
                          .enum(["ALL", "FROM_START_INDEX", "FIXED_RANGE"])
                          .describe("The type of range")
                          .optional(),
                        startIndex: z
                          .number()
                          .int()
                          .describe("The start index for FROM_START_INDEX or FIXED_RANGE")
                          .optional(),
                        endIndex: z.number().int().describe("The end index for FIXED_RANGE").optional(),
                      })
                      .describe("The range of text to style (defaults to all text if unspecified)")
                      .optional(),
                  })
                  .describe("Updates the style of a range of text"),
              }),
              z.object({
                replaceAllShapesWithSheetsChart: z
                  .object({
                    spreadsheetId: z.string().describe("The ID of the Google Sheets spreadsheet containing the chart"),
                    chartId: z.number().int().describe("The ID of the chart within the spreadsheet"),
                    containsText: z
                      .object({
                        text: z.string().describe("The text the shape must contain to be replaced"),
                        matchCase: z.boolean().describe("Whether the text match is case-sensitive").optional(),
                      })
                      .describe("Criteria for shapes to replace (must contain specified text)"),
                    linkingMode: z
                      .enum(["LINKED", "NOT_LINKED_IMAGE"])
                      .describe("The linking mode of the chart (Defaults to LINKED)")
                      .optional(),
                    pageObjectIds: z
                      .array(z.string())
                      .describe("Optional list of page object IDs to scope the replacement to")
                      .optional(),
                  })
                  .describe("Replaces all shapes matching criteria with a Google Sheets chart"),
              }),
              z.object({
                deleteParagraphBullets: z
                  .object({
                    objectId: z.string().describe("The object ID of the shape or table cell containing the paragraph"),
                    textRange: z
                      .object({
                        type: z
                          .enum(["ALL", "FROM_START_INDEX", "FIXED_RANGE"])
                          .describe("The type of range")
                          .optional(),
                        startIndex: z
                          .number()
                          .int()
                          .describe("The start index for FROM_START_INDEX or FIXED_RANGE")
                          .optional(),
                        endIndex: z.number().int().describe("The end index for FIXED_RANGE").optional(),
                      })
                      .describe("The range of text to delete bullets from (defaults to all text if unspecified)")
                      .optional(),
                  })
                  .describe("Deletes bullets from a range of paragraphs"),
              }),
              z.object({
                updateParagraphStyle: z
                  .object({
                    objectId: z.string().describe("The object ID of the shape or table cell containing the paragraph"),
                    style: z
                      .object({})
                      .catchall(z.any())
                      .describe("The paragraph style properties to apply (e.g., alignment, lineSpacing)"),
                    fields: z
                      .string()
                      .describe(
                        "Comma-separated list of style fields to update using FieldMask syntax (e.g., 'alignment,direction,lineSpacing')",
                      ),
                    textRange: z
                      .object({
                        type: z
                          .enum(["ALL", "FROM_START_INDEX", "FIXED_RANGE"])
                          .describe("The type of range")
                          .optional(),
                        startIndex: z
                          .number()
                          .int()
                          .describe("The start index for FROM_START_INDEX or FIXED_RANGE")
                          .optional(),
                        endIndex: z.number().int().describe("The end index for FIXED_RANGE").optional(),
                      })
                      .describe("The range of text to apply the style to (defaults to all paragraphs if unspecified)")
                      .optional(),
                  })
                  .describe("Updates the style of paragraphs"),
              }),
              z.object({
                updateTableBorderProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the table"),
                    tableBorderProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The border properties to update (e.g., dashStyle, weight, color)"),
                    fields: z
                      .string()
                      .describe("Comma-separated list of fields to update (e.g., 'dashStyle,weight')")
                      .optional(),
                    borderPosition: z
                      .enum(["ALL", "BOTTOM", "TOP", "LEFT", "RIGHT", "INNER_HORIZONTAL", "INNER_VERTICAL"])
                      .describe("The position of the border segments to update (defaults to ALL if unspecified)")
                      .optional(),
                    tableRange: z
                      .object({
                        location: z.object({}).catchall(z.any()).describe("The starting cell location").optional(),
                        rowSpan: z.number().int().describe("The number of rows in the range").optional(),
                        columnSpan: z.number().int().describe("The number of columns in the range").optional(),
                      })
                      .describe(
                        "The range of cells whose border should be updated (defaults to the entire table if unspecified)",
                      )
                      .optional(),
                  })
                  .describe("Updates the properties of a table border"),
              }),
              z.object({
                updateTableColumnProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the table"),
                    columnIndices: z.array(z.number().int()).describe("The 0-based indices of the columns to update"),
                    tableColumnProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The properties to update (e.g., columnWidth)"),
                    fields: z
                      .string()
                      .describe(
                        "Comma-separated list of fields to update using FieldMask syntax (e.g., 'columnWidth')",
                      ),
                  })
                  .describe("Updates the properties of table columns"),
              }),
              z.object({
                updateTableRowProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the table"),
                    rowIndices: z.array(z.number().int()).describe("The 0-based indices of the rows to update"),
                    tableRowProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The properties to update (e.g., minRowHeight)"),
                    fields: z
                      .string()
                      .describe(
                        "Comma-separated list of fields to update using FieldMask syntax (e.g., 'minRowHeight')",
                      ),
                  })
                  .describe("Updates the properties of table rows"),
              }),
              z.object({
                mergeTableCells: z
                  .object({
                    objectId: z.string().describe("The object ID of the table"),
                    tableRange: z
                      .object({
                        location: z.object({}).catchall(z.any()).describe("The starting cell location").optional(),
                        rowSpan: z.number().int().describe("The number of rows in the range").optional(),
                        columnSpan: z.number().int().describe("The number of columns in the range").optional(),
                      })
                      .describe("The range of cells to merge"),
                  })
                  .describe("Merges cells in a table"),
              }),
              z.object({
                unmergeTableCells: z
                  .object({
                    objectId: z.string().describe("The object ID of the table"),
                    tableRange: z
                      .object({
                        location: z.object({}).catchall(z.any()).describe("The starting cell location").optional(),
                        rowSpan: z.number().int().describe("The number of rows in the range").optional(),
                        columnSpan: z.number().int().describe("The number of columns in the range").optional(),
                      })
                      .describe("The range of cells to unmerge"),
                  })
                  .describe("Unmerges cells in a table"),
              }),
              z.object({
                groupObjects: z
                  .object({
                    childrenObjectIds: z.array(z.string()).describe("The object IDs of the elements to group"),
                    groupObjectId: z.string().describe("The object ID to assign to the created group"),
                  })
                  .describe("Groups multiple page elements together"),
              }),
              z.object({
                ungroupObjects: z
                  .object({ objectIds: z.array(z.string()).describe("The object IDs of the groups to ungroup") })
                  .describe("Ungroups page elements"),
              }),
              z.object({
                updatePageElementAltText: z
                  .object({
                    objectId: z.string().describe("The object ID of the page element"),
                    title: z.string().describe("The title for the alt text"),
                    description: z.string().describe("The description for the alt text"),
                  })
                  .describe("Updates the alt text for a page element"),
              }),
              z.object({
                replaceImage: z
                  .object({
                    imageObjectId: z.string().describe("The object ID of the image to replace"),
                    url: z.string().describe("The URL of the new image"),
                    replaceMethod: z
                      .enum(["CENTER_INSIDE", "CENTER_CROP"])
                      .describe("The image replace method (Defaults to CENTER_INSIDE)")
                      .optional(),
                  })
                  .describe("Replaces an existing image with a new one"),
              }),
              z.object({
                updateSlideProperties: z
                  .object({
                    objectId: z.string().describe("The object ID of the slide"),
                    slideProperties: z
                      .object({})
                      .catchall(z.any())
                      .describe("The properties to update (e.g., master reference, layout reference)"),
                    fields: z
                      .string()
                      .describe(
                        "Comma-separated list of fields to update using FieldMask syntax (e.g., 'slideBackgroundFill')",
                      ),
                  })
                  .describe("Updates the properties of a slide"),
              }),
              z.object({
                updatePageElementsZOrder: z
                  .object({
                    pageObjectIds: z.array(z.string()).describe("The object IDs of the page elements to reorder"),
                    operation: z
                      .enum(["BRING_TO_FRONT", "BRING_FORWARD", "SEND_BACKWARD", "SEND_TO_BACK"])
                      .describe("The Z-order operation to apply"),
                  })
                  .describe("Updates the Z-order of page elements"),
              }),
              z.object({
                updateLineCategory: z
                  .object({
                    objectId: z.string().describe("The object ID of the line"),
                    lineCategory: z.enum(["STRAIGHT", "BENT", "CURVED"]).describe("The new line category"),
                  })
                  .describe("Updates the category of a line"),
              }),
              z.object({
                rerouteLine: z
                  .object({ objectId: z.string().describe("The object ID of the line to reroute") })
                  .describe("Reroutes a line connection"),
              }),
            ];
            const errors = schemas.reduce<z.ZodError[]>(
              (errors, schema) => (result => (result.error ? [...errors, result.error] : errors))(schema.safeParse(x)),
              [],
            );
            if (schemas.length - errors.length !== 1) {
              ctx.addIssue({
                path: ctx.path,
                code: "invalid_union",
                unionErrors: errors,
                message: "Invalid input: Should pass single schema",
              });
            }
          }),
        ),
    )
    .describe("The requests to update the presentation with"),
});

export type googleOauthUpdatePresentationParamsType = z.infer<typeof googleOauthUpdatePresentationParamsSchema>;

export const googleOauthUpdatePresentationOutputSchema = z.object({
  success: z.boolean().describe("Whether the presentation was created successfully"),
  error: z.string().describe("The error that occurred if the presentation was not created successfully").optional(),
  presentationUrl: z.string().describe("The URL of the created presentation").optional(),
});

export type googleOauthUpdatePresentationOutputType = z.infer<typeof googleOauthUpdatePresentationOutputSchema>;
export type googleOauthUpdatePresentationFunction = ActionFunction<
  googleOauthUpdatePresentationParamsType,
  AuthParamsType,
  googleOauthUpdatePresentationOutputType
>;

export const googleOauthSearchDriveByKeywordsParamsSchema = z.object({
  keywords: z.array(z.string()).describe("List of keywords to search for in file contents."),
});

export type googleOauthSearchDriveByKeywordsParamsType = z.infer<typeof googleOauthSearchDriveByKeywordsParamsSchema>;

export const googleOauthSearchDriveByKeywordsOutputSchema = z.object({
  success: z.boolean().describe("Whether the search was successful"),
  files: z
    .array(
      z.object({
        id: z.string().describe("The file ID"),
        name: z.string().describe("The file name"),
        mimeType: z.string().describe("The MIME type of the file"),
        url: z.string().describe("The web link to view the file"),
      }),
    )
    .describe("List of files matching the search")
    .optional(),
  error: z.string().describe("Error message if search failed").optional(),
});

export type googleOauthSearchDriveByKeywordsOutputType = z.infer<typeof googleOauthSearchDriveByKeywordsOutputSchema>;
export type googleOauthSearchDriveByKeywordsFunction = ActionFunction<
  googleOauthSearchDriveByKeywordsParamsType,
  AuthParamsType,
  googleOauthSearchDriveByKeywordsOutputType
>;

export const googleOauthListGroupsParamsSchema = z.object({
  maxResults: z.number().int().describe("The maximum number of groups to return (max allowed is 200)").optional(),
});

export type googleOauthListGroupsParamsType = z.infer<typeof googleOauthListGroupsParamsSchema>;

export const googleOauthListGroupsOutputSchema = z.object({
  success: z.boolean().describe("Whether the groups were listed successfully"),
  groups: z
    .array(
      z.object({
        id: z.string().describe("The unique ID of the group"),
        email: z.string().describe("The email address of the group"),
        name: z.string().describe("The name of the group"),
        description: z.string().describe("The description of the group").optional(),
      }),
    )
    .describe("The list of Google Groups"),
  error: z.string().describe("The error that occurred if the groups could not be listed").optional(),
});

export type googleOauthListGroupsOutputType = z.infer<typeof googleOauthListGroupsOutputSchema>;
export type googleOauthListGroupsFunction = ActionFunction<
  googleOauthListGroupsParamsType,
  AuthParamsType,
  googleOauthListGroupsOutputType
>;

export const googleOauthGetGroupParamsSchema = z.object({
  groupKey: z.string().describe("The group's email address or unique group ID"),
});

export type googleOauthGetGroupParamsType = z.infer<typeof googleOauthGetGroupParamsSchema>;

export const googleOauthGetGroupOutputSchema = z.object({
  success: z.boolean().describe("Whether the group was retrieved successfully"),
  group: z.object({
    id: z.string().describe("The unique ID of the group"),
    email: z.string().describe("The email address of the group"),
    name: z.string().describe("The name of the group"),
    description: z.string().describe("The description of the group").optional(),
  }),
  error: z.string().describe("The error that occurred if the group could not be retrieved").optional(),
});

export type googleOauthGetGroupOutputType = z.infer<typeof googleOauthGetGroupOutputSchema>;
export type googleOauthGetGroupFunction = ActionFunction<
  googleOauthGetGroupParamsType,
  AuthParamsType,
  googleOauthGetGroupOutputType
>;

export const googleOauthListGroupMembersParamsSchema = z.object({
  groupKey: z.string().describe("The group's email address or unique group ID"),
  maxResults: z.number().int().describe("The maximum number of members to return (max allowed is 200)").optional(),
});

export type googleOauthListGroupMembersParamsType = z.infer<typeof googleOauthListGroupMembersParamsSchema>;

export const googleOauthListGroupMembersOutputSchema = z.object({
  success: z.boolean().describe("Whether the members were listed successfully"),
  members: z
    .array(
      z.object({
        id: z.string().describe("The unique ID of the member"),
        email: z.string().describe("The email address of the member"),
        role: z.string().describe("The role of the member in the group (OWNER, MANAGER, MEMBER)"),
        type: z.string().describe("The type of the member (USER, GROUP)"),
      }),
    )
    .describe("The list of group members"),
  error: z.string().describe("The error that occurred if the members could not be listed").optional(),
});

export type googleOauthListGroupMembersOutputType = z.infer<typeof googleOauthListGroupMembersOutputSchema>;
export type googleOauthListGroupMembersFunction = ActionFunction<
  googleOauthListGroupMembersParamsType,
  AuthParamsType,
  googleOauthListGroupMembersOutputType
>;

export const googleOauthHasGroupMemberParamsSchema = z.object({
  groupKey: z.string().describe("The group's email address or unique group ID"),
  memberKey: z.string().describe("The member's email address or unique member ID"),
});

export type googleOauthHasGroupMemberParamsType = z.infer<typeof googleOauthHasGroupMemberParamsSchema>;

export const googleOauthHasGroupMemberOutputSchema = z.object({
  success: z.boolean().describe("Whether the check was performed successfully"),
  isMember: z.boolean().describe("Whether the user is a member of the group"),
  error: z.string().describe("The error that occurred if the check could not be performed").optional(),
});

export type googleOauthHasGroupMemberOutputType = z.infer<typeof googleOauthHasGroupMemberOutputSchema>;
export type googleOauthHasGroupMemberFunction = ActionFunction<
  googleOauthHasGroupMemberParamsType,
  AuthParamsType,
  googleOauthHasGroupMemberOutputType
>;

export const googleOauthAddGroupMemberParamsSchema = z.object({
  groupKey: z.string().describe("The group's email address or unique group ID"),
  email: z.string().describe("The email address of the user to add"),
});

export type googleOauthAddGroupMemberParamsType = z.infer<typeof googleOauthAddGroupMemberParamsSchema>;

export const googleOauthAddGroupMemberOutputSchema = z.object({
  success: z.boolean().describe("Whether the member was added successfully"),
  memberID: z.string().describe("The unique ID of the member"),
  error: z.string().describe("The error that occurred if the member could not be added").optional(),
});

export type googleOauthAddGroupMemberOutputType = z.infer<typeof googleOauthAddGroupMemberOutputSchema>;
export type googleOauthAddGroupMemberFunction = ActionFunction<
  googleOauthAddGroupMemberParamsType,
  AuthParamsType,
  googleOauthAddGroupMemberOutputType
>;

export const googleOauthDeleteGroupMemberParamsSchema = z.object({
  groupKey: z.string().describe("The group's email address or unique group ID"),
  memberKey: z.string().describe("The member's email address or unique member ID"),
});

export type googleOauthDeleteGroupMemberParamsType = z.infer<typeof googleOauthDeleteGroupMemberParamsSchema>;

export const googleOauthDeleteGroupMemberOutputSchema = z.object({
  success: z.boolean().describe("Whether the member was removed successfully"),
  error: z.string().describe("The error that occurred if the member could not be removed").optional(),
});

export type googleOauthDeleteGroupMemberOutputType = z.infer<typeof googleOauthDeleteGroupMemberOutputSchema>;
export type googleOauthDeleteGroupMemberFunction = ActionFunction<
  googleOauthDeleteGroupMemberParamsType,
  AuthParamsType,
  googleOauthDeleteGroupMemberOutputType
>;

export const googlemailSearchGmailMessagesParamsSchema = z.object({
  query: z.string().describe('Gmail search query (e.g. "from:alice subject:urgent")'),
  maxResults: z.number().int().describe("Maximum number of messages to return (optional)").optional(),
});

export type googlemailSearchGmailMessagesParamsType = z.infer<typeof googlemailSearchGmailMessagesParamsSchema>;

export const googlemailSearchGmailMessagesOutputSchema = z.object({
  success: z.boolean(),
  messages: z
    .array(
      z.object({
        id: z.string().describe("The message ID"),
        threadId: z.string().describe("The thread ID"),
        snippet: z.string().describe("A short part of the message text").optional(),
        labelIds: z.array(z.string()).describe("Labels on the message").optional(),
        internalDate: z.string().describe("Internal timestamp of the message").optional(),
        emailBody: z.string().describe("The body of the message").optional(),
      }),
    )
    .describe("List of matching Gmail messages"),
  error: z.string().describe("Error message if search failed").optional(),
});

export type googlemailSearchGmailMessagesOutputType = z.infer<typeof googlemailSearchGmailMessagesOutputSchema>;
export type googlemailSearchGmailMessagesFunction = ActionFunction<
  googlemailSearchGmailMessagesParamsType,
  AuthParamsType,
  googlemailSearchGmailMessagesOutputType
>;

export const googlemailListGmailThreadsParamsSchema = z.object({
  query: z.string().describe('Gmail search query (e.g. "from:alice subject:project")'),
  maxResults: z.number().int().describe("Maximum number of threads to return").optional(),
});

export type googlemailListGmailThreadsParamsType = z.infer<typeof googlemailListGmailThreadsParamsSchema>;

export const googlemailListGmailThreadsOutputSchema = z.object({
  success: z.boolean(),
  threads: z
    .array(
      z.object({
        id: z.string().describe("The thread ID"),
        historyId: z.string().describe("The thread history ID"),
        messages: z
          .array(
            z.object({
              id: z.string(),
              threadId: z.string(),
              snippet: z.string(),
              labelIds: z.array(z.string()),
              internalDate: z.string(),
              emailBody: z.string(),
            }),
          )
          .describe("The messages in the thread"),
      }),
    )
    .describe("List of matching Gmail threads"),
  error: z.string().describe("Error message if search failed").optional(),
});

export type googlemailListGmailThreadsOutputType = z.infer<typeof googlemailListGmailThreadsOutputSchema>;
export type googlemailListGmailThreadsFunction = ActionFunction<
  googlemailListGmailThreadsParamsType,
  AuthParamsType,
  googlemailListGmailThreadsOutputType
>;

export const gongGetGongTranscriptsParamsSchema = z.object({
  userRole: z.string().describe("The role of users whose transcripts are being fetched"),
  trackers: z
    .array(z.string().describe("The names of the trackers to fetch transcripts for"))
    .describe("The trackers to fetch transcripts for")
    .optional(),
  company: z.string().describe("The company to get calls with").optional(),
  startDate: z.string().describe("The start date of the transcripts to fetch in ISO 8601 format").optional(),
  endDate: z.string().describe("The end date of the transcripts to fetch in ISO 8601 format").optional(),
});

export type gongGetGongTranscriptsParamsType = z.infer<typeof gongGetGongTranscriptsParamsSchema>;

export const gongGetGongTranscriptsOutputSchema = z.object({
  success: z.boolean().describe("Whether the transcripts were fetched successfully"),
  callTranscripts: z
    .array(
      z
        .object({
          callId: z.string().describe("The ID of the call").optional(),
          callName: z.string().describe("The name of the call").optional(),
          startTime: z.string().describe("The start time of the call in ISO 8601 format").optional(),
          transcript: z
            .array(
              z
                .object({
                  speakerName: z.string().describe("The name of the speaker").optional(),
                  speakerEmail: z.string().describe("The email of the speaker").optional(),
                  topic: z.string().nullable().describe("The topic of the transcript").optional(),
                  sentences: z
                    .array(
                      z
                        .object({
                          start: z.number().describe("The start time of the sentence in seconds").optional(),
                          end: z.number().describe("The end time of the sentence in seconds").optional(),
                          text: z.string().describe("The text of the sentence").optional(),
                        })
                        .describe("A sentence"),
                    )
                    .describe("The sentences in the transcript")
                    .optional(),
                })
                .describe("A transcript"),
            )
            .describe("The transcript")
            .optional(),
        })
        .describe("A transcript"),
    )
    .describe("The transcripts fetched")
    .optional(),
  error: z.string().describe("The error that occurred if the transcripts weren't fetched successfully").optional(),
});

export type gongGetGongTranscriptsOutputType = z.infer<typeof gongGetGongTranscriptsOutputSchema>;
export type gongGetGongTranscriptsFunction = ActionFunction<
  gongGetGongTranscriptsParamsType,
  AuthParamsType,
  gongGetGongTranscriptsOutputType
>;

export const finnhubSymbolLookupParamsSchema = z.object({
  query: z.string().describe("The symbol or colloquial name of the company to look up"),
});

export type finnhubSymbolLookupParamsType = z.infer<typeof finnhubSymbolLookupParamsSchema>;

export const finnhubSymbolLookupOutputSchema = z.object({
  result: z
    .array(
      z
        .object({
          symbol: z.string().describe("The symbol of the stock").optional(),
          description: z.string().describe("The description of the stock").optional(),
        })
        .describe("The metadata of the stock"),
    )
    .describe("The results of the symbol lookup"),
});

export type finnhubSymbolLookupOutputType = z.infer<typeof finnhubSymbolLookupOutputSchema>;
export type finnhubSymbolLookupFunction = ActionFunction<
  finnhubSymbolLookupParamsType,
  AuthParamsType,
  finnhubSymbolLookupOutputType
>;

export const finnhubGetBasicFinancialsParamsSchema = z.object({
  symbol: z.string().describe("The symbol/TICKER of the stock"),
});

export type finnhubGetBasicFinancialsParamsType = z.infer<typeof finnhubGetBasicFinancialsParamsSchema>;

export const finnhubGetBasicFinancialsOutputSchema = z.object({
  result: z
    .object({
      annual: z
        .array(
          z
            .object({
              metric: z.string().describe("The name of the financial metric").optional(),
              series: z
                .array(
                  z
                    .object({
                      period: z.string().describe("The period of the financial metric in YYYY-MM-DD format").optional(),
                      v: z.number().describe("The value of the financial metric").optional(),
                    })
                    .describe("The value of the financial metric"),
                )
                .describe("The series of values for the financial metric")
                .optional(),
            })
            .describe("The annual financials of the stock"),
        )
        .describe("The annual financials of the stock")
        .optional(),
      quarterly: z
        .array(
          z
            .object({
              metric: z.string().describe("The name of the financial metric").optional(),
              series: z
                .array(
                  z
                    .object({
                      period: z.string().describe("The period of the financial metric in YYYY-MM-DD format").optional(),
                      v: z.number().describe("The value of the financial metric").optional(),
                    })
                    .describe("The value of the financial metric"),
                )
                .describe("The series of values for the financial metric")
                .optional(),
            })
            .describe("The quarterly financials of the stock"),
        )
        .describe("The quarterly financials of the stock")
        .optional(),
    })
    .describe("The basic financials of the stock"),
});

export type finnhubGetBasicFinancialsOutputType = z.infer<typeof finnhubGetBasicFinancialsOutputSchema>;
export type finnhubGetBasicFinancialsFunction = ActionFunction<
  finnhubGetBasicFinancialsParamsType,
  AuthParamsType,
  finnhubGetBasicFinancialsOutputType
>;

export const lookerEnableUserByEmailParamsSchema = z.object({
  userEmail: z.string().describe("The email address of the user to search for"),
});

export type lookerEnableUserByEmailParamsType = z.infer<typeof lookerEnableUserByEmailParamsSchema>;

export const lookerEnableUserByEmailOutputSchema = z.object({
  success: z.boolean().describe("Whether the operation was successful"),
  message: z.string().describe("Status message about the operation"),
  userId: z.string().describe("The ID of the user that was found").optional(),
  userDetails: z
    .object({
      id: z.string().describe("The ID of the user"),
      firstName: z.string().describe("The first name of the user"),
      lastName: z.string().describe("The last name of the user"),
      email: z.string().describe("The email of the user"),
      isDisabled: z.boolean().describe("Whether the user is disabled"),
    })
    .describe("Details about the user")
    .optional(),
});

export type lookerEnableUserByEmailOutputType = z.infer<typeof lookerEnableUserByEmailOutputSchema>;
export type lookerEnableUserByEmailFunction = ActionFunction<
  lookerEnableUserByEmailParamsType,
  AuthParamsType,
  lookerEnableUserByEmailOutputType
>;

export const ashbyCreateNoteParamsSchema = z.object({
  candidateId: z.string().describe("The ID of the candidate to create a note for"),
  note: z.string().describe("The note content"),
});

export type ashbyCreateNoteParamsType = z.infer<typeof ashbyCreateNoteParamsSchema>;

export const ashbyCreateNoteOutputSchema = z.void();

export type ashbyCreateNoteOutputType = z.infer<typeof ashbyCreateNoteOutputSchema>;
export type ashbyCreateNoteFunction = ActionFunction<
  ashbyCreateNoteParamsType,
  AuthParamsType,
  ashbyCreateNoteOutputType
>;

export const ashbyGetCandidateInfoParamsSchema = z.object({
  candidateId: z.string().describe("The ID of the candidate whose information is to be retrieved"),
});

export type ashbyGetCandidateInfoParamsType = z.infer<typeof ashbyGetCandidateInfoParamsSchema>;

export const ashbyGetCandidateInfoOutputSchema = z.object({
  candidate: z.object({}).catchall(z.any()).describe("The candidate's information"),
});

export type ashbyGetCandidateInfoOutputType = z.infer<typeof ashbyGetCandidateInfoOutputSchema>;
export type ashbyGetCandidateInfoFunction = ActionFunction<
  ashbyGetCandidateInfoParamsType,
  AuthParamsType,
  ashbyGetCandidateInfoOutputType
>;

export const ashbyAddCandidateToProjectParamsSchema = z.object({
  candidateId: z.string().describe("The ID of the candidate to add to the project"),
  projectId: z.string().describe("The ID of the project to add the candidate to"),
});

export type ashbyAddCandidateToProjectParamsType = z.infer<typeof ashbyAddCandidateToProjectParamsSchema>;

export const ashbyAddCandidateToProjectOutputSchema = z.void();

export type ashbyAddCandidateToProjectOutputType = z.infer<typeof ashbyAddCandidateToProjectOutputSchema>;
export type ashbyAddCandidateToProjectFunction = ActionFunction<
  ashbyAddCandidateToProjectParamsType,
  AuthParamsType,
  ashbyAddCandidateToProjectOutputType
>;

export const ashbyListCandidatesParamsSchema = z.object({});

export type ashbyListCandidatesParamsType = z.infer<typeof ashbyListCandidatesParamsSchema>;

export const ashbyListCandidatesOutputSchema = z.object({
  candidates: z.array(z.any()).describe("A list of candidates"),
});

export type ashbyListCandidatesOutputType = z.infer<typeof ashbyListCandidatesOutputSchema>;
export type ashbyListCandidatesFunction = ActionFunction<
  ashbyListCandidatesParamsType,
  AuthParamsType,
  ashbyListCandidatesOutputType
>;

export const ashbySearchCandidatesParamsSchema = z.object({
  email: z.string().describe("The email address of the candidate to search for").optional(),
  name: z.string().describe("The name of the candidate to search for").optional(),
});

export type ashbySearchCandidatesParamsType = z.infer<typeof ashbySearchCandidatesParamsSchema>;

export const ashbySearchCandidatesOutputSchema = z.object({
  candidates: z.array(z.any()).describe("A list of candidates"),
});

export type ashbySearchCandidatesOutputType = z.infer<typeof ashbySearchCandidatesOutputSchema>;
export type ashbySearchCandidatesFunction = ActionFunction<
  ashbySearchCandidatesParamsType,
  AuthParamsType,
  ashbySearchCandidatesOutputType
>;

export const ashbyListCandidateNotesParamsSchema = z.object({
  candidateId: z.string().describe("The ID of the candidate"),
});

export type ashbyListCandidateNotesParamsType = z.infer<typeof ashbyListCandidateNotesParamsSchema>;

export const ashbyListCandidateNotesOutputSchema = z.object({ notes: z.array(z.any()).describe("A list of notes") });

export type ashbyListCandidateNotesOutputType = z.infer<typeof ashbyListCandidateNotesOutputSchema>;
export type ashbyListCandidateNotesFunction = ActionFunction<
  ashbyListCandidateNotesParamsType,
  AuthParamsType,
  ashbyListCandidateNotesOutputType
>;

export const ashbyCreateCandidateParamsSchema = z.object({
  name: z.string().describe("The first and last name of the candidate to be created."),
  email: z.string().describe("Primary, personal email of the candidate to be created.").optional(),
  phoneNumber: z.string().describe("Primary, personal phone number of the candidate to be created.").optional(),
  linkedInUrl: z.string().describe("Url to the candidate's LinkedIn profile. Must be a valid Url.").optional(),
  githubUrl: z.string().describe("Url to the candidate's Github profile. Must be a valid Url.").optional(),
  website: z.string().describe("Url of the candidate's website. Must be a valid Url.").optional(),
  alternateEmailAddresses: z
    .array(z.string())
    .describe("Array of alternate email address to add to the candidate's profile.")
    .optional(),
  sourceId: z.string().describe("The source to set on the candidate being created.").optional(),
  creditedToUserId: z.string().describe("The id of the user the candidate will be credited to.").optional(),
  location: z
    .object({
      city: z.string().describe("The city of the candidate.").optional(),
      region: z.string().describe("The region of the candidate.").optional(),
      country: z.string().describe("The country of the candidate.").optional(),
    })
    .describe("The location of the candidate.")
    .optional(),
});

export type ashbyCreateCandidateParamsType = z.infer<typeof ashbyCreateCandidateParamsSchema>;

export const ashbyCreateCandidateOutputSchema = z.void();

export type ashbyCreateCandidateOutputType = z.infer<typeof ashbyCreateCandidateOutputSchema>;
export type ashbyCreateCandidateFunction = ActionFunction<
  ashbyCreateCandidateParamsType,
  AuthParamsType,
  ashbyCreateCandidateOutputType
>;

export const ashbyUpdateCandidateParamsSchema = z.object({
  candidateId: z.string().describe("The ID of the candidate to update"),
  name: z.string().describe("The first and last name of the candidate to update.").optional(),
  email: z.string().describe("Primary, personal email of the candidate to update.").optional(),
  phoneNumber: z.string().describe("Primary, personal phone number of the candidate to update.").optional(),
  linkedInUrl: z.string().describe("Url to the candidate's LinkedIn profile. Must be a valid Url.").optional(),
  githubUrl: z.string().describe("Url to the candidate's Github profile. Must be a valid Url.").optional(),
  websiteUrl: z.string().describe("Url of the candidate's website. Must be a valid Url.").optional(),
  alternateEmail: z.string().describe("An alternate email address to add to the candidate's profile.").optional(),
  socialLinks: z
    .array(
      z.object({
        type: z.string().describe("The type of social link").optional(),
        url: z.string().describe("The URL of the social link").optional(),
      }),
    )
    .describe(
      "An array of social links to set on the candidate. This value replaces existing socialLinks that have been set on the candidate.",
    )
    .optional(),
  sourceId: z.string().describe("The id of source for this candidate.").optional(),
  creditedToUserId: z.string().describe("The id of the user the candidate will be credited to.").optional(),
  location: z
    .object({
      city: z.string().describe("The city of the candidate").optional(),
      region: z.string().describe("The region of the candidate").optional(),
      country: z.string().describe("The country of the candidate").optional(),
    })
    .describe("The location of the candidate.")
    .optional(),
  createdAt: z.string().describe("An ISO date string to set the candidate's createdAt timestamp.").optional(),
  sendNotifications: z
    .boolean()
    .describe(
      "Whether or not users who are subscribed to the candidate should be notified that candidate was updated. Default is true.",
    )
    .optional(),
});

export type ashbyUpdateCandidateParamsType = z.infer<typeof ashbyUpdateCandidateParamsSchema>;

export const ashbyUpdateCandidateOutputSchema = z.void();

export type ashbyUpdateCandidateOutputType = z.infer<typeof ashbyUpdateCandidateOutputSchema>;
export type ashbyUpdateCandidateFunction = ActionFunction<
  ashbyUpdateCandidateParamsType,
  AuthParamsType,
  ashbyUpdateCandidateOutputType
>;

export const salesforceUpdateRecordParamsSchema = z.object({
  objectType: z.string().describe("The Salesforce object type to update (e.g., Lead, Account, Contact)"),
  recordId: z.string().describe("The ID of the record to update"),
  fieldsToUpdate: z
    .record(z.string())
    .describe(
      "A key,value pair where the keys are the fields to update on the record and the values are the new values of those fields.",
    ),
});

export type salesforceUpdateRecordParamsType = z.infer<typeof salesforceUpdateRecordParamsSchema>;

export const salesforceUpdateRecordOutputSchema = z.object({
  success: z.boolean().describe("Whether the record was successfully updated"),
  error: z.string().describe("The error that occurred if the record was not successfully updated").optional(),
});

export type salesforceUpdateRecordOutputType = z.infer<typeof salesforceUpdateRecordOutputSchema>;
export type salesforceUpdateRecordFunction = ActionFunction<
  salesforceUpdateRecordParamsType,
  AuthParamsType,
  salesforceUpdateRecordOutputType
>;

export const salesforceCreateRecordParamsSchema = z.object({
  objectType: z.string().describe("The Salesforce object type to create (e.g., Lead, Account, Contact)"),
  fieldsToCreate: z.record(z.string()).describe("The fields to create on the record").optional(),
});

export type salesforceCreateRecordParamsType = z.infer<typeof salesforceCreateRecordParamsSchema>;

export const salesforceCreateRecordOutputSchema = z.object({
  success: z.boolean().describe("Whether the record was successfully created"),
  recordId: z.string().describe("The ID of the created object").optional(),
  error: z.string().describe("The error that occurred if the record was not successfully created").optional(),
});

export type salesforceCreateRecordOutputType = z.infer<typeof salesforceCreateRecordOutputSchema>;
export type salesforceCreateRecordFunction = ActionFunction<
  salesforceCreateRecordParamsType,
  AuthParamsType,
  salesforceCreateRecordOutputType
>;

export const salesforceCreateCaseParamsSchema = z.object({
  subject: z.string().describe("The subject of the case"),
  description: z.string().describe("The detailed description of the case"),
  priority: z.string().describe("The priority of the case (e.g., High, Medium, Low)"),
  origin: z.string().describe("The origin of the case (e.g., Phone, Email, Web)"),
  customFields: z.record(z.string()).describe("Additional custom fields to set on the case").optional(),
});

export type salesforceCreateCaseParamsType = z.infer<typeof salesforceCreateCaseParamsSchema>;

export const salesforceCreateCaseOutputSchema = z.object({
  success: z.boolean().describe("Whether the case was successfully created"),
  caseId: z.string().describe("The ID of the created case").optional(),
  error: z.string().describe("The error that occurred if the case was not successfully created").optional(),
});

export type salesforceCreateCaseOutputType = z.infer<typeof salesforceCreateCaseOutputSchema>;
export type salesforceCreateCaseFunction = ActionFunction<
  salesforceCreateCaseParamsType,
  AuthParamsType,
  salesforceCreateCaseOutputType
>;

export const salesforceGenerateSalesReportParamsSchema = z.object({
  startDate: z.string().describe("The start date for the sales report in ISO 8601 format (e.g., 2025-01-01)."),
  endDate: z.string().describe("The end date for the sales report in ISO 8601 format (e.g., 2025-01-31)."),
  filters: z
    .record(z.string())
    .describe("Additional filters for the sales report (e.g., by region, product).")
    .optional(),
});

export type salesforceGenerateSalesReportParamsType = z.infer<typeof salesforceGenerateSalesReportParamsSchema>;

export const salesforceGenerateSalesReportOutputSchema = z.object({
  success: z.boolean().describe("Whether the sales report was successfully generated."),
  reportData: z
    .array(z.record(z.string()).describe("A row in the sales report."))
    .describe("The data of the sales report.")
    .optional(),
  error: z.string().describe("The error that occurred if the sales report was not successfully generated.").optional(),
});

export type salesforceGenerateSalesReportOutputType = z.infer<typeof salesforceGenerateSalesReportOutputSchema>;
export type salesforceGenerateSalesReportFunction = ActionFunction<
  salesforceGenerateSalesReportParamsType,
  AuthParamsType,
  salesforceGenerateSalesReportOutputType
>;

export const salesforceGetSalesforceRecordsByQueryParamsSchema = z.object({
  query: z.string().describe("The SOQL query to execute"),
  limit: z.number().describe("The maximum number of records to retrieve").optional(),
});

export type salesforceGetSalesforceRecordsByQueryParamsType = z.infer<
  typeof salesforceGetSalesforceRecordsByQueryParamsSchema
>;

export const salesforceGetSalesforceRecordsByQueryOutputSchema = z.object({
  success: z.boolean().describe("Whether the records were successfully retrieved"),
  records: z
    .array(z.record(z.string()).describe("A record from Salesforce"))
    .describe("The retrieved records")
    .optional(),
  error: z.string().describe("The error that occurred if the records were not successfully retrieved").optional(),
});

export type salesforceGetSalesforceRecordsByQueryOutputType = z.infer<
  typeof salesforceGetSalesforceRecordsByQueryOutputSchema
>;
export type salesforceGetSalesforceRecordsByQueryFunction = ActionFunction<
  salesforceGetSalesforceRecordsByQueryParamsType,
  AuthParamsType,
  salesforceGetSalesforceRecordsByQueryOutputType
>;

export const salesforceGetRecordParamsSchema = z.object({
  objectType: z.string().describe("The Salesforce object type to retrieve (e.g., Lead, Account, Contact)"),
  recordId: z.string().describe("The ID of the record to retrieve"),
});

export type salesforceGetRecordParamsType = z.infer<typeof salesforceGetRecordParamsSchema>;

export const salesforceGetRecordOutputSchema = z.object({
  success: z.boolean().describe("Whether the record was successfully retrieved"),
  record: z.record(z.string()).describe("The retrieved record data").optional(),
  error: z.string().describe("The error that occurred if the record was not successfully retrieved").optional(),
});

export type salesforceGetRecordOutputType = z.infer<typeof salesforceGetRecordOutputSchema>;
export type salesforceGetRecordFunction = ActionFunction<
  salesforceGetRecordParamsType,
  AuthParamsType,
  salesforceGetRecordOutputType
>;

export const salesforceFetchSalesforceSchemaByObjectParamsSchema = z.object({
  objectType: z.string().describe("The Salesforce object type to fetch the schema for (e.g., Lead, Account, Contact)"),
});

export type salesforceFetchSalesforceSchemaByObjectParamsType = z.infer<
  typeof salesforceFetchSalesforceSchemaByObjectParamsSchema
>;

export const salesforceFetchSalesforceSchemaByObjectOutputSchema = z.object({
  success: z.boolean().describe("Whether the schema was successfully retrieved"),
  schema: z.record(z.string()).describe("The retrieved schema data").optional(),
  error: z.string().describe("The error that occurred if the schema was not successfully retrieved").optional(),
});

export type salesforceFetchSalesforceSchemaByObjectOutputType = z.infer<
  typeof salesforceFetchSalesforceSchemaByObjectOutputSchema
>;
export type salesforceFetchSalesforceSchemaByObjectFunction = ActionFunction<
  salesforceFetchSalesforceSchemaByObjectParamsType,
  AuthParamsType,
  salesforceFetchSalesforceSchemaByObjectOutputType
>;

export const microsoftCreateDocumentParamsSchema = z.object({
  siteId: z.string().describe("The ID of the site where the document will be created").optional(),
  name: z.string().describe("The name of the new document (include extension like .docx or .xlsx)"),
  content: z.string().describe("The content to add to the new document"),
  folderId: z.string().describe("The ID of the folder to create the document in (optional)").optional(),
});

export type microsoftCreateDocumentParamsType = z.infer<typeof microsoftCreateDocumentParamsSchema>;

export const microsoftCreateDocumentOutputSchema = z.object({
  documentId: z.string().describe("The ID of the created document").optional(),
  documentUrl: z.string().describe("The URL to access the created document").optional(),
  fileName: z.string().describe("The name of the created document (could be sanitized version of the name)").optional(),
  success: z.boolean().describe("Whether the document was created successfully"),
  error: z.string().describe("The error that occurred if the document was not created successfully").optional(),
});

export type microsoftCreateDocumentOutputType = z.infer<typeof microsoftCreateDocumentOutputSchema>;
export type microsoftCreateDocumentFunction = ActionFunction<
  microsoftCreateDocumentParamsType,
  AuthParamsType,
  microsoftCreateDocumentOutputType
>;

export const microsoftUpdateDocumentParamsSchema = z.object({
  siteId: z.string().describe("The ID of the site where the document is located").optional(),
  documentId: z.string().describe("The ID of the document"),
  content: z.string().describe("The new content to update in the document"),
});

export type microsoftUpdateDocumentParamsType = z.infer<typeof microsoftUpdateDocumentParamsSchema>;

export const microsoftUpdateDocumentOutputSchema = z.object({
  success: z.boolean().describe("Whether the document was updated successfully"),
  error: z.string().describe("The error that occurred if the update was not successful").optional(),
  documentUrl: z.string().describe("The URL to access the updated document").optional(),
});

export type microsoftUpdateDocumentOutputType = z.infer<typeof microsoftUpdateDocumentOutputSchema>;
export type microsoftUpdateDocumentFunction = ActionFunction<
  microsoftUpdateDocumentParamsType,
  AuthParamsType,
  microsoftUpdateDocumentOutputType
>;

export const microsoftUpdateSpreadsheetParamsSchema = z.object({
  spreadsheetId: z.string().describe("The ID of the spreadsheet to update"),
  range: z.string().describe('The range of cells to update (e.g., "Sheet1!A1:B2")'),
  values: z.array(z.array(z.string())).describe("The values to update in the specified range"),
  siteId: z.string().describe("The ID of the site where the spreadsheet is located").optional(),
});

export type microsoftUpdateSpreadsheetParamsType = z.infer<typeof microsoftUpdateSpreadsheetParamsSchema>;

export const microsoftUpdateSpreadsheetOutputSchema = z.object({
  success: z.boolean().describe("Whether the spreadsheet was updated successfully"),
  error: z.string().describe("The error that occurred if the update was not successful").optional(),
  updatedRange: z.string().describe("The range that was updated in the spreadsheet").optional(),
});

export type microsoftUpdateSpreadsheetOutputType = z.infer<typeof microsoftUpdateSpreadsheetOutputSchema>;
export type microsoftUpdateSpreadsheetFunction = ActionFunction<
  microsoftUpdateSpreadsheetParamsType,
  AuthParamsType,
  microsoftUpdateSpreadsheetOutputType
>;

export const microsoftMessageTeamsChatParamsSchema = z.object({
  chatId: z.string().describe("The chat ID of the Microsoft Teams chat"),
  message: z.string().describe("The text to be messaged to the chat"),
});

export type microsoftMessageTeamsChatParamsType = z.infer<typeof microsoftMessageTeamsChatParamsSchema>;

export const microsoftMessageTeamsChatOutputSchema = z.object({
  success: z.boolean().describe("Whether the message was sent successfully"),
  error: z.string().describe("The error that occurred if the message was not sent successfully").optional(),
  messageId: z.string().describe("The ID of the message that was sent").optional(),
});

export type microsoftMessageTeamsChatOutputType = z.infer<typeof microsoftMessageTeamsChatOutputSchema>;
export type microsoftMessageTeamsChatFunction = ActionFunction<
  microsoftMessageTeamsChatParamsType,
  AuthParamsType,
  microsoftMessageTeamsChatOutputType
>;

export const microsoftMessageTeamsChannelParamsSchema = z.object({
  teamId: z.string().describe("The team ID of the Microsoft Teams channel"),
  channelId: z.string().describe("The channel ID of the Microsoft Teams channel"),
  message: z.string().describe("The text to be messaged to the channel"),
});

export type microsoftMessageTeamsChannelParamsType = z.infer<typeof microsoftMessageTeamsChannelParamsSchema>;

export const microsoftMessageTeamsChannelOutputSchema = z.object({
  success: z.boolean().describe("Whether the message was sent successfully"),
  error: z.string().describe("The error that occurred if the message was not sent successfully").optional(),
  messageId: z.string().describe("The ID of the message that was sent").optional(),
});

export type microsoftMessageTeamsChannelOutputType = z.infer<typeof microsoftMessageTeamsChannelOutputSchema>;
export type microsoftMessageTeamsChannelFunction = ActionFunction<
  microsoftMessageTeamsChannelParamsType,
  AuthParamsType,
  microsoftMessageTeamsChannelOutputType
>;

export const microsoftGetDocumentParamsSchema = z.object({
  siteId: z.string().describe("The ID of the site where the document is located (optional for OneDrive)").optional(),
  documentId: z.string().describe("The ID of the document to retrieve"),
});

export type microsoftGetDocumentParamsType = z.infer<typeof microsoftGetDocumentParamsSchema>;

export const microsoftGetDocumentOutputSchema = z.object({
  success: z.boolean().describe("Whether the document was successfully retrieved"),
  content: z.string().describe("The content of the document").optional(),
  error: z.string().describe("The error that occurred if the document was not successfully retrieved").optional(),
});

export type microsoftGetDocumentOutputType = z.infer<typeof microsoftGetDocumentOutputSchema>;
export type microsoftGetDocumentFunction = ActionFunction<
  microsoftGetDocumentParamsType,
  AuthParamsType,
  microsoftGetDocumentOutputType
>;

export const githubCreateOrUpdateFileParamsSchema = z.object({
  repositoryOwner: z.string().describe("The owner of the repository"),
  repositoryName: z.string().describe("The name of the repository"),
  filePath: z.string().describe("The path of the file to create or update"),
  branch: z.string().describe("The branch where the file will be created or updated"),
  fileContent: z.string().describe("The content of the file"),
  commitMessage: z.string().describe("The commit message for the operation"),
  noOverwrite: z.boolean().describe("Whether to prevent overwriting existing files").optional(),
});

export type githubCreateOrUpdateFileParamsType = z.infer<typeof githubCreateOrUpdateFileParamsSchema>;

export const githubCreateOrUpdateFileOutputSchema = z.object({
  success: z.boolean().describe("Whether the operation was successful"),
  error: z.string().describe("The error that occurred if the operation was not successful").optional(),
  newCommitSha: z.string().describe("The SHA of the new commit created").optional(),
  operation: z.enum(["created", "updated"]).describe("Indicates whether the file was created or updated").optional(),
});

export type githubCreateOrUpdateFileOutputType = z.infer<typeof githubCreateOrUpdateFileOutputSchema>;
export type githubCreateOrUpdateFileFunction = ActionFunction<
  githubCreateOrUpdateFileParamsType,
  AuthParamsType,
  githubCreateOrUpdateFileOutputType
>;

export const githubCreateBranchParamsSchema = z.object({
  repositoryOwner: z.string().describe("The owner of the repository"),
  repositoryName: z.string().describe("The name of the repository"),
  branchName: z.string().describe("The name of the new branch to create"),
  baseRefOrHash: z.string().describe("The ref or hash of the base commit to create the new branch from"),
});

export type githubCreateBranchParamsType = z.infer<typeof githubCreateBranchParamsSchema>;

export const githubCreateBranchOutputSchema = z.object({
  success: z.boolean().describe("Whether the branch was created successfully"),
  error: z.string().describe("The error that occurred if the branch was not created successfully").optional(),
});

export type githubCreateBranchOutputType = z.infer<typeof githubCreateBranchOutputSchema>;
export type githubCreateBranchFunction = ActionFunction<
  githubCreateBranchParamsType,
  AuthParamsType,
  githubCreateBranchOutputType
>;

export const githubCreatePullRequestParamsSchema = z.object({
  repositoryOwner: z.string().describe("The owner of the repository"),
  repositoryName: z.string().describe("The name of the repository"),
  head: z
    .string()
    .describe(
      "The branch containing the changes to be merged (prefix with owner: if different from the repository owner)",
    ),
  base: z.string().describe("The branch to merge the changes into"),
  title: z.string().describe("The title of the pull request"),
  description: z.string().describe("The description of the pull request").optional(),
});

export type githubCreatePullRequestParamsType = z.infer<typeof githubCreatePullRequestParamsSchema>;

export const githubCreatePullRequestOutputSchema = z.object({
  success: z.boolean().describe("Whether the pull request was created successfully"),
  error: z.string().describe("The error that occurred if the pull request was not created successfully").optional(),
  pullRequestUrl: z.string().describe("The URL of the created pull request").optional(),
  pullRequestNumber: z.number().describe("The number of the created pull request").optional(),
});

export type githubCreatePullRequestOutputType = z.infer<typeof githubCreatePullRequestOutputSchema>;
export type githubCreatePullRequestFunction = ActionFunction<
  githubCreatePullRequestParamsType,
  AuthParamsType,
  githubCreatePullRequestOutputType
>;

export const githubListPullRequestsParamsSchema = z.object({
  repositoryOwner: z.string().describe("The owner of the repository"),
  repositoryName: z.string().describe("The name of the repository"),
  state: z.string().describe("The state of the pull requests to list (e.g., open, closed)").optional(),
});

export type githubListPullRequestsParamsType = z.infer<typeof githubListPullRequestsParamsSchema>;

export const githubListPullRequestsOutputSchema = z.object({
  pullRequests: z
    .array(
      z.object({
        number: z.number().describe("The number of the pull request").optional(),
        title: z.string().describe("The title of the pull request").optional(),
        state: z.string().describe("The state of the pull request (e.g., open, closed)").optional(),
        url: z.string().describe("The URL of the pull request").optional(),
        createdAt: z.string().describe("The date and time when the pull request was created").optional(),
        updatedAt: z.string().describe("The date and time when the pull request was last updated").optional(),
        user: z
          .object({ login: z.string().describe("The username of the user who created the pull request").optional() })
          .optional(),
        description: z.string().describe("The description of the pull request").optional(),
      }),
    )
    .describe("A list of pull requests in the repository"),
});

export type githubListPullRequestsOutputType = z.infer<typeof githubListPullRequestsOutputSchema>;
export type githubListPullRequestsFunction = ActionFunction<
  githubListPullRequestsParamsType,
  AuthParamsType,
  githubListPullRequestsOutputType
>;

export const notionSearchByTitleParamsSchema = z.object({
  query: z.string().describe("The query to search for in Notion titles"),
});

export type notionSearchByTitleParamsType = z.infer<typeof notionSearchByTitleParamsSchema>;

export const notionSearchByTitleOutputSchema = z.object({
  success: z.boolean().describe("Whether the search was successful"),
  results: z
    .array(
      z.object({
        id: z.string().describe("The Notion page ID"),
        title: z.string().nullable().describe("The page title").optional(),
        url: z.string().describe("The URL to the Notion page"),
      }),
    )
    .describe("List of matching Notion pages")
    .optional(),
  error: z.string().describe("Error message if search failed").optional(),
});

export type notionSearchByTitleOutputType = z.infer<typeof notionSearchByTitleOutputSchema>;
export type notionSearchByTitleFunction = ActionFunction<
  notionSearchByTitleParamsType,
  AuthParamsType,
  notionSearchByTitleOutputType
>;
