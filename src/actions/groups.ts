import {
  confluenceOverwritePageDefinition,
  credalCallCopilotDefinition,
  googlemapsValidateAddressDefinition,
  mathAddDefinition,
  mongoInsertMongoDocDefinition,
  slackListConversationsDefinition,
  slackSendMessageDefinition,
  snowflakeGetRowByFieldValueDefinition,
  zendeskCreateZendeskTicketDefinition,
  openstreetmapGetLatitudeLongitudeFromLocationDefinition,
  nwsGetForecastForLocationDefinition,
  jiraCreateJiraTicketDefinition,
  googlemapsNearbysearchRestaurantsDefinition,
  firecrawlScrapeUrlDefinition,
  resendSendEmailDefinition,
  linkedinCreateShareLinkedinPostUrlDefinition,
  googleOauthCreateNewGoogleDocDefinition,
  xCreateShareXPostUrlDefinition,
  firecrawlScrapeTweetDataWithNitterDefinition,
  finnhubSymbolLookupDefinition,
  finnhubGetBasicFinancialsDefinition,
  confluenceFetchPageContentDefinition,
  snowflakeRunSnowflakeQueryDefinition,
  lookerEnableUserByEmailDefinition,
} from "../actions/autogen/templates";
import { ActionTemplate } from "../actions/parse";

export type ActionGroups = Record<string, { description: string; actions: ActionTemplate[] }>;

export const ACTION_GROUPS: ActionGroups = {
  SLACK_LIST_CONVERSATIONS: {
    description: "Actions for interacting with Slack",
    actions: [slackListConversationsDefinition, slackSendMessageDefinition],
  },
  CONFLUENCE: {
    description: "Action for interacting with Confluence",
    actions: [confluenceOverwritePageDefinition, confluenceFetchPageContentDefinition],
  },
  MATH_ADD: {
    description: "Action for adding two numbers",
    actions: [mathAddDefinition],
  },
  GOOGLE_MAPS: {
    description: "Action for interacting with Google Maps",
    actions: [googlemapsValidateAddressDefinition, googlemapsNearbysearchRestaurantsDefinition],
  },
  GOOGLE_DRIVE: {
    description: "Action for interacting with Google Drive",
    actions: [googleOauthCreateNewGoogleDocDefinition],
  },
  CREDAL_CALL_COPILOT: {
    description: "Action for calling a Credal Copilot",
    actions: [credalCallCopilotDefinition],
  },
  LINKEDIN_SHARE_POST: {
    description: "Action for creating a share post url on linkedin",
    actions: [linkedinCreateShareLinkedinPostUrlDefinition],
  },
  ZENDESK_CREATE_TICKET: {
    description: "Action for creating a Zendesk ticket",
    actions: [zendeskCreateZendeskTicketDefinition],
  },
  MONGO_INSERT_DOC: {
    description: "Action for inserting a document into a MongoDB collection",
    actions: [mongoInsertMongoDocDefinition],
  },
  SNOWFLAKE_ACTIONS: {
    description: "Action for getting content from a Snowflake table",
    actions: [snowflakeGetRowByFieldValueDefinition, snowflakeRunSnowflakeQueryDefinition],
  },
  JIRA_CREATE_TICKET: {
    description: "Action for creating a Jira ticket",
    actions: [jiraCreateJiraTicketDefinition],
  },
  OPENSTREETMAP_GET_LATITUDE_LONGITUDE_FROM_LOCATION: {
    description: "Action for getting the latitude and longitude of a location",
    actions: [openstreetmapGetLatitudeLongitudeFromLocationDefinition],
  },
  NWS_GET_FORECAST_FOR_LOCATION: {
    description: "Action for getting the weather forecast for a location",
    actions: [nwsGetForecastForLocationDefinition],
  },
  FIRECRAWL: {
    description: "Actions for interacting with Firecrawl",
    actions: [firecrawlScrapeUrlDefinition, firecrawlScrapeTweetDataWithNitterDefinition],
  },
  RESEND: {
    description: "Action for sending an email",
    actions: [resendSendEmailDefinition],
  },
  X: {
    description: "Actions for interacting with X(formerly twitter)",
    actions: [xCreateShareXPostUrlDefinition],
  },
  FINNHUB: {
    description: "Action for interacting with Finnhub for stock market data",
    actions: [finnhubSymbolLookupDefinition, finnhubGetBasicFinancialsDefinition],
  },
  LOOKER: {
    description: "Actions for interacting with Looker",
    actions: [lookerEnableUserByEmailDefinition],
  },
};
