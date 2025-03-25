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
          z.any().superRefine((x, ctx) => {
            const schemas = [
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
              z
                .object({
                  deleteSheet: z.object({}).catchall(z.any()).describe("Empty object indicating success").optional(),
                })
                .describe("Reply to deleting a sheet"),
              z
                .object({
                  updateCells: z
                    .object({
                      updatedRange: z.string().describe("The range that was updated").optional(),
                      updatedRows: z.number().int().describe("The number of rows updated").optional(),
                      updatedColumns: z.number().int().describe("The number of columns updated").optional(),
                      updatedCells: z.number().int().describe("The number of cells updated").optional(),
                    })
                    .optional(),
                })
                .describe("Reply to updating cells"),
              z
                .object({
                  updateSheetProperties: z
                    .object({
                      properties: z
                        .object({
                          sheetId: z.number().int().describe("The ID of the updated sheet").optional(),
                          title: z.string().describe("The new title of the sheet").optional(),
                          index: z.number().int().describe("The new index of the sheet").optional(),
                        })
                        .optional(),
                    })
                    .optional(),
                })
                .describe("Reply to updating sheet properties"),
              z
                .object({
                  updateSpreadsheetProperties: z
                    .object({
                      properties: z
                        .object({
                          title: z.string().describe("The new title of the spreadsheet").optional(),
                          locale: z.string().describe("The new locale of the spreadsheet").optional(),
                          timeZone: z.string().describe("The new time zone of the spreadsheet").optional(),
                          autoRecalc: z.string().describe("The new auto-recalculation setting").optional(),
                        })
                        .optional(),
                    })
                    .optional(),
                })
                .describe("Reply to updating spreadsheet properties"),
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
