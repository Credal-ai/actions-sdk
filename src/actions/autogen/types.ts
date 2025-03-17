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
  requesterEmail: z.string().describe("The email of the requester"),
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
