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
  jiraGetServiceDesksParamsSchema,
  jiraGetServiceDesksOutputSchema,
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
  googleOauthCreateSpreadsheetParamsSchema,
  googleOauthCreateSpreadsheetOutputSchema,
  googleOauthUpdateSpreadsheetParamsSchema,
  googleOauthUpdateSpreadsheetOutputSchema,
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
  githubSearchRepositoryOutputSchema,
  githubSearchRepositoryParamsSchema,
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
  googleOauthCopyDriveFileParamsSchema,
  googleOauthCopyDriveFileOutputSchema,
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
  oktaOrgGetOktaUserByNameParamsSchema,
  oktaOrgGetOktaUserByNameOutputSchema,
  googleSearchCustomSearchParamsSchema,
  googleSearchCustomSearchOutputSchema,
  salesforceSearchAllSalesforceRecordsParamsSchema,
  salesforceSearchAllSalesforceRecordsOutputSchema,
} from "./autogen/types.js";
import validateAddress from "./providers/googlemaps/validateAddress.js";
import add from "./providers/math/add.js";
import fillTemplate from "./providers/generic/fillTemplate.js";
import insertMongoDoc from "./providers/mongodb/insertMongoDoc.js";
import sendMessage from "./providers/slack/sendMessage.js";
import getChannelMessages from "./providers/slack/getChannelMessages.js";
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
import scheduleCalendarMeeting from "./providers/google-oauth/scheduleCalendarMeeting.js";
import listCalendars from "./providers/google-oauth/listCalendars.js";
import listCalendarEvents from "./providers/google-oauth/listCalendarEvents.js";
import updateCalendarEvent from "./providers/google-oauth/updateCalendarEvent.js";
import deleteCalendarEvent from "./providers/google-oauth/deleteCalendarEvent.js";
import editAGoogleCalendarEvent from "./providers/google-oauth/editAGoogleCalendarEvent.js";
import createSpreadsheet from "./providers/google-oauth/createSpreadsheet.js";
import updateSpreadsheet from "./providers/google-oauth/updateSpreadsheet.js";
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
import searchRepository from "./providers/github/searchRepository.js";
import searchOrganization from "./providers/github/searchOrganization.js";
import getServiceDesks from "./providers/jira/getServiceDesks.js";
import createServiceDeskRequest from "./providers/jira/createServiceDeskRequest.js";
import searchSalesforceRecords from "./providers/salesforce/searchSalesforceRecords.js";
import getDriveFileContentById from "./providers/google-oauth/getDriveFileContentById.js";
import searchDriveByQuery from "./providers/google-oauth/searchDriveByQuery.js";
import searchDriveByQueryAndGetFileContent from "./providers/google-oauth/searchDriveByQueryAndGetFileContent.js";
import queryGoogleBigQuery from "./providers/google-oauth/queryGoogleBigQuery.js";
import copyDriveFile from "./providers/google-oauth/copyDriveFile.js";
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
import getOktaUserByName from "./providers/oktaOrg/getOktaUserByName.js";
import customSearch from "./providers/googleSearch/customSearch.js";
import searchAllSalesforceRecords from "./providers/salesforce/searchAllSalesforceRecords.js";

interface ActionFunctionComponents {
  // eslint-disable-next-line
  fn: ActionFunction<any, any, any>;
  paramsSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
}

