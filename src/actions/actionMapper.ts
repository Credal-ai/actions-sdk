import type { z } from "zod";
import {
  type ActionFunction,
  genericFillTemplateParamsSchema,
  genericFillTemplateOutputSchema,
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
  zendeskUpdateTicketStatusOutputSchema,
  zendeskUpdateTicketStatusParamsSchema,
  zendeskAddCommentToTicketOutputSchema,
  zendeskAddCommentToTicketParamsSchema,
  zendeskAssignTicketOutputSchema,
  zendeskAssignTicketParamsSchema,
  zendeskListZendeskTicketsOutputSchema,
  zendeskListZendeskTicketsParamsSchema,
  jiraAssignJiraTicketParamsSchema,
  jiraAssignJiraTicketOutputSchema,
  jiraCommentJiraTicketParamsSchema,
  jiraCommentJiraTicketOutputSchema,
  jiraCreateJiraTicketParamsSchema,
  jiraCreateJiraTicketOutputSchema,
  jiraGetJiraTicketDetailsParamsSchema,
  jiraGetJiraTicketDetailsOutputSchema,
  jiraGetJiraTicketHistoryParamsSchema,
  jiraGetJiraTicketHistoryOutputSchema,
  jiraUpdateJiraTicketDetailsParamsSchema,
  jiraUpdateJiraTicketDetailsOutputSchema,
  jiraUpdateJiraTicketStatusParamsSchema,
  jiraUpdateJiraTicketStatusOutputSchema,
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
  googleOauthUpdateSpreadsheetParamsSchema,
  googleOauthUpdateSpreadsheetOutputSchema,
  googleOauthScheduleCalendarMeetingParamsSchema,
  googleOauthScheduleCalendarMeetingOutputSchema,
  googleOauthCreatePresentationParamsSchema,
  googleOauthCreatePresentationOutputSchema,
  googleOauthUpdatePresentationParamsSchema,
  googleOauthUpdatePresentationOutputSchema,
  googleOauthSearchDriveByKeywordsParamsSchema,
  googleOauthSearchDriveByKeywordsOutputSchema,
  ashbyCreateNoteParamsSchema,
  ashbyCreateNoteOutputSchema,
  ashbyGetCandidateInfoParamsSchema,
  ashbyGetCandidateInfoOutputSchema,
  salesforceUpdateRecordParamsSchema,
  salesforceUpdateRecordOutputSchema,
  salesforceCreateCaseParamsSchema,
  salesforceCreateCaseOutputSchema,
  salesforceGenerateSalesReportParamsSchema,
  salesforceGenerateSalesReportOutputSchema,
  salesforceGetRecordParamsSchema,
  salesforceGetRecordOutputSchema,
  ashbyListCandidatesParamsSchema,
  ashbyListCandidatesOutputSchema,
  ashbyListCandidateNotesParamsSchema,
  ashbyListCandidateNotesOutputSchema,
  ashbySearchCandidatesParamsSchema,
  ashbySearchCandidatesOutputSchema,
  ashbyCreateCandidateParamsSchema,
  ashbyCreateCandidateOutputSchema,
  ashbyUpdateCandidateParamsSchema,
  ashbyUpdateCandidateOutputSchema,
  microsoftMessageTeamsChatParamsSchema,
  microsoftMessageTeamsChatOutputSchema,
  microsoftMessageTeamsChannelParamsSchema,
  microsoftMessageTeamsChannelOutputSchema,
  salesforceGetSalesforceRecordsByQueryParamsSchema,
  salesforceGetSalesforceRecordsByQueryOutputSchema,
  asanaCommentTaskParamsSchema,
  asanaCommentTaskOutputSchema,
  asanaCreateTaskParamsSchema,
  asanaCreateTaskOutputSchema,
  asanaUpdateTaskParamsSchema,
  asanaUpdateTaskOutputSchema,
  githubCreateOrUpdateFileParamsSchema,
  githubCreateOrUpdateFileOutputSchema,
  githubCreateBranchParamsSchema,
  githubCreateBranchOutputSchema,
  githubCreatePullRequestParamsSchema,
  githubCreatePullRequestOutputSchema,
  microsoftUpdateSpreadsheetParamsSchema,
  microsoftUpdateSpreadsheetOutputSchema,
  microsoftUpdateDocumentParamsSchema,
  microsoftUpdateDocumentOutputSchema,
  microsoftGetDocumentParamsSchema,
  microsoftGetDocumentOutputSchema,
  salesforceFetchSalesforceSchemaByObjectParamsSchema,
  salesforceFetchSalesforceSchemaByObjectOutputSchema,
  githubListPullRequestsParamsSchema,
  githubListPullRequestsOutputSchema,
  jiraGetJiraIssuesByQueryOutputSchema,
  jiraGetJiraIssuesByQueryParamsSchema,
  salesforceCreateRecordParamsSchema,
  salesforceCreateRecordOutputSchema,
  firecrawlDeepResearchParamsSchema,
  firecrawlDeepResearchOutputSchema,
  bingGetTopNSearchResultUrlsParamsSchema,
  bingGetTopNSearchResultUrlsOutputSchema,
  ashbyAddCandidateToProjectParamsSchema,
  ashbyAddCandidateToProjectOutputSchema,
  microsoftCreateDocumentParamsSchema,
  microsoftCreateDocumentOutputSchema,
  kandjiGetFVRecoveryKeyForDeviceParamsSchema,
  kandjiGetFVRecoveryKeyForDeviceOutputSchema,
  asanaListAsanaTasksByProjectParamsSchema,
  asanaListAsanaTasksByProjectOutputSchema,
} from "./autogen/types";
import callCopilot from "./providers/credal/callCopilot";
import validateAddress from "./providers/googlemaps/validateAddress";
import add from "./providers/math/add";
import fillTemplate from "./providers/generic/fillTemplate";
import insertMongoDoc from "./providers/mongodb/insertMongoDoc";
import sendMessage from "./providers/slack/sendMessage";
import getChannelMessages from "./providers/slack/getChannelMessages";
import getRowByFieldValue from "./providers/snowflake/getRowByFieldValue";
import createZendeskTicket from "./providers/zendesk/createZendeskTicket";
import getZendeskTicketDetails from "./providers/zendesk/getTicketDetails";
import updateTicketStatus from "./providers/zendesk/updateTicketStatus";
import addCommentToTicket from "./providers/zendesk/addCommentToTicket";
import assignTicket from "./providers/zendesk/assignTicket";
import listZendeskTickets from "./providers/zendesk/listTickets";
import assignJiraTicket from "./providers/jira/assignJiraTicket";
import commentJiraTicket from "./providers/jira/commentJiraTicket";
import createJiraTicket from "./providers/jira/createJiraTicket";
import getJiraTicketDetails from "./providers/jira/getJiraTicketDetails";
import getJiraTicketHistory from "./providers/jira/getJiraTicketHistory";
import updateJiraTicketDetails from "./providers/jira/updateJiraTicketDetails";
import updateJiraTicketStatus from "./providers/jira/updateJiraTicketStatus";
import getLatitudeLongitudeFromLocation from "./providers/openstreetmap/getLatitudeLongitudeFromLocation";
import getForecastForLocation from "./providers/nws/getForecastForLocation";
import getSalesforceRecordsByQuery from "./providers/salesforce/getSalesforceRecordsByQuery";
import nearbysearch from "./providers/googlemaps/nearbysearchRestaurants";
import scrapeUrl from "./providers/firecrawl/scrapeUrl";
import sendEmail from "./providers/resend/sendEmail";
import commentAsanaTask from "./providers/asana/commentAsanaTask";
import createAsanaTask from "./providers/asana/createAsanaTask";
import updateAsanaTask from "./providers/asana/updateAsanaTask";
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
import createSpreadsheet from "./providers/google-oauth/createSpreadsheet";
import updateSpreadsheet from "./providers/google-oauth/updateSpreadsheet";
import createPresentation from "./providers/google-oauth/createPresentation";
import updatePresentation from "./providers/google-oauth/updatePresentation";
import createNote from "./providers/ashby/createNote";
import getCandidateInfo from "./providers/ashby/getCandidateInfo";
import updateRecord from "./providers/salesforce/updateRecord";
import createCase from "./providers/salesforce/createCase";
import generateSalesReport from "./providers/salesforce/generateSalesReport";
import getRecord from "./providers/salesforce/getRecord";
import listCandidates from "./providers/ashby/listCandidates";
import listCandidateNotes from "./providers/ashby/listCandidateNotes";
import searchCandidates from "./providers/ashby/searchCandidates";
import createCandidate from "./providers/ashby/createCandidate";
import updateCandidate from "./providers/ashby/updateCandidate";
import addCandidateToProject from "./providers/ashby/addCandidateToProject";
import sendMessageToTeamsChat from "./providers/microsoft/messageTeamsChat";
import sendMessageToTeamsChannel from "./providers/microsoft/messageTeamsChannel";
import createOrUpdateFile from "./providers/github/createOrUpdateFile";
import createBranch from "./providers/github/createBranch";
import createPullRequest from "./providers/github/createPullRequest";
import microsoftUpdateSpreadsheet from "./providers/microsoft/updateSpreadsheet";
import updateDocument from "./providers/microsoft/updateDocument";
import createDocument from "./providers/microsoft/createDocument";
import getDocument from "./providers/microsoft/getDocument";
import fetchSalesforceSchemaByObject from "./providers/salesforce/fetchSalesforceSchema";
import deepResearch from "./providers/firecrawl/deepResearch";
import listPullRequests from "./providers/github/listPullRequests";
import getJiraIssuesByQuery from "./providers/jira/getJiraIssuesByQuery";
import createRecord from "./providers/salesforce/createRecord";
import getTopNSearchResultUrls from "./providers/bing/getTopNSearchResultUrls";
import getGongTranscripts from "./providers/gong/getGongTranscripts";
import searchDriveByKeywords from "./providers/google-oauth/searchDriveByKeywords";
import { gongGetGongTranscriptsParamsSchema, gongGetGongTranscriptsOutputSchema } from "./autogen/types";
import getFVRecoveryKeyForDevice from "./providers/kandji/getFVRecoveryKeyForDevice";
import listAsanaTasksByProject from "./providers/asana/listAsanaTasksByProject";

