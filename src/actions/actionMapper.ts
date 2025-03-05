import { z } from "zod";
import {
  type ActionFunction,
  confluenceUpdatePageOutputSchema,
  confluenceUpdatePageParamsSchema,
  credalCallCopilotOutputSchema,
  credalCallCopilotParamsSchema,
  googlemapsValidateAddressOutputSchema,
  googlemapsValidateAddressParamsSchema,
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
} from "./autogen/types";
import updatePage from "./providers/confluence/updatePage";
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
    updatePage: {
      fn: updatePage,
      paramsSchema: confluenceUpdatePageParamsSchema,
      outputSchema: confluenceUpdatePageOutputSchema,
    },
  },
  googlemaps: {
    validateAddress: {
      fn: validateAddress,
      paramsSchema: googlemapsValidateAddressParamsSchema,
      outputSchema: googlemapsValidateAddressOutputSchema,
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
};
