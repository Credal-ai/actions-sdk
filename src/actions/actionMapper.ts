import type { z } from "zod";
import {
  type ActionFunction,
  genericFillTemplateParamsSchema,
  genericFillTemplateOutputSchema,
  confluenceOverwritePageParamsSchema,
  confluenceOverwritePageOutputSchema,
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
  slackCreateChannelParamsSchema,
  slackCreateChannelOutputSchema,
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
  zendeskSearchZendeskByQueryOutputSchema,
  zendeskSearchZendeskByQueryParamsSchema,
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
  jiraCreateServiceDeskRequestParamsSchema,
  jiraCreateServiceDeskRequestOutputSchema,
  openstreetmapGetLatitudeLongitudeFromLocationParamsSchema,
  openstreetmapGetLatitudeLongitudeFromLocationOutputSchema,
  nwsGetForecastForLocationParamsSchema,
  nwsGetForecastForLocationOutputSchema,
  googlemapsNearbysearchRestaurantsOutputSchema,
  googlemapsNearbysearchRestaurantsParamsSchema,
  firecrawlScrapeUrlOutputSchema,
  firecrawlScrapeUrlParamsSchema,
  resendSendEmailOutputSchema,
  resendSendEmailHtmlParamsSchema,
  resendSendEmailHtmlOutputSchema,
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
  googleOauthReadCommentsOnDocParamsSchema,
  googleOauthReadCommentsOnDocOutputSchema,
  googleOauthCreateSpreadsheetParamsSchema,
  googleOauthCreateSpreadsheetOutputSchema,
  googleOauthUpdateSpreadsheetParamsSchema,
  googleOauthUpdateSpreadsheetOutputSchema,
  googleOauthAppendRowsToSpreadsheetParamsSchema,
  googleOauthAppendRowsToSpreadsheetOutputSchema,
  googleOauthDeleteRowFromSpreadsheetParamsSchema,
  googleOauthDeleteRowFromSpreadsheetOutputSchema,
  googleOauthScheduleCalendarMeetingParamsSchema,
  googleOauthScheduleCalendarMeetingOutputSchema,
  googleOauthListCalendarsParamsSchema,
  googleOauthListCalendarsOutputSchema,
  googleOauthListCalendarEventsParamsSchema,
  googleOauthListCalendarEventsOutputSchema,
  googleOauthUpdateCalendarEventParamsSchema,
  googleOauthUpdateCalendarEventOutputSchema,
  googleOauthDeleteCalendarEventParamsSchema,
  googleOauthDeleteCalendarEventOutputSchema,
  googleOauthEditAGoogleCalendarEventParamsSchema,
  googleOauthEditAGoogleCalendarEventOutputSchema,
  googleOauthCreatePresentationParamsSchema,
  googleOauthCreatePresentationOutputSchema,
  googleOauthUpdatePresentationParamsSchema,
  googleOauthUpdatePresentationOutputSchema,
  googleOauthGetPresentationParamsSchema,
  googleOauthGetPresentationOutputSchema,
  googleOauthSearchDriveByKeywordsParamsSchema,
  googleOauthSearchDriveByKeywordsOutputSchema,
  googleOauthListGroupsOutputSchema,
  googleOauthListGroupsParamsSchema,
  googleOauthGetGroupOutputSchema,
  googleOauthGetGroupParamsSchema,
  googleOauthListGroupMembersOutputSchema,
  googleOauthListGroupMembersParamsSchema,
  googleOauthHasGroupMemberOutputSchema,
  googleOauthHasGroupMemberParamsSchema,
  googleOauthAddGroupMemberOutputSchema,
  googleOauthAddGroupMemberParamsSchema,
  googleOauthDeleteGroupMemberOutputSchema,
  googleOauthDeleteGroupMemberParamsSchema,
  salesforceUpdateRecordParamsSchema,
  salesforceUpdateRecordOutputSchema,
  salesforceCreateCaseParamsSchema,
  salesforceCreateCaseOutputSchema,
  salesforceGenerateSalesReportParamsSchema,
  salesforceGenerateSalesReportOutputSchema,
  salesforceGetRecordParamsSchema,
  salesforceGetRecordOutputSchema,
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
  microsoftCreateDocumentParamsSchema,
  microsoftCreateDocumentOutputSchema,
  asanaListAsanaTasksByProjectParamsSchema,
  asanaListAsanaTasksByProjectOutputSchema,
  asanaSearchTasksParamsSchema,
  asanaSearchTasksOutputSchema,
  asanaGetTasksDetailsParamsSchema,
  asanaGetTasksDetailsOutputSchema,
  notionSearchByTitleParamsSchema,
  notionSearchByTitleOutputSchema,
  googlemailSearchGmailMessagesOutputSchema,
  googlemailSearchGmailMessagesParamsSchema,
  googlemailListGmailThreadsOutputSchema,
  googlemailListGmailThreadsParamsSchema,
  type ProviderName,
  gitlabSearchGroupOutputSchema,
  gitlabSearchGroupParamsSchema,
  githubSearchOrganizationOutputSchema,
  githubSearchOrganizationParamsSchema,
  salesforceSearchSalesforceRecordsParamsSchema,
  salesforceSearchSalesforceRecordsOutputSchema,
  googleOauthGetDriveFileContentByIdOutputSchema,
  googleOauthGetDriveFileContentByIdParamsSchema,
  googleOauthSearchDriveByQueryOutputSchema,
  googleOauthSearchDriveByQueryParamsSchema,
  googleOauthSearchDriveByQueryAndGetFileContentParamsSchema,
  googleOauthSearchDriveByQueryAndGetFileContentOutputSchema,
  googleOauthQueryGoogleBigQueryParamsSchema,
  googleOauthQueryGoogleBigQueryOutputSchema,
  githubGetFileContentParamsSchema,
  githubGetFileContentOutputSchema,
  githubListDirectoryOutputSchema,
  githubListDirectoryParamsSchema,
  githubGetBranchParamsSchema,
  githubGetBranchOutputSchema,
  githubListCommitsParamsSchema,
  githubListCommitsOutputSchema,
  githubGetPullRequestDetailsParamsSchema,
  githubGetPullRequestDetailsOutputSchema,
  linearGetIssuesParamsSchema,
  linearGetIssuesOutputSchema,
  linearGetIssueDetailsParamsSchema,
  linearGetIssueDetailsOutputSchema,
  linearGetProjectDetailsParamsSchema,
  linearGetProjectDetailsOutputSchema,
  linearGetTeamDetailsParamsSchema,
  linearGetTeamDetailsOutputSchema,
  linearGetProjectsParamsSchema,
  linearGetProjectsOutputSchema,
  linearGetTeamsParamsSchema,
  linearGetTeamsOutputSchema,
  hubspotGetContactsParamsSchema,
  hubspotGetContactsOutputSchema,
  hubspotGetContactDetailsParamsSchema,
  hubspotGetContactDetailsOutputSchema,
  hubspotGetCompaniesParamsSchema,
  hubspotGetCompaniesOutputSchema,
  hubspotGetCompanyDetailsParamsSchema,
  hubspotGetCompanyDetailsOutputSchema,
  hubspotGetDealsParamsSchema,
  hubspotGetDealsOutputSchema,
  hubspotGetDealDetailsParamsSchema,
  hubspotGetDealDetailsOutputSchema,
  hubspotGetTicketsParamsSchema,
  hubspotGetTicketsOutputSchema,
  hubspotGetTicketDetailsParamsSchema,
  hubspotGetTicketDetailsOutputSchema,
  gitlabGetFileContentParamsSchema,
  gitlabGetFileContentOutputSchema,
  gitlabGetMergeRequestParamsSchema,
  gitlabGetMergeRequestOutputSchema,
  jiraPublicCommentOnServiceDeskRequestParamsSchema,
  jiraPublicCommentOnServiceDeskRequestOutputSchema,
  googlemailSendGmailParamsSchema,
  googlemailSendGmailOutputSchema,
  gitlabListDirectoryParamsSchema,
  gitlabListDirectoryOutputSchema,
  firecrawlSearchAndScrapeOutputSchema,
  firecrawlSearchAndScrapeParamsSchema,
  firecrawlGetTopNSearchResultUrlsParamsSchema,
  firecrawlGetTopNSearchResultUrlsOutputSchema,
  googleOauthSearchDriveByKeywordsAndGetFileContentParamsSchema,
  googleOauthSearchDriveByKeywordsAndGetFileContentOutputSchema,
  perplexityPerplexityDeepResearchParamsSchema,
  perplexityPerplexityDeepResearchOutputSchema,
  slackUserSearchSlackParamsSchema,
  slackUserSearchSlackOutputSchema,
  slackUserSearchSlackRTSParamsSchema,
  slackUserSearchSlackRTSOutputSchema,
  oktaOrgGetOktaUserByNameParamsSchema,
  oktaOrgGetOktaUserByNameOutputSchema,
  googleSearchCustomSearchParamsSchema,
  googleSearchCustomSearchOutputSchema,
  salesforceSearchAllSalesforceRecordsParamsSchema,
  salesforceSearchAllSalesforceRecordsOutputSchema,
  salesforceListReportsParamsSchema,
  salesforceListReportsOutputSchema,
  salesforceExecuteReportParamsSchema,
  salesforceExecuteReportOutputSchema,
  slackSendDmFromBotParamsSchema,
  slackSendDmFromBotOutputSchema,
  slackGetChannelMembersParamsSchema,
  slackGetChannelMembersOutputSchema,
  salesforceGetReportMetadataParamsSchema,
  salesforceGetReportMetadataOutputSchema,
  googleOauthUpdateRowsInSpreadsheetParamsSchema,
  googleOauthUpdateRowsInSpreadsheetOutputSchema,
} from "./autogen/types.js";
import validateAddress from "./providers/googlemaps/validateAddress.js";
import add from "./providers/math/add.js";
import fillTemplate from "./providers/generic/fillTemplate.js";
import insertMongoDoc from "./providers/mongodb/insertMongoDoc.js";
import sendMessage from "./providers/slack/sendMessage.js";
import getChannelMessages from "./providers/slack/getChannelMessages.js";
import getChannelMembers from "./providers/slack/getChannelMembers.js";
import getRowByFieldValue from "./providers/snowflake/getRowByFieldValue.js";
import createZendeskTicket from "./providers/zendesk/createZendeskTicket.js";
import getZendeskTicketDetails from "./providers/zendesk/getTicketDetails.js";
import updateTicketStatus from "./providers/zendesk/updateTicketStatus.js";
import addCommentToTicket from "./providers/zendesk/addCommentToTicket.js";
import assignTicket from "./providers/zendesk/assignTicket.js";
import listZendeskTickets from "./providers/zendesk/listTickets.js";
import searchZendeskByQuery from "./providers/zendesk/searchZendeskByQuery.js";
import assignJiraTicket from "./providers/jira/assignJiraTicket.js";
import commentJiraTicket from "./providers/jira/commentJiraTicket.js";
import createJiraTicket from "./providers/jira/createJiraTicket.js";
import getJiraTicketDetails from "./providers/jira/getJiraTicketDetails.js";
import getJiraTicketHistory from "./providers/jira/getJiraTicketHistory.js";
import updateJiraTicketDetails from "./providers/jira/updateJiraTicketDetails.js";
import updateJiraTicketStatus from "./providers/jira/updateJiraTicketStatus.js";
import getLatitudeLongitudeFromLocation from "./providers/openstreetmap/getLatitudeLongitudeFromLocation.js";
import getForecastForLocation from "./providers/nws/getForecastForLocation.js";
import getSalesforceRecordsByQuery from "./providers/salesforce/getSalesforceRecordsByQuery.js";
import nearbysearch from "./providers/googlemaps/nearbysearchRestaurants.js";
import scrapeUrl from "./providers/firecrawl/scrapeUrl.js";
import sendEmail from "./providers/resend/sendEmail.js";
import sendEmailHtml from "./providers/resend/sendEmailHtml.js";
import commentAsanaTask from "./providers/asana/commentAsanaTask.js";
import createAsanaTask from "./providers/asana/createAsanaTask.js";
import updateAsanaTask from "./providers/asana/updateAsanaTask.js";
import searchAsanaTasks from "./providers/asana/searchAsanaTasks.js";
import createShareLinkedinPostUrl from "./providers/linkedin/createSharePostLinkedinUrl.js";
import createNewGoogleDoc from "./providers/google-oauth/createNewGoogleDoc.js";
import createXSharePostUrl from "./providers/x/createXSharePostUrl.js";
import scrapeTweetDataWithNitter from "./providers/firecrawl/scrapeTweetDataWithNitter.js";
import symbolLookup from "./providers/finnhub/symbolLookup.js";
import getBasicFinancials from "./providers/finnhub/getBasicFinancials.js";
import confluenceOverwritePage from "./providers/confluence/overwritePage.js";
import confluenceFetchPageContent from "./providers/confluence/fetchPageContent.js";
import runSnowflakeQuery from "./providers/snowflake/runSnowflakeQuery.js";
import enableUserByEmail from "./providers/looker/enableUserByEmail.js";
import updateDoc from "./providers/google-oauth/updateDoc.js";
import readCommentsOnDoc from "./providers/google-oauth/readCommentsOnDoc.js";
import scheduleCalendarMeeting from "./providers/google-oauth/scheduleCalendarMeeting.js";
import listCalendars from "./providers/google-oauth/listCalendars.js";
import listCalendarEvents from "./providers/google-oauth/listCalendarEvents.js";
import updateCalendarEvent from "./providers/google-oauth/updateCalendarEvent.js";
import deleteCalendarEvent from "./providers/google-oauth/deleteCalendarEvent.js";
import editAGoogleCalendarEvent from "./providers/google-oauth/editAGoogleCalendarEvent.js";
import createSpreadsheet from "./providers/google-oauth/createSpreadsheet.js";
import updateSpreadsheet from "./providers/google-oauth/updateSpreadsheet.js";
import appendRowsToSpreadsheet from "./providers/google-oauth/appendRowsToSpreadsheet.js";
import deleteRowFromSpreadsheet from "./providers/google-oauth/deleteRowFromSpreadsheet.js";
import updateRowsInSpreadsheet from "./providers/google-oauth/updateRowsInSpreadsheet.js";
import createPresentation from "./providers/google-oauth/createPresentation.js";
import updatePresentation from "./providers/google-oauth/updatePresentation.js";
import getPresentation from "./providers/google-oauth/getPresentation.js";
import updateRecord from "./providers/salesforce/updateRecord.js";
import createCase from "./providers/salesforce/createCase.js";
import generateSalesReport from "./providers/salesforce/generateSalesReport.js";
import getRecord from "./providers/salesforce/getRecord.js";
import sendMessageToTeamsChat from "./providers/microsoft/messageTeamsChat.js";
import sendMessageToTeamsChannel from "./providers/microsoft/messageTeamsChannel.js";
import createOrUpdateFile from "./providers/github/createOrUpdateFile.js";
import createBranch from "./providers/github/createBranch.js";
import createPullRequest from "./providers/github/createPullRequest.js";
import microsoftUpdateSpreadsheet from "./providers/microsoft/updateSpreadsheet.js";
import updateDocument from "./providers/microsoft/updateDocument.js";
import createDocument from "./providers/microsoft/createDocument.js";
import getDocument from "./providers/microsoft/getDocument.js";
import deepResearch from "./providers/firecrawl/deepResearch.js";
import listPullRequests from "./providers/github/listPullRequests.js";
import getJiraIssuesByQuery from "./providers/jira/getJiraIssuesByQuery.js";
import getJiraDCIssuesByQuery from "./providers/jira/getJiraDCIssuesByQuery.js";
import createRecord from "./providers/salesforce/createRecord.js";
import getTopNSearchResultUrls from "./providers/bing/getTopNSearchResultUrls.js";
import searchDriveByKeywords from "./providers/google-oauth/searchDriveByKeywords.js";
import listAsanaTasksByProject from "./providers/asana/listAsanaTasksByProject.js";
import getTasksDetails from "./providers/asana/getTasksDetails.js";
import searchByTitle from "./providers/notion/searchByTitle.js";
import searchGmailMessages from "./providers/googlemail/searchGmailMessages.js";
import listGmailThreads from "./providers/googlemail/listGmailThreads.js";
import listGroups from "./providers/google-oauth/listGroups.js";
import getGroup from "./providers/google-oauth/getGroup.js";
import listGroupMembers from "./providers/google-oauth/listGroupMembers.js";
import hasGroupMember from "./providers/google-oauth/hasGroupMember.js";
import addGroupMember from "./providers/google-oauth/addGroupMember.js";
import deleteGroupMember from "./providers/google-oauth/deleteGroupMember.js";
import createChannel from "./providers/slack/createChannel.js";
import searchGroup from "./providers/gitlab/searchGroup.js";
import searchOrganization from "./providers/github/searchOrganization.js";
import createServiceDeskRequest from "./providers/jira/createServiceDeskRequest.js";
import searchSalesforceRecords from "./providers/salesforce/searchSalesforceRecords.js";
import getDriveFileContentById from "./providers/google-oauth/getDriveFileContentById.js";
import searchDriveByQuery from "./providers/google-oauth/searchDriveByQuery.js";
import searchDriveByQueryAndGetFileContent from "./providers/google-oauth/searchDriveByQueryAndGetFileContent.js";
import queryGoogleBigQuery from "./providers/google-oauth/queryGoogleBigQuery.js";
import getFileContent from "./providers/github/getFileContent.js";
import listDirectory from "./providers/github/listDirectory.js";
import getBranch from "./providers/github/getBranch.js";
import listCommits from "./providers/github/listCommits.js";
import getPullRequestDetails from "./providers/github/getPullRequestDetails.js";
import getIssueDetails from "./providers/linear/getIssueDetails.js";
import getIssues from "./providers/linear/getIssues.js";
import getProjectDetails from "./providers/linear/getProjectDetails.js";
import getTeamDetails from "./providers/linear/getTeamDetails.js";
import getProjects from "./providers/linear/getProjects.js";
import getTeams from "./providers/linear/getTeams.js";
import getContacts from "./providers/hubspot/getContacts.js";
import getContactDetails from "./providers/hubspot/getContactDetails.js";
import getCompanies from "./providers/hubspot/getCompanies.js";
import getCompanyDetails from "./providers/hubspot/getCompanyDetails.js";
import getDeals from "./providers/hubspot/getDeals.js";
import getDealDetails from "./providers/hubspot/getDealDetails.js";
import getTickets from "./providers/hubspot/getTickets.js";
import getTicketDetails from "./providers/hubspot/getTicketDetails.js";
import gitlabGetFileContent from "./providers/gitlab/getFileContent.js";
import gitlabGetMergeRequest from "./providers/gitlab/getMergeRequest.js";
import gitlabListDirectory from "./providers/gitlab/listDirectory.js";
import publicCommentOnServiceDeskRequest from "./providers/jira/publicCommentOnServiceDeskRequest.js";
import sendGmail from "./providers/googlemail/sendGmail.js";
import searchAndScrape from "./providers/firecrawl/searchAndScrape.js";
import firecrawlGetTopNSearchResultUrls from "./providers/firecrawl/getTopNSearchResultUrls.js";
import searchDriveByKeywordsAndGetFileContent from "./providers/google-oauth/searchDriveByKeywordsAndGetFileContent.js";
import perplexityDeepResearch from "./providers/perplexity/perplexityDeepResearch.js";
import searchSlack from "./providers/slackUser/searchSlack.js";
import searchSlackRTS from "./providers/slackUser/searchSlackRTS.js";
import sendDmFromBot from "./providers/slack/sendDmFromBot.js";
import getOktaUserByName from "./providers/oktaOrg/getOktaUserByName.js";
import customSearch from "./providers/googleSearch/customSearch.js";
import searchAllSalesforceRecords from "./providers/salesforce/searchAllSalesforceRecords.js";
import listReports from "./providers/salesforce/listReports.js";
import getReportMetadata from "./providers/salesforce/getReportMetadata.js";
import executeReport from "./providers/salesforce/executeReport.js";

