import { z } from "zod";
import {
  type ActionFunction,
  confluenceOverwritePageParamsSchema,
  confluenceOverwritePageOutputSchema,
  credalCallCopilotOutputSchema,
  credalCallCopilotParamsSchema,
  googlemapsValidateAddressOutputSchema,
  googlemapsValidateAddressParamsSchema,
  googleOauthCreateNewGoogleDocParamsSchema,
  googleOauthCreateNewGoogleDocOutputSchema,
  mathAddOutputSchema,
  mathAddParamsSchema,
  mongoInsertMongoDocOutputSchema,
  mongoInsertMongoDocParamsSchema,
  slackListConversationsOutputSchema,
  slackListConversationsParamsSchema,
  slackSendMessageOutputSchema,
  slackSendMessageParamsSchema,
  snowflakeGetRowByFieldValueOutputSchema,
  snowflakeGetRowByFieldValueParamsSchema,
  zendeskCreateZendeskTicketOutputSchema,
  zendeskCreateZendeskTicketParamsSchema,
  jiraCreateJiraTicketParamsSchema,
  jiraCreateJiraTicketOutputSchema,
  openstreetmapGetLatitudeLongitudeFromLocationParamsSchema,
  openstreetmapGetLatitudeLongitudeFromLocationOutputSchema,
  nwsGetForecastForLocationParamsSchema,
  nwsGetForecastForLocationOutputSchema,
  googlemapsNearbysearchRestaurantsOutputSchema,
  googlemapsNearbysearchRestaurantsParamsSchema,
  firecrawlScrapeUrlOutputSchema,
  firecrawlScrapeUrlParamsSchema,
  resendSendEmailOutputSchema,
  firecrawlScrapeTweetDataWithNitterParamsSchema,
  firecrawlScrapeTweetDataWithNitterOutputSchema,
  resendSendEmailParamsSchema,
  linkedinCreateShareLinkedinPostUrlParamsSchema,
  linkedinCreateShareLinkedinPostUrlOutputSchema,
  xCreateShareXPostUrlParamsSchema,
  xCreateShareXPostUrlOutputSchema,
  finnhubSymbolLookupParamsSchema,
  finnhubSymbolLookupOutputSchema,
  finnhubGetBasicFinancialsParamsSchema,
  finnhubGetBasicFinancialsOutputSchema,
  confluenceFetchPageContentParamsSchema,
  confluenceFetchPageContentOutputSchema,
  snowflakeRunSnowflakeQueryParamsSchema,
  snowflakeRunSnowflakeQueryOutputSchema,
} from "./autogen/types";
import callCopilot from "./providers/credal/callCopilot";
import validateAddress from "./providers/googlemaps/validateAddress";
import add from "./providers/math/add";
import insertMongoDoc from "./providers/mongodb/insertMongoDoc";
import listConversations from "./providers/slack/listConversations";
import sendMessage from "./providers/slack/sendMessage";
import getRowByFieldValue from "./providers/snowflake/getRowByFieldValue";
import createZendeskTicket from "./providers/zendesk/createZendeskTicket";
import createJiraTicket from "./providers/jira/createJiraTicket";
import getLatitudeLongitudeFromLocation from "./providers/openstreetmap/getLatitudeLongitudeFromLocation";
import getForecastForLocation from "./providers/nws/getForecastForLocation";
import nearbysearch from "./providers/googlemaps/nearbysearchRestaurants";
import scrapeUrl from "./providers/firecrawl/scrapeUrl";
import sendEmail from "./providers/resend/sendEmail";
import createShareLinkedinPostUrl from "./providers/linkedin/createSharePostLinkedinUrl";
import createNewGoogleDoc from "./providers/google-oauth/createNewGoogleDoc";
import createXSharePostUrl from "./providers/x/createXSharePostUrl";
import scrapeTweetDataWithNitter from "./providers/firecrawl/scrapeTweetDataWithNitter";
import symbolLookup from "./providers/finnhub/symbolLookup";
import getBasicFinancials from "./providers/finnhub/getBasicFinancials";
import confluenceOverwritePage from "./providers/confluence/overwritePage";
import confluenceFetchPageContent from "./providers/confluence/fetchPageContent";
import runSnowflakeQuery from "./providers/snowflake/runSnowflakeQuery";

interface ActionFunctionComponents {
  // eslint-disable-next-line
  fn: ActionFunction<any, any, any>;
  paramsSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
}

