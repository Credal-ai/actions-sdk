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
  slackGetChannelMessagesOutputSchema,
  slackGetChannelMessagesParamsSchema,
  snowflakeGetRowByFieldValueOutputSchema,
  snowflakeGetRowByFieldValueParamsSchema,
  zendeskCreateZendeskTicketOutputSchema,
  zendeskCreateZendeskTicketParamsSchema,
  zendeskGetTicketDetailsOutputSchema,
  zendeskGetTicketDetailsParamsSchema,
  jiraAssignJiraTicketParamsSchema,
  jiraAssignJiraTicketOutputSchema,
  zendeskUpdateTicketStatusOutputSchema,
  zendeskUpdateTicketStatusParamsSchema,
  zendeskAddCommentToTicketOutputSchema,
  zendeskAddCommentToTicketParamsSchema,
  zendeskAssignTicketOutputSchema,
  zendeskAssignTicketParamsSchema,
  jiraCommentJiraTicketParamsSchema,
  jiraCommentJiraTicketOutputSchema,
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
  lookerEnableUserByEmailParamsSchema,
  lookerEnableUserByEmailOutputSchema,
  googleOauthUpdateDocParamsSchema,
  googleOauthUpdateDocOutputSchema,
  googleOauthCreateSpreadsheetParamsSchema,
  googleOauthCreateSpreadsheetOutputSchema,
  googleOauthScheduleCalendarMeetingParamsSchema,
  googleOauthScheduleCalendarMeetingOutputSchema,
  ashbyCreateNoteParamsSchema,
  ashbyCreateNoteOutputSchema,
  ashbyGetCandidateInfoParamsSchema,
  ashbyGetCandidateInfoOutputSchema,
  googleOauthUpdateSpreadsheetParamsSchema,
  googleOauthUpdateSpreadsheetOutputSchema,
} from "./autogen/types";
import callCopilot from "./providers/credal/callCopilot";
import validateAddress from "./providers/googlemaps/validateAddress";
import add from "./providers/math/add";
import insertMongoDoc from "./providers/mongodb/insertMongoDoc";
import listConversations from "./providers/slack/listConversations";
import sendMessage from "./providers/slack/sendMessage";
import getChannelMessages from "./providers/slack/getChannelMessages";
import getRowByFieldValue from "./providers/snowflake/getRowByFieldValue";
import createZendeskTicket from "./providers/zendesk/createZendeskTicket";
import getZendeskTicketDetails from "./providers/zendesk/getTicketDetails";
import assignJiraTicket from "./providers/jira/assignJiraTicket";
import updateTicketStatus from "./providers/zendesk/updateTicketStatus";
import addCommentToTicket from "./providers/zendesk/addCommentToTicket";
import assignTicket from "./providers/zendesk/assignTicket";
import commentJiraTicket from "./providers/jira/commentJiraTicket";
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
import enableUserByEmail from "./providers/looker/enableUserByEmail";
import updateDoc from "./providers/google-oauth/updateDoc";
import scheduleCalendarMeeting from "./providers/google-oauth/scheduleCalendarMeeting";
import createNote from "./providers/ashby/createNote";
import getCandidateInfo from "./providers/ashby/getCandidateInfo";
import createSpreadsheet from "./providers/google-oauth/createSpreadsheet";
import updateSpreadsheet from "./providers/google-oauth/updateSpreadsheet";

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
    getChannelMessages: {
      fn: getChannelMessages,
      paramsSchema: slackGetChannelMessagesParamsSchema,
      outputSchema: slackGetChannelMessagesOutputSchema,
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
    getTicketDetails: {
      fn: getZendeskTicketDetails,
      paramsSchema: zendeskGetTicketDetailsParamsSchema,
      outputSchema: zendeskGetTicketDetailsOutputSchema,
    },
    updateTicketStatus: {
      fn: updateTicketStatus,
      paramsSchema: zendeskUpdateTicketStatusParamsSchema,
      outputSchema: zendeskUpdateTicketStatusOutputSchema,
    },
    addCommentToTicket: {
      fn: addCommentToTicket,
      paramsSchema: zendeskAddCommentToTicketParamsSchema,
      outputSchema: zendeskAddCommentToTicketOutputSchema,
    },
    assignTicket: {
      fn: assignTicket,
      paramsSchema: zendeskAssignTicketParamsSchema,
      outputSchema: zendeskAssignTicketOutputSchema,
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
    assignJiraTicket: {
      fn: assignJiraTicket,
      paramsSchema: jiraAssignJiraTicketParamsSchema,
      outputSchema: jiraAssignJiraTicketOutputSchema,
    },
    commentJiraTicket: {
      fn: commentJiraTicket,
      paramsSchema: jiraCommentJiraTicketParamsSchema,
      outputSchema: jiraCommentJiraTicketOutputSchema,
    },
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
    updateDoc: {
      fn: updateDoc,
      paramsSchema: googleOauthUpdateDocParamsSchema,
      outputSchema: googleOauthUpdateDocOutputSchema,
    },
    scheduleCalendarMeeting: {
      fn: scheduleCalendarMeeting,
      paramsSchema: googleOauthScheduleCalendarMeetingParamsSchema,
      outputSchema: googleOauthScheduleCalendarMeetingOutputSchema,
    },
    createSpreadsheet: {
      fn: createSpreadsheet,
      paramsSchema: googleOauthCreateSpreadsheetParamsSchema,
      outputSchema: googleOauthCreateSpreadsheetOutputSchema,
    },
    updateSpreadsheet: {
      fn: updateSpreadsheet,
      paramsSchema: googleOauthUpdateSpreadsheetParamsSchema,
      outputSchema: googleOauthUpdateSpreadsheetOutputSchema,
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
  looker: {
    enableUserByEmail: {
      fn: enableUserByEmail,
      paramsSchema: lookerEnableUserByEmailParamsSchema,
      outputSchema: lookerEnableUserByEmailOutputSchema,
    },
  },
  ashby: {
    createNote: {
      fn: createNote,
      paramsSchema: ashbyCreateNoteParamsSchema,
      outputSchema: ashbyCreateNoteOutputSchema,
    },
    getCandidateInfo: {
      fn: getCandidateInfo,
      paramsSchema: ashbyGetCandidateInfoParamsSchema,
      outputSchema: ashbyGetCandidateInfoOutputSchema,
    },
  },
};
