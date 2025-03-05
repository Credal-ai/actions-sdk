import { ActionTemplate } from "../../actions/parse";

export const slackSendMessageDefinition: ActionTemplate = {
  description: "Sends a message to a Slack channel",
  scopes: ["chat:write"],
  parameters: {
    type: "object",
    required: ["channelName", "message"],
    properties: {
      channelName: {
        type: "string",
        description: "The name of the Slack channel to send the message to (e.g. general, alerts)",
      },
      message: {
        type: "string",
        description: "The message content to send to Slack. Can include markdown formatting.",
      },
    },
  },
  name: "sendMessage",
  provider: "slack",
};
export const slackListConversationsDefinition: ActionTemplate = {
  description: "Lists all conversations in a Slack workspace",
  scopes: ["channels:read", "groups:read", "im:read", "mpim:read"],
  output: {
    type: "object",
    required: ["channels"],
    properties: {
      channels: {
        type: "array",
        description: "A list of channels in Slack",
        items: {
          type: "object",
          description: "A channel in Slack",
          required: ["id", "name", "topic", "purpose"],
          properties: {
            id: {
              type: "string",
              description: "The ID of the channel",
            },
            name: {
              type: "string",
              description: "The name of the channel",
            },
            topic: {
              type: "string",
              description: "The topic of the channel",
            },
            purpose: {
              type: "string",
              description: "The purpose of the channel",
            },
          },
        },
      },
    },
  },
  name: "listConversations",
  provider: "slack",
};
export const mathAddDefinition: ActionTemplate = {
  description: "Adds two numbers together",
  scopes: [],
  parameters: {
    type: "object",
    required: ["a", "b"],
    properties: {
      a: {
        type: "number",
        description: "The first number to add",
      },
      b: {
        type: "number",
        description: "The second number to add",
      },
    },
  },
  output: {
    type: "object",
    required: ["result"],
    properties: {
      result: {
        type: "number",
        description: "The sum of the two numbers",
      },
    },
  },
  name: "add",
  provider: "math",
};
export const confluenceUpdatePageDefinition: ActionTemplate = {
  description: "Updates a Confluence page with the new content specified",
  scopes: [],
  parameters: {
    type: "object",
    required: ["pageId", "title", "username", "content"],
    properties: {
      pageId: {
        type: "string",
        description: "The page id that should be updated",
      },
      title: {
        type: "string",
        description: "The title of the page that should be updated",
      },
      username: {
        type: "string",
        description: "The username of the person updating the page",
      },
      content: {
        type: "string",
        description: "The new content for the page",
      },
    },
  },
  name: "updatePage",
  provider: "confluence",
};
export const jiraCreateJiraTicketDefinition: ActionTemplate = {
  description: "Create a jira ticket with new content specified",
  scopes: [],
  parameters: {
    type: "object",
    required: ["projectKey", "summary", "description", "issueType", "username"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project you want to add it to",
      },
      summary: {
        type: "string",
        description: "The summary of the new ticket",
      },
      description: {
        type: "string",
        description: "The description for the new ticket",
      },
      issueType: {
        type: "string",
        description: "The issue type of the new ticket",
      },
      reporter: {
        type: "string",
        description: "The reporter for the new ticket creation",
      },
      assignee: {
        type: "string",
        description: "The assignee for the new ticket creation",
      },
      username: {
        type: "string",
        description: "The username of the person creating the ticket",
      },
    },
  },
  output: {
    type: "object",
    required: ["ticketUrl"],
    properties: {
      ticketUrl: {
        type: "string",
        description: "The url to the created Jira Ticket",
      },
    },
  },
  name: "createJiraTicket",
  provider: "jira",
};
export const googlemapsValidateAddressDefinition: ActionTemplate = {
  description: "Validate a Google Maps address",
  scopes: [],
  parameters: {
    type: "object",
    required: ["regionCode", "locality", "addressLines", "postalCode"],
    properties: {
      regionCode: {
        type: "string",
        description: "The country of the address being verified.",
      },
      locality: {
        type: "string",
        description: "The locality of the address being verified. This is likely a city.",
      },
      postalCode: {
        type: "string",
        description: "The postal code of the address being verified.",
      },
      addressLines: {
        type: "array",
        description: "A list of lines of the address. These should be in order as they would appear on an envelope.",
        items: {
          type: "string",
        },
      },
      addressType: {
        type: "string",
        description: "The type of address being validated.",
        enum: ["residential", "business", "poBox"],
      },
      allowFuzzyMatches: {
        type: "boolean",
        description: "Whether to allow fuzzy matches in the address validation by inferring components.",
      },
    },
  },
  output: {
    type: "object",
    required: ["valid"],
    properties: {
      valid: {
        type: "boolean",
        description: "Whether the address is valid.",
      },
      formattedAddress: {
        type: "string",
        description: "The standardized formatted address.",
      },
      addressComponents: {
        type: "array",
        description: "Components of the address, such as street number and route.",
        items: {
          type: "object",
          properties: {
            componentName: {
              type: "string",
              description: "The name of the address component.",
            },
            componentType: {
              type: "array",
              description: "The types associated with this component (e.g., street_number, route).",
              items: {
                type: "string",
              },
            },
          },
        },
      },
      missingComponentTypes: {
        type: "array",
        description: "List of components missing in the input address.",
        items: {
          type: "string",
        },
      },
      unresolvedTokens: {
        type: "array",
        description: "Unrecognized parts of the address.",
        items: {
          type: "string",
        },
      },
      geocode: {
        type: "object",
        description: "Geocode data for the address.",
        properties: {
          location: {
            type: "object",
            properties: {
              latitude: {
                type: "number",
                description: "The latitude of the address.",
              },
              longitude: {
                type: "number",
                description: "The longitude of the address.",
              },
            },
          },
          plusCode: {
            type: "object",
            description: "The Plus Code for the address.",
            properties: {
              globalCode: {
                type: "string",
                description: "The global Plus Code.",
              },
              compoundCode: {
                type: "string",
                description: "The compound Plus Code.",
              },
            },
          },
          bounds: {
            type: "object",
            description: "The viewport bounds for the address.",
            properties: {
              northeast: {
                type: "object",
                properties: {
                  latitude: {
                    type: "number",
                  },
                  longitude: {
                    type: "number",
                  },
                },
              },
              southwest: {
                type: "object",
                properties: {
                  latitude: {
                    type: "number",
                  },
                  longitude: {
                    type: "number",
                  },
                },
              },
            },
          },
        },
      },
      uspsData: {
        type: "object",
        description: "USPS-specific validation details.",
        properties: {
          standardizedAddress: {
            type: "object",
            description: "The standardized USPS address.",
          },
          deliveryPointValidation: {
            type: "string",
            description: "The USPS delivery point validation status.",
          },
          uspsAddressPrecision: {
            type: "string",
            description: "The level of precision for the USPS address.",
          },
        },
      },
    },
  },
  name: "validateAddress",
  provider: "googlemaps",
};
export const credalCallCopilotDefinition: ActionTemplate = {
  description: "Call Credal Copilot for response on a given query",
  scopes: [],
  parameters: {
    type: "object",
    required: ["agentId", "query", "userEmail"],
    properties: {
      agentId: {
        type: "string",
        description: "The ID of the copilot to call",
      },
      query: {
        type: "string",
        description: "The query to ask Credal Copilot",
      },
      userEmail: {
        type: "string",
        description: "The email of the user sending or authorizing the query",
      },
    },
  },
  output: {
    type: "object",
    required: ["response"],
    properties: {
      response: {
        type: "string",
        description: "The response from the Credal Copilot",
      },
    },
  },
  name: "callCopilot",
  provider: "credal",
};
export const zendeskCreateZendeskTicketDefinition: ActionTemplate = {
  description: "Create a ticket in Zendesk",
  scopes: [],
  parameters: {
    type: "object",
    required: ["subject", "requesterEmail", "subdomain"],
    properties: {
      subject: {
        type: "string",
        description: "The subject of the ticket",
      },
      body: {
        type: "string",
        description: "The body of the ticket",
      },
      requesterEmail: {
        type: "string",
        description: "The email of the requester",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
    },
  },
  output: {
    type: "object",
    required: ["ticketId"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket created",
      },
      ticketUrl: {
        type: "string",
        description: "The URL of the ticket created",
      },
    },
  },
  name: "createZendeskTicket",
  provider: "zendesk",
};
export const mongoInsertMongoDocDefinition: ActionTemplate = {
  description: "Insert a document into a MongoDB collection",
  scopes: [],
  parameters: {
    type: "object",
    required: ["databaseName", "collectionName", "document"],
    properties: {
      databaseName: {
        type: "string",
        description: "Database to connect to",
      },
      collectionName: {
        type: "string",
        description: "Collection to insert the document into",
      },
      document: {
        type: "object",
        description: "The document to insert",
      },
    },
  },
  output: {
    type: "object",
    required: ["objectId"],
    properties: {
      objectId: {
        type: "string",
        description: "The new ID of the document inserted",
      },
    },
  },
  name: "insertMongoDoc",
  provider: "mongo",
};
export const snowflakeGetRowByFieldValueDefinition: ActionTemplate = {
  description: "Get a row from a Snowflake table by a field value",
  scopes: [],
  parameters: {
    type: "object",
    required: ["tableName", "fieldName", "fieldValue"],
    properties: {
      databaseName: {
        type: "string",
        description: "The name of the database to query",
      },
      tableName: {
        type: "string",
        description: "The name of the table to query",
      },
      fieldName: {
        type: "string",
        description: "The name of the field to query",
      },
      fieldValue: {
        type: "string",
        description: "The value of the field to query",
      },
      accountName: {
        type: "string",
        description: "The name of the Snowflake account",
      },
      user: {
        type: "string",
        description: "The user to authenticate with",
      },
      warehouse: {
        type: "string",
        description: "The warehouse to use",
      },
    },
  },
  output: {
    type: "object",
    required: ["row"],
    properties: {
      row: {
        type: "object",
        description: "The row from the Snowflake table",
        properties: {
          id: {
            type: "string",
            description: "The ID of the row",
          },
          rowContents: {
            type: "object",
            description: "The contents of the row",
          },
        },
      },
    },
  },
  name: "getRowByFieldValue",
  provider: "snowflake",
};
export const openstreetmapGetLatitudeLongitudeFromLocationDefinition: ActionTemplate = {
  description: "Get the latitude and longitude of a location",
  scopes: [],
  parameters: {
    type: "object",
    required: ["location"],
    properties: {
      location: {
        type: "string",
        description: "The location to get the latitude and longitude of",
      },
    },
  },
  output: {
    type: "object",
    required: [],
    properties: {
      results: {
        type: "array",
        description: "The results of the query",
        items: {
          type: "object",
          required: ["latitude", "longitude"],
          properties: {
            latitude: {
              type: "number",
              description: "The latitude of the location",
            },
            longitude: {
              type: "number",
              description: "The longitude of the location",
            },
          },
        },
      },
    },
  },
  name: "getLatitudeLongitudeFromLocation",
  provider: "openstreetmap",
};
