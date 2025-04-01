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

export const jiraCommentJiraTicketParamsSchema = z.object({
  projectKey: z.string().describe("The key for the project you want to add it to"),
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