type ActionTypeSchema = "read" | "write";

interface ActionFunctionComponents {
  // eslint-disable-next-line
  fn: ActionFunction<any, any, any>;
  paramsSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  actionType?: ActionTypeSchema;
}

const jiraActions = {
  getJiraIssuesByQuery: {
    fn: getJiraIssuesByQuery,
    paramsSchema: jiraGetJiraIssuesByQueryParamsSchema,
    outputSchema: jiraGetJiraIssuesByQueryOutputSchema,
    actionType: "read",
  },
  assignJiraTicket: {
    fn: assignJiraTicket,
    paramsSchema: jiraAssignJiraTicketParamsSchema,
    outputSchema: jiraAssignJiraTicketOutputSchema,
    actionType: "write",
  },
  commentJiraTicket: {
    fn: commentJiraTicket,
    paramsSchema: jiraCommentJiraTicketParamsSchema,
    outputSchema: jiraCommentJiraTicketOutputSchema,
    actionType: "write",
  },
  publicCommentOnServiceDeskRequest: {
    fn: publicCommentOnServiceDeskRequest,
    paramsSchema: jiraPublicCommentOnServiceDeskRequestParamsSchema,
    outputSchema: jiraPublicCommentOnServiceDeskRequestOutputSchema,
    actionType: "write",
  },
  createJiraTicket: {
    fn: createJiraTicket,
    paramsSchema: jiraCreateJiraTicketParamsSchema,
    outputSchema: jiraCreateJiraTicketOutputSchema,
    actionType: "write",
  },
  getJiraTicketDetails: {
    fn: getJiraTicketDetails,
    paramsSchema: jiraGetJiraTicketDetailsParamsSchema,
    outputSchema: jiraGetJiraTicketDetailsOutputSchema,
    actionType: "read",
  },
  getJiraTicketHistory: {
    fn: getJiraTicketHistory,
    paramsSchema: jiraGetJiraTicketHistoryParamsSchema,
    outputSchema: jiraGetJiraTicketHistoryOutputSchema,
    actionType: "read",
  },
  updateJiraTicketDetails: {
    fn: updateJiraTicketDetails,
    paramsSchema: jiraUpdateJiraTicketDetailsParamsSchema,
    outputSchema: jiraUpdateJiraTicketDetailsOutputSchema,
    actionType: "write",
  },
  updateJiraTicketStatus: {
    fn: updateJiraTicketStatus,
    paramsSchema: jiraUpdateJiraTicketStatusParamsSchema,
    outputSchema: jiraUpdateJiraTicketStatusOutputSchema,
    actionType: "write",
  },
  createServiceDeskRequest: {
    fn: createServiceDeskRequest,
    paramsSchema: jiraCreateServiceDeskRequestParamsSchema,
    outputSchema: jiraCreateServiceDeskRequestOutputSchema,
    actionType: "write",
  },
} satisfies Record<string, ActionFunctionComponents>;