interface ActionFunctionComponents {
  // eslint-disable-next-line
  fn: ActionFunction<any, any, any>;
  paramsSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
}

export const ActionMapper: Record<string, Record<string, ActionFunctionComponents>> = {
  generic: {
    fillTemplate: {
      fn: fillTemplate,
      paramsSchema: genericFillTemplateParamsSchema,
      outputSchema: genericFillTemplateOutputSchema,
    },
  },
  asana: {
    commentTask: {
      fn: commentAsanaTask,
      paramsSchema: asanaCommentTaskParamsSchema,
      outputSchema: asanaCommentTaskOutputSchema,
    },
    createTask: {
      fn: createAsanaTask,
      paramsSchema: asanaCreateTaskParamsSchema,
      outputSchema: asanaCreateTaskOutputSchema,
    },
    updateTask: {
      fn: updateAsanaTask,
      paramsSchema: asanaUpdateTaskParamsSchema,
      outputSchema: asanaUpdateTaskOutputSchema,
    },
    listAsanaTasksByProject: {
      fn: listAsanaTasksByProject,
      paramsSchema: asanaListAsanaTasksByProjectParamsSchema,
      outputSchema: asanaListAsanaTasksByProjectOutputSchema,
    },
  },
  math: {
    add: {
      fn: add,
      paramsSchema: mathAddParamsSchema,
      outputSchema: mathAddOutputSchema,
    },
  },
  slack: {
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
  kandji: {
    getFVRecoveryKeyForDevice: {
      fn: getFVRecoveryKeyForDevice,
      paramsSchema: kandjiGetFVRecoveryKeyForDeviceParamsSchema,
      outputSchema: kandjiGetFVRecoveryKeyForDeviceOutputSchema,
    },
  },
  bing: {
    getTopNSearchResultUrls: {
      fn: getTopNSearchResultUrls,
      paramsSchema: bingGetTopNSearchResultUrlsParamsSchema,
      outputSchema: bingGetTopNSearchResultUrlsOutputSchema,
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
    listZendeskTickets: {
      fn: listZendeskTickets,
      paramsSchema: zendeskListZendeskTicketsParamsSchema,
      outputSchema: zendeskListZendeskTicketsOutputSchema,
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
    getJiraIssuesByQuery: {
      fn: getJiraIssuesByQuery,
      paramsSchema: jiraGetJiraIssuesByQueryParamsSchema,
      outputSchema: jiraGetJiraIssuesByQueryOutputSchema,
    },
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
    getJiraTicketDetails: {
      fn: getJiraTicketDetails,
      paramsSchema: jiraGetJiraTicketDetailsParamsSchema,
      outputSchema: jiraGetJiraTicketDetailsOutputSchema,
    },
    getJiraTicketHistory: {
      fn: getJiraTicketHistory,
      paramsSchema: jiraGetJiraTicketHistoryParamsSchema,
      outputSchema: jiraGetJiraTicketHistoryOutputSchema,
    },
    updateJiraTicketDetails: {
      fn: updateJiraTicketDetails,
      paramsSchema: jiraUpdateJiraTicketDetailsParamsSchema,
      outputSchema: jiraUpdateJiraTicketDetailsOutputSchema,
    },
    updateJiraTicketStatus: {
      fn: updateJiraTicketStatus,
      paramsSchema: jiraUpdateJiraTicketStatusParamsSchema,
      outputSchema: jiraUpdateJiraTicketStatusOutputSchema,
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
    deepResearch: {
      fn: deepResearch,
      paramsSchema: firecrawlDeepResearchParamsSchema,
      outputSchema: firecrawlDeepResearchOutputSchema,
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
    createPresentation: {
      fn: createPresentation,
      paramsSchema: googleOauthCreatePresentationParamsSchema,
      outputSchema: googleOauthCreatePresentationOutputSchema,
    },
    updatePresentation: {
      fn: updatePresentation,
      paramsSchema: googleOauthUpdatePresentationParamsSchema,
      outputSchema: googleOauthUpdatePresentationOutputSchema,
    },
    searchDriveByKeywords: {
      fn: searchDriveByKeywords,
      paramsSchema: googleOauthSearchDriveByKeywordsParamsSchema,
      outputSchema: googleOauthSearchDriveByKeywordsOutputSchema,
    },
  },
  x: {
    createShareXPostUrl: {
      fn: createXSharePostUrl,
      paramsSchema: xCreateShareXPostUrlParamsSchema,
      outputSchema: xCreateShareXPostUrlOutputSchema,
    },
  },
  gong: {
    getGongTranscripts: {
      fn: getGongTranscripts,
      paramsSchema: gongGetGongTranscriptsParamsSchema,
      outputSchema: gongGetGongTranscriptsOutputSchema,
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
    listCandidates: {
      fn: listCandidates,
      paramsSchema: ashbyListCandidatesParamsSchema,
      outputSchema: ashbyListCandidatesOutputSchema,
    },
    listCandidateNotes: {
      fn: listCandidateNotes,
      paramsSchema: ashbyListCandidateNotesParamsSchema,
      outputSchema: ashbyListCandidateNotesOutputSchema,
    },
    searchCandidates: {
      fn: searchCandidates,
      paramsSchema: ashbySearchCandidatesParamsSchema,
      outputSchema: ashbySearchCandidatesOutputSchema,
    },
    createCandidate: {
      fn: createCandidate,
      paramsSchema: ashbyCreateCandidateParamsSchema,
      outputSchema: ashbyCreateCandidateOutputSchema,
    },
    updateCandidate: {
      fn: updateCandidate,
      paramsSchema: ashbyUpdateCandidateParamsSchema,
      outputSchema: ashbyUpdateCandidateOutputSchema,
    },
    addCandidateToProject: {
      fn: addCandidateToProject,
      paramsSchema: ashbyAddCandidateToProjectParamsSchema,
      outputSchema: ashbyAddCandidateToProjectOutputSchema,
    },
  },
  salesforce: {
    updateRecord: {
      fn: updateRecord,
      paramsSchema: salesforceUpdateRecordParamsSchema,
      outputSchema: salesforceUpdateRecordOutputSchema,
    },
    createRecord: {
      fn: createRecord,
      paramsSchema: salesforceCreateRecordParamsSchema,
      outputSchema: salesforceCreateRecordOutputSchema,
    },
    createCase: {
      fn: createCase,
      paramsSchema: salesforceCreateCaseParamsSchema,
      outputSchema: salesforceCreateCaseOutputSchema,
    },
    generateSalesReport: {
      fn: generateSalesReport,
      paramsSchema: salesforceGenerateSalesReportParamsSchema,
      outputSchema: salesforceGenerateSalesReportOutputSchema,
    },
    getRecord: {
      fn: getRecord,
      paramsSchema: salesforceGetRecordParamsSchema,
      outputSchema: salesforceGetRecordOutputSchema,
    },
    getSalesforceRecordsByQuery: {
      fn: getSalesforceRecordsByQuery,
      paramsSchema: salesforceGetSalesforceRecordsByQueryParamsSchema,
      outputSchema: salesforceGetSalesforceRecordsByQueryOutputSchema,
    },
    fetchSalesforceSchemaByObject: {
      fn: fetchSalesforceSchemaByObject,
      paramsSchema: salesforceFetchSalesforceSchemaByObjectParamsSchema,
      outputSchema: salesforceFetchSalesforceSchemaByObjectOutputSchema,
    },
  },
  microsoft: {
    messageTeamsChat: {
      fn: sendMessageToTeamsChat,
      paramsSchema: microsoftMessageTeamsChatParamsSchema,
      outputSchema: microsoftMessageTeamsChatOutputSchema,
    },
    messageTeamsChannel: {
      fn: sendMessageToTeamsChannel,
      paramsSchema: microsoftMessageTeamsChannelParamsSchema,
      outputSchema: microsoftMessageTeamsChannelOutputSchema,
    },
    updateSpreadsheet: {
      fn: microsoftUpdateSpreadsheet,
      paramsSchema: microsoftUpdateSpreadsheetParamsSchema,
      outputSchema: microsoftUpdateSpreadsheetOutputSchema,
    },
    updateDocument: {
      fn: updateDocument,
      paramsSchema: microsoftUpdateDocumentParamsSchema,
      outputSchema: microsoftUpdateDocumentOutputSchema,
    },
    createDocument: {
      fn: createDocument,
      paramsSchema: microsoftCreateDocumentParamsSchema,
      outputSchema: microsoftCreateDocumentOutputSchema,
    },
    getDocument: {
      fn: getDocument,
      paramsSchema: microsoftGetDocumentParamsSchema,
      outputSchema: microsoftGetDocumentOutputSchema,
    },
  },
  github: {
    createOrUpdateFile: {
      fn: createOrUpdateFile,
      paramsSchema: githubCreateOrUpdateFileParamsSchema,
      outputSchema: githubCreateOrUpdateFileOutputSchema,
    },
    createBranch: {
      fn: createBranch,
      paramsSchema: githubCreateBranchParamsSchema,
      outputSchema: githubCreateBranchOutputSchema,
    },
    createPullRequest: {
      fn: createPullRequest,
      paramsSchema: githubCreatePullRequestParamsSchema,
      outputSchema: githubCreatePullRequestOutputSchema,
    },
    listPullRequests: {
      fn: listPullRequests,
      paramsSchema: githubListPullRequestsParamsSchema,
      outputSchema: githubListPullRequestsOutputSchema,
    },
  },
};
