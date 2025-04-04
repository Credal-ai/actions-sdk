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

export const slackSendMessageParamsSchema = z.object({
  channelName: z.string().describe("The name of the Slack channel to send the message to (e.g. general, alerts)"),
  message: z.string().describe("The message content to send to Slack. Can include markdown formatting."),
});

export type slackSendMessageParamsType = z.infer<typeof slackSendMessageParamsSchema>;

export const slackSendMessageOutputSchema = z.void();

export type slackSendMessageOutputType = z.infer<typeof slackSendMessageOutputSchema>;
export type slackSendMessageFunction = ActionFunction<
  slackSendMessageParamsType,
  AuthParamsType,
  slackSendMessageOutputType
>;

export const slackListConversationsParamsSchema = z.object({});

export type slackListConversationsParamsType = z.infer<typeof slackListConversationsParamsSchema>;

export const slackListConversationsOutputSchema = z.object({
  channels: z
    .array(
      z
        .object({
          id: z.string().describe("The ID of the channel"),
          name: z.string().describe("The name of the channel"),
          topic: z.string().describe("The topic of the channel"),
          purpose: z.string().describe("The purpose of the channel"),
        })
        .describe("A channel in Slack"),
    )
    .describe("A list of channels in Slack"),
});

export type slackListConversationsOutputType = z.infer<typeof slackListConversationsOutputSchema>;
export type slackListConversationsFunction = ActionFunction<
  slackListConversationsParamsType,
  AuthParamsType,
  slackListConversationsOutputType
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
  user: z.string().describe("The user to authenticate with").optional(),
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
  user: z.string().describe("The username to authenticate with"),
  accountName: z.string().describe("The name of the Snowflake account"),
  outputFormat: z.enum(["json", "csv"]).describe("The format of the output").optional(),
});

export type snowflakeRunSnowflakeQueryParamsType = z.infer<typeof snowflakeRunSnowflakeQueryParamsSchema>;

export const snowflakeRunSnowflakeQueryOutputSchema = z.object({
  format: z.enum(["json", "csv"]).describe("The format of the output"),
  content: z.string().describe("The content of the query result (json)"),
  rowCount: z.number().describe("The number of rows returned by the query"),
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
  fieldsToUpdate: z.record(z.string()).describe("The fields to update on the record"),
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