export const ActionMapper: Record<ProviderName, Record<string, ActionFunctionComponents>> = {
  generic: {
    fillTemplate: {
      fn: fillTemplate,
      paramsSchema: genericFillTemplateParamsSchema,
      outputSchema: genericFillTemplateOutputSchema,
    },
  },
  perplexity: {
    perplexityDeepResearch: {
      fn: perplexityDeepResearch,
      paramsSchema: perplexityPerplexityDeepResearchParamsSchema,
      outputSchema: perplexityPerplexityDeepResearchOutputSchema,
    },
  },
  asana: {
    commentTask: {
      fn: commentAsanaTask,
      paramsSchema: asanaCommentTaskParamsSchema,
      outputSchema: asanaCommentTaskOutputSchema,
      actionType: "write",
    },
    createTask: {
      fn: createAsanaTask,
      paramsSchema: asanaCreateTaskParamsSchema,
      outputSchema: asanaCreateTaskOutputSchema,
      actionType: "write",
    },
    updateTask: {
      fn: updateAsanaTask,
      paramsSchema: asanaUpdateTaskParamsSchema,
      outputSchema: asanaUpdateTaskOutputSchema,
      actionType: "write",
    },
    searchTasks: {
      fn: searchAsanaTasks,
      paramsSchema: asanaSearchTasksParamsSchema,
      outputSchema: asanaSearchTasksOutputSchema,
      actionType: "read",
    },
    listAsanaTasksByProject: {
      fn: listAsanaTasksByProject,
      paramsSchema: asanaListAsanaTasksByProjectParamsSchema,
      outputSchema: asanaListAsanaTasksByProjectOutputSchema,
      actionType: "read",
    },
    getTasksDetails: {
      fn: getTasksDetails,
      paramsSchema: asanaGetTasksDetailsParamsSchema,
      outputSchema: asanaGetTasksDetailsOutputSchema,
      actionType: "read",
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
      actionType: "write",
    },
    getChannelMessages: {
      fn: getChannelMessages,
      paramsSchema: slackGetChannelMessagesParamsSchema,
      outputSchema: slackGetChannelMessagesOutputSchema,
      actionType: "read",
    },
    getChannelMembers: {
      fn: getChannelMembers,
      paramsSchema: slackGetChannelMembersParamsSchema,
      outputSchema: slackGetChannelMembersOutputSchema,
      actionType: "read",
    },
    createChannel: {
      fn: createChannel,
      paramsSchema: slackCreateChannelParamsSchema,
      outputSchema: slackCreateChannelOutputSchema,
      actionType: "write",
    },
    sendDmFromBot: {
      fn: sendDmFromBot,
      paramsSchema: slackSendDmFromBotParamsSchema,
      outputSchema: slackSendDmFromBotOutputSchema,
      actionType: "write",
    },
  },
  slackUser: {
    searchSlack: {
      fn: searchSlack,
      paramsSchema: slackUserSearchSlackParamsSchema,
      outputSchema: slackUserSearchSlackOutputSchema,
      actionType: "read",
    },
    searchSlackRTS: {
      fn: searchSlackRTS,
      paramsSchema: slackUserSearchSlackRTSParamsSchema,
      outputSchema: slackUserSearchSlackRTSOutputSchema,
      actionType: "read",
    },
  },
  confluence: {
    overwritePage: {
      fn: confluenceOverwritePage,
      paramsSchema: confluenceOverwritePageParamsSchema,
      outputSchema: confluenceOverwritePageOutputSchema,
      actionType: "write",
    },
    fetchPageContent: {
      fn: confluenceFetchPageContent,
      paramsSchema: confluenceFetchPageContentParamsSchema,
      outputSchema: confluenceFetchPageContentOutputSchema,
      actionType: "read",
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
      actionType: "write",
    },
    getTicketDetails: {
      fn: getZendeskTicketDetails,
      paramsSchema: zendeskGetTicketDetailsParamsSchema,
      outputSchema: zendeskGetTicketDetailsOutputSchema,
      actionType: "read",
    },
    updateTicketStatus: {
      fn: updateTicketStatus,
      paramsSchema: zendeskUpdateTicketStatusParamsSchema,
      outputSchema: zendeskUpdateTicketStatusOutputSchema,
      actionType: "write",
    },
    addCommentToTicket: {
      fn: addCommentToTicket,
      paramsSchema: zendeskAddCommentToTicketParamsSchema,
      outputSchema: zendeskAddCommentToTicketOutputSchema,
      actionType: "write",
    },
    assignTicket: {
      fn: assignTicket,
      paramsSchema: zendeskAssignTicketParamsSchema,
      outputSchema: zendeskAssignTicketOutputSchema,
      actionType: "write",
    },
    listZendeskTickets: {
      fn: listZendeskTickets,
      paramsSchema: zendeskListZendeskTicketsParamsSchema,
      outputSchema: zendeskListZendeskTicketsOutputSchema,
      actionType: "read",
    },
    searchZendeskByQuery: {
      fn: searchZendeskByQuery,
      paramsSchema: zendeskSearchZendeskByQueryParamsSchema,
      outputSchema: zendeskSearchZendeskByQueryOutputSchema,
      actionType: "read",
    },
  },
  mongo: {
    insertMongoDoc: {
      fn: insertMongoDoc,
      paramsSchema: mongoInsertMongoDocParamsSchema,
      outputSchema: mongoInsertMongoDocOutputSchema,
      actionType: "write",
    },
  },
  snowflake: {
    getRowByFieldValue: {
      fn: getRowByFieldValue,
      paramsSchema: snowflakeGetRowByFieldValueParamsSchema,
      outputSchema: snowflakeGetRowByFieldValueOutputSchema,
      actionType: "read",
    },
    runSnowflakeQuery: {
      fn: runSnowflakeQuery,
      paramsSchema: snowflakeRunSnowflakeQueryParamsSchema,
      outputSchema: snowflakeRunSnowflakeQueryOutputSchema,
      actionType: "write",
    },
  },
  linkedin: {
    createShareLinkedinPostUrl: {
      fn: createShareLinkedinPostUrl,
      paramsSchema: linkedinCreateShareLinkedinPostUrlParamsSchema,
      outputSchema: linkedinCreateShareLinkedinPostUrlOutputSchema,
    },
  },
  jira: jiraActions,
  jiraOrg: jiraActions,
  jiraDataCenter: {
    // Exclude Service Desk: createServiceDeskRequest, publicCommentOnServiceDeskRequest
    getJiraIssuesByQuery: {
      fn: getJiraDCIssuesByQuery,
      paramsSchema: jiraGetJiraIssuesByQueryParamsSchema,
      outputSchema: jiraGetJiraIssuesByQueryOutputSchema,
      actionType: "read",
    },
    assignJiraTicket: {
      fn: assignJiraTicket,
      paramsSchema: jiraAssignJiraTicketParamsSchema,
      outputSchema: jiraAssignJiraTicketOutputSchema,
      actionType: "write",
    },
    commentJiraTicket: {
      fn: commentJiraTicket,
      paramsSchema: jiraCommentJiraTicketParamsSchema,
      outputSchema: jiraCommentJiraTicketOutputSchema,
      actionType: "write",
    },
    createJiraTicket: {
      fn: createJiraTicket,
      paramsSchema: jiraCreateJiraTicketParamsSchema,
      outputSchema: jiraCreateJiraTicketOutputSchema,
      actionType: "write",
    },
    getJiraTicketDetails: {
      fn: getJiraTicketDetails,
      paramsSchema: jiraGetJiraTicketDetailsParamsSchema,
      outputSchema: jiraGetJiraTicketDetailsOutputSchema,
      actionType: "read",
    },
    getJiraTicketHistory: {
      fn: getJiraTicketHistory,
      paramsSchema: jiraGetJiraTicketHistoryParamsSchema,
      outputSchema: jiraGetJiraTicketHistoryOutputSchema,
      actionType: "read",
    },
    updateJiraTicketDetails: {
      fn: updateJiraTicketDetails,
      paramsSchema: jiraUpdateJiraTicketDetailsParamsSchema,
      outputSchema: jiraUpdateJiraTicketDetailsOutputSchema,
      actionType: "write",
    },
    updateJiraTicketStatus: {
      fn: updateJiraTicketStatus,
      paramsSchema: jiraUpdateJiraTicketStatusParamsSchema,
      outputSchema: jiraUpdateJiraTicketStatusOutputSchema,
      actionType: "write",
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
    searchAndScrape: {
      fn: searchAndScrape,
      paramsSchema: firecrawlSearchAndScrapeParamsSchema,
      outputSchema: firecrawlSearchAndScrapeOutputSchema,
    },
    getTopNSearchResultUrls: {
      fn: firecrawlGetTopNSearchResultUrls,
      paramsSchema: firecrawlGetTopNSearchResultUrlsParamsSchema,
      outputSchema: firecrawlGetTopNSearchResultUrlsOutputSchema,
    },
  },
  resend: {
    sendEmail: {
      fn: sendEmail,
      paramsSchema: resendSendEmailParamsSchema,
      outputSchema: resendSendEmailOutputSchema,
      actionType: "write",
    },
    sendEmailHtml: {
      fn: sendEmailHtml,
      paramsSchema: resendSendEmailHtmlParamsSchema,
      outputSchema: resendSendEmailHtmlOutputSchema,
      actionType: "write",
    },
  },
  googleOauth: {
    createNewGoogleDoc: {
      fn: createNewGoogleDoc,
      paramsSchema: googleOauthCreateNewGoogleDocParamsSchema,
      outputSchema: googleOauthCreateNewGoogleDocOutputSchema,
      actionType: "write",
    },
    readCommentsOnDoc: {
      fn: readCommentsOnDoc,
      paramsSchema: googleOauthReadCommentsOnDocParamsSchema,
      outputSchema: googleOauthReadCommentsOnDocOutputSchema,
      actionType: "read",
    },
    updateDoc: {
      fn: updateDoc,
      paramsSchema: googleOauthUpdateDocParamsSchema,
      outputSchema: googleOauthUpdateDocOutputSchema,
      actionType: "write",
    },
    scheduleCalendarMeeting: {
      fn: scheduleCalendarMeeting,
      paramsSchema: googleOauthScheduleCalendarMeetingParamsSchema,
      outputSchema: googleOauthScheduleCalendarMeetingOutputSchema,
      actionType: "write",
    },
    createSpreadsheet: {
      fn: createSpreadsheet,
      paramsSchema: googleOauthCreateSpreadsheetParamsSchema,
      outputSchema: googleOauthCreateSpreadsheetOutputSchema,
      actionType: "write",
    },
    updateSpreadsheet: {
      fn: updateSpreadsheet,
      paramsSchema: googleOauthUpdateSpreadsheetParamsSchema,
      outputSchema: googleOauthUpdateSpreadsheetOutputSchema,
      actionType: "write",
    },
    appendRowsToSpreadsheet: {
      fn: appendRowsToSpreadsheet,
      paramsSchema: googleOauthAppendRowsToSpreadsheetParamsSchema,
      outputSchema: googleOauthAppendRowsToSpreadsheetOutputSchema,
      actionType: "write",
    },
    updateRowsInSpreadsheet: {
      fn: updateRowsInSpreadsheet,
      paramsSchema: googleOauthUpdateRowsInSpreadsheetParamsSchema,
      outputSchema: googleOauthUpdateRowsInSpreadsheetOutputSchema,
      actionType: "write",
    },
    deleteRowFromSpreadsheet: {
      fn: deleteRowFromSpreadsheet,
      paramsSchema: googleOauthDeleteRowFromSpreadsheetParamsSchema,
      outputSchema: googleOauthDeleteRowFromSpreadsheetOutputSchema,
      actionType: "write",
    },
    createPresentation: {
      fn: createPresentation,
      paramsSchema: googleOauthCreatePresentationParamsSchema,
      outputSchema: googleOauthCreatePresentationOutputSchema,
      actionType: "write",
    },
    updatePresentation: {
      fn: updatePresentation,
      paramsSchema: googleOauthUpdatePresentationParamsSchema,
      outputSchema: googleOauthUpdatePresentationOutputSchema,
      actionType: "write",
    },
    getPresentation: {
      fn: getPresentation,
      paramsSchema: googleOauthGetPresentationParamsSchema,
      outputSchema: googleOauthGetPresentationOutputSchema,
      actionType: "read",
    },
    searchDriveByKeywords: {
      fn: searchDriveByKeywords,
      paramsSchema: googleOauthSearchDriveByKeywordsParamsSchema,
      outputSchema: googleOauthSearchDriveByKeywordsOutputSchema,
      actionType: "read",
    },
    searchDriveByKeywordsAndGetFileContent: {
      fn: searchDriveByKeywordsAndGetFileContent,
      paramsSchema: googleOauthSearchDriveByKeywordsAndGetFileContentParamsSchema,
      outputSchema: googleOauthSearchDriveByKeywordsAndGetFileContentOutputSchema,
      actionType: "read",
    },
    searchDriveByQuery: {
      fn: searchDriveByQuery,
      paramsSchema: googleOauthSearchDriveByQueryParamsSchema,
      outputSchema: googleOauthSearchDriveByQueryOutputSchema,
      actionType: "read",
    },
    searchDriveByQueryAndGetFileContent: {
      fn: searchDriveByQueryAndGetFileContent,
      paramsSchema: googleOauthSearchDriveByQueryAndGetFileContentParamsSchema,
      outputSchema: googleOauthSearchDriveByQueryAndGetFileContentOutputSchema,
      actionType: "read",
    },
    getDriveFileContentById: {
      fn: getDriveFileContentById,
      paramsSchema: googleOauthGetDriveFileContentByIdParamsSchema,
      outputSchema: googleOauthGetDriveFileContentByIdOutputSchema,
      actionType: "read",
    },
    listCalendars: {
      fn: listCalendars,
      paramsSchema: googleOauthListCalendarsParamsSchema,
      outputSchema: googleOauthListCalendarsOutputSchema,
      actionType: "read",
    },
    listCalendarEvents: {
      fn: listCalendarEvents,
      paramsSchema: googleOauthListCalendarEventsParamsSchema,
      outputSchema: googleOauthListCalendarEventsOutputSchema,
      actionType: "read",
    },
    updateCalendarEvent: {
      fn: updateCalendarEvent,
      paramsSchema: googleOauthUpdateCalendarEventParamsSchema,
      outputSchema: googleOauthUpdateCalendarEventOutputSchema,
      actionType: "write",
    },
    deleteCalendarEvent: {
      fn: deleteCalendarEvent,
      paramsSchema: googleOauthDeleteCalendarEventParamsSchema,
      outputSchema: googleOauthDeleteCalendarEventOutputSchema,
      actionType: "write",
    },
    editAGoogleCalendarEvent: {
      fn: editAGoogleCalendarEvent,
      paramsSchema: googleOauthEditAGoogleCalendarEventParamsSchema,
      outputSchema: googleOauthEditAGoogleCalendarEventOutputSchema,
      actionType: "write",
    },
    listGroups: {
      fn: listGroups,
      paramsSchema: googleOauthListGroupsParamsSchema,
      outputSchema: googleOauthListGroupsOutputSchema,
      actionType: "read",
    },
    getGroup: {
      fn: getGroup,
      paramsSchema: googleOauthGetGroupParamsSchema,
      outputSchema: googleOauthGetGroupOutputSchema,
      actionType: "read",
    },
    listGroupMembers: {
      fn: listGroupMembers,
      paramsSchema: googleOauthListGroupMembersParamsSchema,
      outputSchema: googleOauthListGroupMembersOutputSchema,
      actionType: "read",
    },
    hasGroupMember: {
      fn: hasGroupMember,
      paramsSchema: googleOauthHasGroupMemberParamsSchema,
      outputSchema: googleOauthHasGroupMemberOutputSchema,
      actionType: "read",
    },
    addGroupMember: {
      fn: addGroupMember,
      paramsSchema: googleOauthAddGroupMemberParamsSchema,
      outputSchema: googleOauthAddGroupMemberOutputSchema,
      actionType: "write",
    },
    deleteGroupMember: {
      fn: deleteGroupMember,
      paramsSchema: googleOauthDeleteGroupMemberParamsSchema,
      outputSchema: googleOauthDeleteGroupMemberOutputSchema,
      actionType: "write",
    },
    queryGoogleBigQuery: {
      fn: queryGoogleBigQuery,
      paramsSchema: googleOauthQueryGoogleBigQueryParamsSchema,
      outputSchema: googleOauthQueryGoogleBigQueryOutputSchema,
      actionType: "write",
    },
  },
  googlemail: {
    searchGmailMessages: {
      fn: searchGmailMessages,
      paramsSchema: googlemailSearchGmailMessagesParamsSchema,
      outputSchema: googlemailSearchGmailMessagesOutputSchema,
      actionType: "read",
    },
    listGmailThreads: {
      fn: listGmailThreads,
      paramsSchema: googlemailListGmailThreadsParamsSchema,
      outputSchema: googlemailListGmailThreadsOutputSchema,
      actionType: "read",
    },
    sendGmail: {
      fn: sendGmail,
      paramsSchema: googlemailSendGmailParamsSchema,
      outputSchema: googlemailSendGmailOutputSchema,
      actionType: "write",
    },
  },
  googleSearch: {
    customSearch: {
      fn: customSearch,
      paramsSchema: googleSearchCustomSearchParamsSchema,
      outputSchema: googleSearchCustomSearchOutputSchema,
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
      actionType: "write",
    },
  },
  salesforce: {
    updateRecord: {
      fn: updateRecord,
      paramsSchema: salesforceUpdateRecordParamsSchema,
      outputSchema: salesforceUpdateRecordOutputSchema,
      actionType: "write",
    },
    createRecord: {
      fn: createRecord,
      paramsSchema: salesforceCreateRecordParamsSchema,
      outputSchema: salesforceCreateRecordOutputSchema,
      actionType: "write",
    },
    createCase: {
      fn: createCase,
      paramsSchema: salesforceCreateCaseParamsSchema,
      outputSchema: salesforceCreateCaseOutputSchema,
      actionType: "write",
    },
    generateSalesReport: {
      fn: generateSalesReport,
      paramsSchema: salesforceGenerateSalesReportParamsSchema,
      outputSchema: salesforceGenerateSalesReportOutputSchema,
      actionType: "read",
    },
    getRecord: {
      fn: getRecord,
      paramsSchema: salesforceGetRecordParamsSchema,
      outputSchema: salesforceGetRecordOutputSchema,
      actionType: "read",
    },
    searchSalesforceRecords: {
      fn: searchSalesforceRecords,
      paramsSchema: salesforceSearchSalesforceRecordsParamsSchema,
      outputSchema: salesforceSearchSalesforceRecordsOutputSchema,
      actionType: "read",
    },
    searchAllSalesforceRecords: {
      fn: searchAllSalesforceRecords,
      paramsSchema: salesforceSearchAllSalesforceRecordsParamsSchema,
      outputSchema: salesforceSearchAllSalesforceRecordsOutputSchema,
      actionType: "read",
    },
    listReports: {
      fn: listReports,
      paramsSchema: salesforceListReportsParamsSchema,
      outputSchema: salesforceListReportsOutputSchema,
      actionType: "read",
    },
    executeReport: {
      fn: executeReport,
      paramsSchema: salesforceExecuteReportParamsSchema,
      outputSchema: salesforceExecuteReportOutputSchema,
    },
    getSalesforceRecordsByQuery: {
      fn: getSalesforceRecordsByQuery,
      paramsSchema: salesforceGetSalesforceRecordsByQueryParamsSchema,
      outputSchema: salesforceGetSalesforceRecordsByQueryOutputSchema,
      actionType: "read",
    },
    getReportMetadata: {
      fn: getReportMetadata,
      paramsSchema: salesforceGetReportMetadataParamsSchema,
      outputSchema: salesforceGetReportMetadataOutputSchema,
      actionType: "read",
    },
  },
  microsoft: {
    messageTeamsChat: {
      fn: sendMessageToTeamsChat,
      paramsSchema: microsoftMessageTeamsChatParamsSchema,
      outputSchema: microsoftMessageTeamsChatOutputSchema,
      actionType: "write",
    },
    messageTeamsChannel: {
      fn: sendMessageToTeamsChannel,
      paramsSchema: microsoftMessageTeamsChannelParamsSchema,
      outputSchema: microsoftMessageTeamsChannelOutputSchema,
      actionType: "write",
    },
    updateSpreadsheet: {
      fn: microsoftUpdateSpreadsheet,
      paramsSchema: microsoftUpdateSpreadsheetParamsSchema,
      outputSchema: microsoftUpdateSpreadsheetOutputSchema,
      actionType: "write",
    },
    updateDocument: {
      fn: updateDocument,
      paramsSchema: microsoftUpdateDocumentParamsSchema,
      outputSchema: microsoftUpdateDocumentOutputSchema,
      actionType: "write",
    },
    createDocument: {
      fn: createDocument,
      paramsSchema: microsoftCreateDocumentParamsSchema,
      outputSchema: microsoftCreateDocumentOutputSchema,
      actionType: "write",
    },
    getDocument: {
      fn: getDocument,
      paramsSchema: microsoftGetDocumentParamsSchema,
      outputSchema: microsoftGetDocumentOutputSchema,
      actionType: "read",
    },
  },
  github: {
    searchOrganization: {
      fn: searchOrganization,
      paramsSchema: githubSearchOrganizationParamsSchema,
      outputSchema: githubSearchOrganizationOutputSchema,
      actionType: "read",
    },
    createOrUpdateFile: {
      fn: createOrUpdateFile,
      paramsSchema: githubCreateOrUpdateFileParamsSchema,
      outputSchema: githubCreateOrUpdateFileOutputSchema,
      actionType: "write",
    },
    createBranch: {
      fn: createBranch,
      paramsSchema: githubCreateBranchParamsSchema,
      outputSchema: githubCreateBranchOutputSchema,
      actionType: "write",
    },
    createPullRequest: {
      fn: createPullRequest,
      paramsSchema: githubCreatePullRequestParamsSchema,
      outputSchema: githubCreatePullRequestOutputSchema,
      actionType: "write",
    },
    listPullRequests: {
      fn: listPullRequests,
      paramsSchema: githubListPullRequestsParamsSchema,
      outputSchema: githubListPullRequestsOutputSchema,
      actionType: "read",
    },
    getFileContent: {
      fn: getFileContent,
      paramsSchema: githubGetFileContentParamsSchema,
      outputSchema: githubGetFileContentOutputSchema,
      actionType: "read",
    },
    listDirectory: {
      fn: listDirectory,
      paramsSchema: githubListDirectoryParamsSchema,
      outputSchema: githubListDirectoryOutputSchema,
      actionType: "read",
    },
    getBranch: {
      fn: getBranch,
      paramsSchema: githubGetBranchParamsSchema,
      outputSchema: githubGetBranchOutputSchema,
      actionType: "read",
    },
    listCommits: {
      fn: listCommits,
      paramsSchema: githubListCommitsParamsSchema,
      outputSchema: githubListCommitsOutputSchema,
      actionType: "read",
    },
    getPullRequestDetails: {
      fn: getPullRequestDetails,
      paramsSchema: githubGetPullRequestDetailsParamsSchema,
      outputSchema: githubGetPullRequestDetailsOutputSchema,
      actionType: "read",
    },
  },
  notion: {
    searchByTitle: {
      fn: searchByTitle,
      paramsSchema: notionSearchByTitleParamsSchema,
      outputSchema: notionSearchByTitleOutputSchema,
      actionType: "read",
    },
  },
  oktaOrg: {
    getOktaUserByName: {
      fn: getOktaUserByName,
      paramsSchema: oktaOrgGetOktaUserByNameParamsSchema,
      outputSchema: oktaOrgGetOktaUserByNameOutputSchema,
      actionType: "read",
    },
  },
  gitlab: {
    searchGroup: {
      fn: searchGroup,
      paramsSchema: gitlabSearchGroupParamsSchema,
      outputSchema: gitlabSearchGroupOutputSchema,
      actionType: "read",
    },
    getFileContent: {
      fn: gitlabGetFileContent,
      paramsSchema: gitlabGetFileContentParamsSchema,
      outputSchema: gitlabGetFileContentOutputSchema,
      actionType: "read",
    },
    getMergeRequest: {
      fn: gitlabGetMergeRequest,
      paramsSchema: gitlabGetMergeRequestParamsSchema,
      outputSchema: gitlabGetMergeRequestOutputSchema,
      actionType: "read",
    },
    listDirectory: {
      fn: gitlabListDirectory,
      paramsSchema: gitlabListDirectoryParamsSchema,
      outputSchema: gitlabListDirectoryOutputSchema,
      actionType: "read",
    },
  },
  linear: {
    getIssues: {
      fn: getIssues,
      paramsSchema: linearGetIssuesParamsSchema,
      outputSchema: linearGetIssuesOutputSchema,
      actionType: "read",
    },
    getIssueDetails: {
      fn: getIssueDetails,
      paramsSchema: linearGetIssueDetailsParamsSchema,
      outputSchema: linearGetIssueDetailsOutputSchema,
      actionType: "read",
    },
    getProjects: {
      fn: getProjects,
      paramsSchema: linearGetProjectsParamsSchema,
      outputSchema: linearGetProjectsOutputSchema,
      actionType: "read",
    },
    getProjectDetails: {
      fn: getProjectDetails,
      paramsSchema: linearGetProjectDetailsParamsSchema,
      outputSchema: linearGetProjectDetailsOutputSchema,
      actionType: "read",
    },
    getTeamDetails: {
      fn: getTeamDetails,
      paramsSchema: linearGetTeamDetailsParamsSchema,
      outputSchema: linearGetTeamDetailsOutputSchema,
      actionType: "read",
    },
    getTeams: {
      fn: getTeams,
      paramsSchema: linearGetTeamsParamsSchema,
      outputSchema: linearGetTeamsOutputSchema,
      actionType: "read",
    },
  },
  hubspot: {
    getContacts: {
      fn: getContacts,
      paramsSchema: hubspotGetContactsParamsSchema,
      outputSchema: hubspotGetContactsOutputSchema,
      actionType: "read",
    },
    getContactDetails: {
      fn: getContactDetails,
      paramsSchema: hubspotGetContactDetailsParamsSchema,
      outputSchema: hubspotGetContactDetailsOutputSchema,
      actionType: "read",
    },
    getCompanies: {
      fn: getCompanies,
      paramsSchema: hubspotGetCompaniesParamsSchema,
      outputSchema: hubspotGetCompaniesOutputSchema,
      actionType: "read",
    },
    getCompanyDetails: {
      fn: getCompanyDetails,
      paramsSchema: hubspotGetCompanyDetailsParamsSchema,
      outputSchema: hubspotGetCompanyDetailsOutputSchema,
      actionType: "read",
    },
    getDeals: {
      fn: getDeals,
      paramsSchema: hubspotGetDealsParamsSchema,
      outputSchema: hubspotGetDealsOutputSchema,
      actionType: "read",
    },
    getDealDetails: {
      fn: getDealDetails,
      paramsSchema: hubspotGetDealDetailsParamsSchema,
      outputSchema: hubspotGetDealDetailsOutputSchema,
      actionType: "read",
    },
    getTickets: {
      fn: getTickets,
      paramsSchema: hubspotGetTicketsParamsSchema,
      outputSchema: hubspotGetTicketsOutputSchema,
      actionType: "read",
    },
    getTicketDetails: {
      fn: getTicketDetails,
      paramsSchema: hubspotGetTicketDetailsParamsSchema,
      outputSchema: hubspotGetTicketDetailsOutputSchema,
      actionType: "read",
    },
  },
  boxUser: {},
};
