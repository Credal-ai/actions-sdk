import {
  confluenceUpdatePageDefinition,
  credalCallCopilotDefinition,
  googlemapsValidateAddressDefinition,
  mathAddDefinition,
  mongoInsertMongoDocDefinition,
  slackListConversationsDefinition,
  slackSendMessageDefinition,
  snowflakeGetRowByFieldValueDefinition,
  workdayRequestTimeOffDefinition,
  zendeskCreateZendeskTicketDefinition,
} from "../actions/autogen/templates";
import { ActionTemplate } from "../actions/parse";

export type ActionGroups = Record<string, { description: string; actions: ActionTemplate[] }>;

export const ACTION_GROUPS: ActionGroups = {
  SLACK_LIST_CONVERSATIONS: {
    description: "Actions for interacting with Slack",
    actions: [slackListConversationsDefinition, slackSendMessageDefinition],
  },
  CONFLUENCE_UPDATE_PAGE: {
    description: "Action for updating Confluence",
    actions: [confluenceUpdatePageDefinition],
  },
  MATH_ADD: {
    description: "Action for adding two numbers",
    actions: [mathAddDefinition],
  },
  MAPS_VALIDATE: {
    description: "Action for validating a Google maps address",
    actions: [googlemapsValidateAddressDefinition],
  },
  CREDAL_CALL_COPILOT: {
    description: "Action for calling a Credal Copilot",
    actions: [credalCallCopilotDefinition],
  },
  ZENDESK_CREATE_TICKET: {
    description: "Action for creating a Zendesk ticket",
    actions: [zendeskCreateZendeskTicketDefinition],
  },
  MONGO_INSERT_DOC: {
    description: "Action for inserting a document into a MongoDB collection",
    actions: [mongoInsertMongoDocDefinition],
  },
  SNOWFLAKE_GET_ROW_BY_FIELD_VALUE: {
    description: "Action for getting a row from a Snowflake table by field value",
    actions: [snowflakeGetRowByFieldValueDefinition],
  },
  WORKDAY_REQUEST_TIME_OFF: {
    description: "Action for requesting time off in Workday",
    actions: [workdayRequestTimeOffDefinition],
  },
};
