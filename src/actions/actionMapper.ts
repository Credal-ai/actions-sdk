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
  slackArchiveChannelParamsSchema,
  slackArchiveChannelOutputSchema,
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
  googleOauthCreatePresentationParamsSchema,
  googleOauthCreatePresentationOutputSchema,
  googleOauthUpdatePresentationParamsSchema,
  googleOauthUpdatePresentationOutputSchema,
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
  gongGetGongTranscriptsParamsSchema,
  gongGetGongTranscriptsOutputSchema,
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
  asanaSearchTasksParamsSchema,
  asanaSearchTasksOutputSchema,
  asanaGetTasksDetailsParamsSchema,
  asanaGetTasksDetailsOutputSchema,
  notionSearchByTitleParamsSchema,
  notionSearchByTitleOutputSchema,
  jamfGetJamfComputerInventoryParamsSchema,
  jamfGetJamfComputerInventoryOutputSchema,
  jamfGetJamfFileVaultRecoveryKeyParamsSchema,
  jamfGetJamfFileVaultRecoveryKeyOutputSchema,
  googlemailSearchGmailMessagesOutputSchema,
  googlemailSearchGmailMessagesParamsSchema,
  googlemailListGmailThreadsOutputSchema,
  googlemailListGmailThreadsParamsSchema,
  oktaListOktaUsersParamsSchema,
  oktaListOktaUsersOutputSchema,
  oktaGetOktaUserParamsSchema,
  oktaGetOktaUserOutputSchema,
  oktaListOktaUserGroupsParamsSchema,
  oktaListOktaUserGroupsOutputSchema,
  oktaListOktaGroupsParamsSchema,
  oktaListOktaGroupsOutputSchema,
  oktaGetOktaGroupParamsSchema,
  oktaGetOktaGroupOutputSchema,
  oktaListOktaGroupMembersParamsSchema,
  oktaListOktaGroupMembersOutputSchema,
  oktaRemoveUserFromGroupParamsSchema,
  oktaRemoveUserFromGroupOutputSchema,
  oktaAddUserToGroupParamsSchema,
  oktaAddUserToGroupOutputSchema,
  oktaResetPasswordParamsSchema,
  oktaResetPasswordOutputSchema,
  oktaResetMFAParamsSchema,
  oktaResetMFAOutputSchema,
  oktaListMFAParamsSchema,
  oktaListMFAOutputSchema,
  type ProviderName,
  jamfGetJamfUserComputerIdParamsSchema,
  jamfGetJamfUserComputerIdOutputSchema,
  jamfLockJamfComputerByIdParamsSchema,
  jamfLockJamfComputerByIdOutputSchema,
  oktaTriggerOktaWorkflowParamsSchema,
  oktaTriggerOktaWorkflowOutputSchema,
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
  githubGetFileContentParamsSchema,
  githubGetFileContentOutputSchema,
  githubListDirectoryOutputSchema,
  githubListDirectoryParamsSchema,
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
  gitlabGetFileContentParamsSchema,
  gitlabGetFileContentOutputSchema,
  jiraPublicCommentOnServiceDeskRequestParamsSchema,
  jiraPublicCommentOnServiceDeskRequestOutputSchema,
  googlemailSendGmailParamsSchema,
  googlemailSendGmailOutputSchema,
  gitlabListDirectoryParamsSchema,
  gitlabListDirectoryOutputSchema,
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
import createSpreadsheet from "./providers/google-oauth/createSpreadsheet.js";
import updateSpreadsheet from "./providers/google-oauth/updateSpreadsheet.js";
import createPresentation from "./providers/google-oauth/createPresentation.js";
import updatePresentation from "./providers/google-oauth/updatePresentation.js";
import createNote from "./providers/ashby/createNote.js";
import getCandidateInfo from "./providers/ashby/getCandidateInfo.js";
import updateRecord from "./providers/salesforce/updateRecord.js";
import createCase from "./providers/salesforce/createCase.js";
import generateSalesReport from "./providers/salesforce/generateSalesReport.js";
import getRecord from "./providers/salesforce/getRecord.js";
import listCandidates from "./providers/ashby/listCandidates.js";
import listCandidateNotes from "./providers/ashby/listCandidateNotes.js";
import searchCandidates from "./providers/ashby/searchCandidates.js";
import createCandidate from "./providers/ashby/createCandidate.js";
import updateCandidate from "./providers/ashby/updateCandidate.js";
import addCandidateToProject from "./providers/ashby/addCandidateToProject.js";
import sendMessageToTeamsChat from "./providers/microsoft/messageTeamsChat.js";
import sendMessageToTeamsChannel from "./providers/microsoft/messageTeamsChannel.js";
import createOrUpdateFile from "./providers/github/createOrUpdateFile.js";
import createBranch from "./providers/github/createBranch.js";
import createPullRequest from "./providers/github/createPullRequest.js";
import microsoftUpdateSpreadsheet from "./providers/microsoft/updateSpreadsheet.js";
import updateDocument from "./providers/microsoft/updateDocument.js";
import createDocument from "./providers/microsoft/createDocument.js";
import getDocument from "./providers/microsoft/getDocument.js";
import fetchSalesforceSchemaByObject from "./providers/salesforce/fetchSalesforceSchema.js";
import deepResearch from "./providers/firecrawl/deepResearch.js";
import listPullRequests from "./providers/github/listPullRequests.js";
import getJiraIssuesByQuery from "./providers/jira/getJiraIssuesByQuery.js";
import createRecord from "./providers/salesforce/createRecord.js";
import getTopNSearchResultUrls from "./providers/bing/getTopNSearchResultUrls.js";
import getGongTranscripts from "./providers/gong/getGongTranscripts.js";
import searchDriveByKeywords from "./providers/google-oauth/searchDriveByKeywords.js";
import getFVRecoveryKeyForDevice from "./providers/kandji/getFVRecoveryKeyForDevice.js";
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
import getJamfComputerInventory from "./providers/jamf/getJamfComputerInventory.js";
import getJamfFileVaultRecoveryKey from "./providers/jamf/getJamfFileVaultRecoveryKey.js";
import listOktaUsers from "./providers/okta/listOktaUsers.js";
import getOktaUser from "./providers/okta/getOktaUser.js";
import listOktaUserGroups from "./providers/okta/listOktaUserGroups.js";
import listOktaGroups from "./providers/okta/listOktaGroups.js";
import getOktaGroup from "./providers/okta/getOktaGroup.js";
import listOktaGroupMembers from "./providers/okta/listOktaGroupMembers.js";
import removeUserFromGroup from "./providers/okta/removeUserFromGroup.js";
import addUserToGroup from "./providers/okta/addUserToGroup.js";
import resetPassword from "./providers/okta/resetPassword.js";
import resetMFA from "./providers/okta/resetMFA.js";
import listMFA from "./providers/okta/listMFA.js";
import createChannel from "./providers/slack/createChannel.js";
import archiveChannel from "./providers/slack/archiveChannel.js";
import getJamfUserComputerId from "./providers/jamf/getJamfUserComputerId.js";
import lockJamfComputerById from "./providers/jamf/lockJamfComputerById.js";
import triggerOktaWorkflow from "./providers/okta/triggerOktaWorkflow.js";
import searchGroup from "./providers/gitlab/searchGroup.js";
import searchRepository from "./providers/github/searchRepository.js";
import searchOrganization from "./providers/github/searchOrganization.js";
import getServiceDesks from "./providers/jira/getServiceDesks.js";
import createServiceDeskRequest from "./providers/jira/createServiceDeskRequest.js";
import searchSalesforceRecords from "./providers/salesforce/searchSalesforceRecords.js";
import getDriveFileContentById from "./providers/google-oauth/getDriveFileContentById.js";
import searchDriveByQuery from "./providers/google-oauth/searchDriveByQuery.js";
import searchDriveByQueryAndGetFileContent from "./providers/google-oauth/searchDriveByQueryAndGetFileContent.js";
import getFileContent from "./providers/github/getFileContent.js";
import listDirectory from "./providers/github/listDirectory.js";
import getIssueDetails from "./providers/linear/getIssueDetails.js";
import getIssues from "./providers/linear/getIssues.js";
import getProjectDetails from "./providers/linear/getProjectDetails.js";
import getTeamDetails from "./providers/linear/getTeamDetails.js";
import getProjects from "./providers/linear/getProjects.js";
import getTeams from "./providers/linear/getTeams.js";
import gitlabGetFileContent from "./providers/gitlab/getFileContent.js";
import gitlabListDirectory from "./providers/gitlab/listDirectory.js";
import publicCommentOnServiceDeskRequest from "./providers/jira/publicCommentOnServiceDeskRequest.js";
import sendGmail from "./providers/googlemail/sendGmail.js";

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
  jamf: {
    getJamfComputerInventory: {
      fn: getJamfComputerInventory,
      paramsSchema: jamfGetJamfComputerInventoryParamsSchema,
      outputSchema: jamfGetJamfComputerInventoryOutputSchema,
    },
    getJamfFileVaultRecoveryKey: {
      fn: getJamfFileVaultRecoveryKey,
      paramsSchema: jamfGetJamfFileVaultRecoveryKeyParamsSchema,
      outputSchema: jamfGetJamfFileVaultRecoveryKeyOutputSchema,
    },
    getJamfUserComputerId: {
      fn: getJamfUserComputerId,
      paramsSchema: jamfGetJamfUserComputerIdParamsSchema,
      outputSchema: jamfGetJamfUserComputerIdOutputSchema,
    },
    lockJamfComputerById: {
      fn: lockJamfComputerById,
      paramsSchema: jamfLockJamfComputerByIdParamsSchema,
      outputSchema: jamfLockJamfComputerByIdOutputSchema,
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
    archiveChannel: {
      fn: archiveChannel,
      paramsSchema: slackArchiveChannelParamsSchema,
      outputSchema: slackArchiveChannelOutputSchema,
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
    searchSalesforceRecords: {
      fn: searchSalesforceRecords,
      paramsSchema: salesforceSearchSalesforceRecordsParamsSchema,
      outputSchema: salesforceSearchSalesforceRecordsOutputSchema,
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
  },
  notion: {
    searchByTitle: {
      fn: searchByTitle,
      paramsSchema: notionSearchByTitleParamsSchema,
      outputSchema: notionSearchByTitleOutputSchema,
    },
  },
  okta: {
    listOktaUsers: {
      fn: listOktaUsers,
      paramsSchema: oktaListOktaUsersParamsSchema,
      outputSchema: oktaListOktaUsersOutputSchema,
    },
    getOktaUser: {
      fn: getOktaUser,
      paramsSchema: oktaGetOktaUserParamsSchema,
      outputSchema: oktaGetOktaUserOutputSchema,
    },
    listOktaUserGroups: {
      fn: listOktaUserGroups,
      paramsSchema: oktaListOktaUserGroupsParamsSchema,
      outputSchema: oktaListOktaUserGroupsOutputSchema,
    },
    listOktaGroups: {
      fn: listOktaGroups,
      paramsSchema: oktaListOktaGroupsParamsSchema,
      outputSchema: oktaListOktaGroupsOutputSchema,
    },
    getOktaGroup: {
      fn: getOktaGroup,
      paramsSchema: oktaGetOktaGroupParamsSchema,
      outputSchema: oktaGetOktaGroupOutputSchema,
    },
    listOktaGroupMembers: {
      fn: listOktaGroupMembers,
      paramsSchema: oktaListOktaGroupMembersParamsSchema,
      outputSchema: oktaListOktaGroupMembersOutputSchema,
    },
    removeUserFromGroup: {
      fn: removeUserFromGroup,
      paramsSchema: oktaRemoveUserFromGroupParamsSchema,
      outputSchema: oktaRemoveUserFromGroupOutputSchema,
    },
    addUserToGroup: {
      fn: addUserToGroup,
      paramsSchema: oktaAddUserToGroupParamsSchema,
      outputSchema: oktaAddUserToGroupOutputSchema,
    },
    resetPassword: {
      fn: resetPassword,
      paramsSchema: oktaResetPasswordParamsSchema,
      outputSchema: oktaResetPasswordOutputSchema,
    },
    resetMFA: {
      fn: resetMFA,
      paramsSchema: oktaResetMFAParamsSchema,
      outputSchema: oktaResetMFAOutputSchema,
    },
    listMFA: {
      fn: listMFA,
      paramsSchema: oktaListMFAParamsSchema,
      outputSchema: oktaListMFAOutputSchema,
    },
    triggerOktaWorkflow: {
      fn: triggerOktaWorkflow,
      paramsSchema: oktaTriggerOktaWorkflowParamsSchema,
      outputSchema: oktaTriggerOktaWorkflowOutputSchema,
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
};