const jiraActions = {
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
  publicCommentOnServiceDeskRequest: {
    fn: publicCommentOnServiceDeskRequest,
    paramsSchema: jiraPublicCommentOnServiceDeskRequestParamsSchema,
    outputSchema: jiraPublicCommentOnServiceDeskRequestOutputSchema,
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
  getServiceDesks: {
    fn: getServiceDesks,
    paramsSchema: jiraGetServiceDesksParamsSchema,
    outputSchema: jiraGetServiceDesksOutputSchema,
  },
  createServiceDeskRequest: {
    fn: createServiceDeskRequest,
    paramsSchema: jiraCreateServiceDeskRequestParamsSchema,
    outputSchema: jiraCreateServiceDeskRequestOutputSchema,
  },
};

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
    searchTasks: {
      fn: searchAsanaTasks,
      paramsSchema: asanaSearchTasksParamsSchema,
      outputSchema: asanaSearchTasksOutputSchema,
    },
    listAsanaTasksByProject: {
      fn: listAsanaTasksByProject,
      paramsSchema: asanaListAsanaTasksByProjectParamsSchema,
      outputSchema: asanaListAsanaTasksByProjectOutputSchema,
    },
    getTasksDetails: {
      fn: getTasksDetails,
      paramsSchema: asanaGetTasksDetailsParamsSchema,
      outputSchema: asanaGetTasksDetailsOutputSchema,
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
    createChannel: {
      fn: createChannel,
      paramsSchema: slackCreateChannelParamsSchema,
      outputSchema: slackCreateChannelOutputSchema,
    },
  },
  slackUser: {
    searchSlack: {
      fn: searchSlack,
      paramsSchema: slackUserSearchSlackParamsSchema,
      outputSchema: slackUserSearchSlackOutputSchema,
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
    searchZendeskByQuery: {
      fn: searchZendeskByQuery,
      paramsSchema: zendeskSearchZendeskByQueryParamsSchema,
      outputSchema: zendeskSearchZendeskByQueryOutputSchema,
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
  jira: jiraActions,
  jiraOrg: jiraActions,
  jiraDataCenter: {
    // Exclude Service Desk: getServiceDesks, createServiceDeskRequest, publicCommentOnServiceDeskRequest
    getJiraIssuesByQuery: {
      fn: getJiraDCIssuesByQuery,
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
    },
    sendEmailHtml: {
      fn: sendEmailHtml,
      paramsSchema: resendSendEmailHtmlParamsSchema,
      outputSchema: resendSendEmailHtmlOutputSchema,
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
    getPresentation: {
      fn: getPresentation,
      paramsSchema: googleOauthGetPresentationParamsSchema,
      outputSchema: googleOauthGetPresentationOutputSchema,
    },
    searchDriveByKeywords: {
      fn: searchDriveByKeywords,
      paramsSchema: googleOauthSearchDriveByKeywordsParamsSchema,
      outputSchema: googleOauthSearchDriveByKeywordsOutputSchema,
    },
    searchDriveByKeywordsAndGetFileContent: {
      fn: searchDriveByKeywordsAndGetFileContent,
      paramsSchema: googleOauthSearchDriveByKeywordsAndGetFileContentParamsSchema,
      outputSchema: googleOauthSearchDriveByKeywordsAndGetFileContentOutputSchema,
    },
    searchDriveByQuery: {
      fn: searchDriveByQuery,
      paramsSchema: googleOauthSearchDriveByQueryParamsSchema,
      outputSchema: googleOauthSearchDriveByQueryOutputSchema,
    },
    searchDriveByQueryAndGetFileContent: {
      fn: searchDriveByQueryAndGetFileContent,
      paramsSchema: googleOauthSearchDriveByQueryAndGetFileContentParamsSchema,
      outputSchema: googleOauthSearchDriveByQueryAndGetFileContentOutputSchema,
    },
    getDriveFileContentById: {
      fn: getDriveFileContentById,
      paramsSchema: googleOauthGetDriveFileContentByIdParamsSchema,
      outputSchema: googleOauthGetDriveFileContentByIdOutputSchema,
    },
    listCalendars: {
      fn: listCalendars,
      paramsSchema: googleOauthListCalendarsParamsSchema,
      outputSchema: googleOauthListCalendarsOutputSchema,
    },
    listCalendarEvents: {
      fn: listCalendarEvents,
      paramsSchema: googleOauthListCalendarEventsParamsSchema,
      outputSchema: googleOauthListCalendarEventsOutputSchema,
    },
    updateCalendarEvent: {
      fn: updateCalendarEvent,
      paramsSchema: googleOauthUpdateCalendarEventParamsSchema,
      outputSchema: googleOauthUpdateCalendarEventOutputSchema,
    },
    deleteCalendarEvent: {
      fn: deleteCalendarEvent,
      paramsSchema: googleOauthDeleteCalendarEventParamsSchema,
      outputSchema: googleOauthDeleteCalendarEventOutputSchema,
    },
    editAGoogleCalendarEvent: {
      fn: editAGoogleCalendarEvent,
      paramsSchema: googleOauthEditAGoogleCalendarEventParamsSchema,
      outputSchema: googleOauthEditAGoogleCalendarEventOutputSchema,
    },
    listGroups: {
      fn: listGroups,
      paramsSchema: googleOauthListGroupsParamsSchema,
      outputSchema: googleOauthListGroupsOutputSchema,
    },
    getGroup: {
      fn: getGroup,
      paramsSchema: googleOauthGetGroupParamsSchema,
      outputSchema: googleOauthGetGroupOutputSchema,
    },
    listGroupMembers: {
      fn: listGroupMembers,
      paramsSchema: googleOauthListGroupMembersParamsSchema,
      outputSchema: googleOauthListGroupMembersOutputSchema,
    },
    hasGroupMember: {
      fn: hasGroupMember,
      paramsSchema: googleOauthHasGroupMemberParamsSchema,
      outputSchema: googleOauthHasGroupMemberOutputSchema,
    },
    addGroupMember: {
      fn: addGroupMember,
      paramsSchema: googleOauthAddGroupMemberParamsSchema,
      outputSchema: googleOauthAddGroupMemberOutputSchema,
    },
    deleteGroupMember: {
      fn: deleteGroupMember,
      paramsSchema: googleOauthDeleteGroupMemberParamsSchema,
      outputSchema: googleOauthDeleteGroupMemberOutputSchema,
    },
    queryGoogleBigQuery: {
      fn: queryGoogleBigQuery,
      paramsSchema: googleOauthQueryGoogleBigQueryParamsSchema,
      outputSchema: googleOauthQueryGoogleBigQueryOutputSchema,
    },
    copyDriveFile: {
      fn: copyDriveFile,
      paramsSchema: googleOauthCopyDriveFileParamsSchema,
      outputSchema: googleOauthCopyDriveFileOutputSchema,
    },
  },
  googlemail: {
    searchGmailMessages: {
      fn: searchGmailMessages,
      paramsSchema: googlemailSearchGmailMessagesParamsSchema,
      outputSchema: googlemailSearchGmailMessagesOutputSchema,
    },
    listGmailThreads: {
      fn: listGmailThreads,
      paramsSchema: googlemailListGmailThreadsParamsSchema,
      outputSchema: googlemailListGmailThreadsOutputSchema,
    },
    sendGmail: {
      fn: sendGmail,
      paramsSchema: googlemailSendGmailParamsSchema,
      outputSchema: googlemailSendGmailOutputSchema,
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
    searchSalesforceRecords: {
      fn: searchSalesforceRecords,
      paramsSchema: salesforceSearchSalesforceRecordsParamsSchema,
      outputSchema: salesforceSearchSalesforceRecordsOutputSchema,
    },
    searchAllSalesforceRecords: {
      fn: searchAllSalesforceRecords,
      paramsSchema: salesforceSearchAllSalesforceRecordsParamsSchema,
      outputSchema: salesforceSearchAllSalesforceRecordsOutputSchema,
    },
    getSalesforceRecordsByQuery: {
      fn: getSalesforceRecordsByQuery,
      paramsSchema: salesforceGetSalesforceRecordsByQueryParamsSchema,
      outputSchema: salesforceGetSalesforceRecordsByQueryOutputSchema,
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
    searchOrganization: {
      fn: searchOrganization,
      paramsSchema: githubSearchOrganizationParamsSchema,
      outputSchema: githubSearchOrganizationOutputSchema,
    },
    searchRepository: {
      fn: searchRepository,
      paramsSchema: githubSearchRepositoryParamsSchema,
      outputSchema: githubSearchRepositoryOutputSchema,
    },
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
    getFileContent: {
      fn: getFileContent,
      paramsSchema: githubGetFileContentParamsSchema,
      outputSchema: githubGetFileContentOutputSchema,
    },
    listDirectory: {
      fn: listDirectory,
      paramsSchema: githubListDirectoryParamsSchema,
      outputSchema: githubListDirectoryOutputSchema,
    },
    getBranch: {
      fn: getBranch,
      paramsSchema: githubGetBranchParamsSchema,
      outputSchema: githubGetBranchOutputSchema,
    },
    listCommits: {
      fn: listCommits,
      paramsSchema: githubListCommitsParamsSchema,
      outputSchema: githubListCommitsOutputSchema,
    },
    getPullRequestDetails: {
      fn: getPullRequestDetails,
      paramsSchema: githubGetPullRequestDetailsParamsSchema,
      outputSchema: githubGetPullRequestDetailsOutputSchema,
    },
  },
  notion: {
    searchByTitle: {
      fn: searchByTitle,
      paramsSchema: notionSearchByTitleParamsSchema,
      outputSchema: notionSearchByTitleOutputSchema,
    },
  },
  oktaOrg: {
    getOktaUserByName: {
      fn: getOktaUserByName,
      paramsSchema: oktaOrgGetOktaUserByNameParamsSchema,
      outputSchema: oktaOrgGetOktaUserByNameOutputSchema,
    },
  },
  gitlab: {
    searchGroup: {
      fn: searchGroup,
      paramsSchema: gitlabSearchGroupParamsSchema,
      outputSchema: gitlabSearchGroupOutputSchema,
    },
    getFileContent: {
      fn: gitlabGetFileContent,
      paramsSchema: gitlabGetFileContentParamsSchema,
      outputSchema: gitlabGetFileContentOutputSchema,
    },
    getMergeRequest: {
      fn: gitlabGetMergeRequest,
      paramsSchema: gitlabGetMergeRequestParamsSchema,
      outputSchema: gitlabGetMergeRequestOutputSchema,
    },
    listDirectory: {
      fn: gitlabListDirectory,
      paramsSchema: gitlabListDirectoryParamsSchema,
      outputSchema: gitlabListDirectoryOutputSchema,
    },
  },
  linear: {
    getIssues: {
      fn: getIssues,
      paramsSchema: linearGetIssuesParamsSchema,
      outputSchema: linearGetIssuesOutputSchema,
    },
    getIssueDetails: {
      fn: getIssueDetails,
      paramsSchema: linearGetIssueDetailsParamsSchema,
      outputSchema: linearGetIssueDetailsOutputSchema,
    },
    getProjects: {
      fn: getProjects,
      paramsSchema: linearGetProjectsParamsSchema,
      outputSchema: linearGetProjectsOutputSchema,
    },
    getProjectDetails: {
      fn: getProjectDetails,
      paramsSchema: linearGetProjectDetailsParamsSchema,
      outputSchema: linearGetProjectDetailsOutputSchema,
    },
    getTeamDetails: {
      fn: getTeamDetails,
      paramsSchema: linearGetTeamDetailsParamsSchema,
      outputSchema: linearGetTeamDetailsOutputSchema,
    },
    getTeams: {
      fn: getTeams,
      paramsSchema: linearGetTeamsParamsSchema,
      outputSchema: linearGetTeamsOutputSchema,
    },
  },
  hubspot: {
    getContacts: {
      fn: getContacts,
      paramsSchema: hubspotGetContactsParamsSchema,
      outputSchema: hubspotGetContactsOutputSchema,
    },
    getContactDetails: {
      fn: getContactDetails,
      paramsSchema: hubspotGetContactDetailsParamsSchema,
      outputSchema: hubspotGetContactDetailsOutputSchema,
    },
    getCompanies: {
      fn: getCompanies,
      paramsSchema: hubspotGetCompaniesParamsSchema,
      outputSchema: hubspotGetCompaniesOutputSchema,
    },
    getCompanyDetails: {
      fn: getCompanyDetails,
      paramsSchema: hubspotGetCompanyDetailsParamsSchema,
      outputSchema: hubspotGetCompanyDetailsOutputSchema,
    },
    getDeals: {
      fn: getDeals,
      paramsSchema: hubspotGetDealsParamsSchema,
      outputSchema: hubspotGetDealsOutputSchema,
    },
    getDealDetails: {
      fn: getDealDetails,
      paramsSchema: hubspotGetDealDetailsParamsSchema,
      outputSchema: hubspotGetDealDetailsOutputSchema,
    },
    getTickets: {
      fn: getTickets,
      paramsSchema: hubspotGetTicketsParamsSchema,
      outputSchema: hubspotGetTicketsOutputSchema,
    },
    getTicketDetails: {
      fn: getTicketDetails,
      paramsSchema: hubspotGetTicketDetailsParamsSchema,
      outputSchema: hubspotGetTicketDetailsOutputSchema,
    },
  },
};