export const ActionMapper: Record<string, Record<string, ActionFunctionComponents>> = {
  math: {
    add: {
      fn: add,
      paramsSchema: mathAddParamsSchema,
      outputSchema: mathAddOutputSchema,
    },
  },
  slack: {
    listConversations: {
      fn: listConversations,
      paramsSchema: slackListConversationsParamsSchema,
      outputSchema: slackListConversationsOutputSchema,
    },
    sendMessage: {
      fn: sendMessage,
      paramsSchema: slackSendMessageParamsSchema,
      outputSchema: slackSendMessageOutputSchema,
    },
  },
  confluence: {
    overwritePage: {
      fn: confluenceOverwritePage,
      paramsSchema: confluenceOverwritePageParamsSchema,
      outputSchema: confluenceOverwritePageOutputSchema,
    },
    fetchPageContent: {
      fn: confluenceFetchPageContent,
      paramsSchema: confluenceFetchPageContentParamsSchema,
      outputSchema: confluenceFetchPageContentOutputSchema,
    },
  },
  googlemaps: {
    validateAddress: {
      fn: validateAddress,
      paramsSchema: googlemapsValidateAddressParamsSchema,
      outputSchema: googlemapsValidateAddressOutputSchema,
    },
    nearbysearch: {
      fn: nearbysearch,
      paramsSchema: googlemapsNearbysearchRestaurantsParamsSchema,
      outputSchema: googlemapsNearbysearchRestaurantsOutputSchema,
    },
  },
  credal: {
    callCopilot: {
      fn: callCopilot,
      paramsSchema: credalCallCopilotParamsSchema,
      outputSchema: credalCallCopilotOutputSchema,
    },
  },
  zendesk: {
    createZendeskTicket: {
      fn: createZendeskTicket,
      paramsSchema: zendeskCreateZendeskTicketParamsSchema,
      outputSchema: zendeskCreateZendeskTicketOutputSchema,
    },
  },
  mongo: {
    insertMongoDoc: {
      fn: insertMongoDoc,
      paramsSchema: mongoInsertMongoDocParamsSchema,
      outputSchema: mongoInsertMongoDocOutputSchema,
    },
  },
  snowflake: {
    getRowByFieldValue: {
      fn: getRowByFieldValue,
      paramsSchema: snowflakeGetRowByFieldValueParamsSchema,
      outputSchema: snowflakeGetRowByFieldValueOutputSchema,
    },
    runSnowflakeQuery: {
      fn: runSnowflakeQuery,
      paramsSchema: snowflakeRunSnowflakeQueryParamsSchema,
      outputSchema: snowflakeRunSnowflakeQueryOutputSchema,
    },
  },
  linkedin: {
    createShareLinkedinPostUrl: {
      fn: createShareLinkedinPostUrl,
      paramsSchema: linkedinCreateShareLinkedinPostUrlParamsSchema,
      outputSchema: linkedinCreateShareLinkedinPostUrlOutputSchema,
    },
  },
  jira: {
    createJiraTicket: {
      fn: createJiraTicket,
      paramsSchema: jiraCreateJiraTicketParamsSchema,
      outputSchema: jiraCreateJiraTicketOutputSchema,
    },
  },
  openstreetmap: {
    getLatitudeLongitudeFromLocation: {
      fn: getLatitudeLongitudeFromLocation,
      paramsSchema: openstreetmapGetLatitudeLongitudeFromLocationParamsSchema,
      outputSchema: openstreetmapGetLatitudeLongitudeFromLocationOutputSchema,
    },
  },
  nws: {
    getForecastForLocation: {
      fn: getForecastForLocation,
      paramsSchema: nwsGetForecastForLocationParamsSchema,
      outputSchema: nwsGetForecastForLocationOutputSchema,
    },
  },
  firecrawl: {
    scrapeUrl: {
      fn: scrapeUrl,
      paramsSchema: firecrawlScrapeUrlParamsSchema,
      outputSchema: firecrawlScrapeUrlOutputSchema,
    },
    scrapeTweetDataWithNitter: {
      fn: scrapeTweetDataWithNitter,
      paramsSchema: firecrawlScrapeTweetDataWithNitterParamsSchema,
      outputSchema: firecrawlScrapeTweetDataWithNitterOutputSchema,
    },
  },
  resend: {
    sendEmail: {
      fn: sendEmail,
      paramsSchema: resendSendEmailParamsSchema,
      outputSchema: resendSendEmailOutputSchema,
    },
  },
  googleOauth: {
    createNewGoogleDoc: {
      fn: createNewGoogleDoc,
      paramsSchema: googleOauthCreateNewGoogleDocParamsSchema,
      outputSchema: googleOauthCreateNewGoogleDocOutputSchema,
    },
  },
  x: {
    createShareXPostUrl: {
      fn: createXSharePostUrl,
      paramsSchema: xCreateShareXPostUrlParamsSchema,
      outputSchema: xCreateShareXPostUrlOutputSchema,
    },
  },
  finnhub: {
    symbolLookup: {
      fn: symbolLookup,
      paramsSchema: finnhubSymbolLookupParamsSchema,
      outputSchema: finnhubSymbolLookupOutputSchema,
    },
    getBasicFinancials: {
      fn: getBasicFinancials,
      paramsSchema: finnhubGetBasicFinancialsParamsSchema,
      outputSchema: finnhubGetBasicFinancialsOutputSchema,
    },
  },
};
