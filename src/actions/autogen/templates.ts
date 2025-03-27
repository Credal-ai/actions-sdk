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
export const slackGetChannelMessagesDefinition: ActionTemplate = {
  description: "Gets messages from a Slack channel",
  scopes: ["channels:history"],
  parameters: {
    type: "object",
    required: ["channelName", "oldest"],
    properties: {
      channelName: {
        type: "string",
        description: "Name of the channel to summarize",
      },
      oldest: {
        type: "string",
        description: "Only messages after this Unix timestamp will be included in results",
      },
    },
  },
  output: {
    type: "object",
    required: ["messages"],
    properties: {
      messages: {
        type: "array",
        description: "The messages in the channel",
        items: {
          type: "object",
          description: "A message in the channel",
          required: ["user", "text", "ts"],
          properties: {
            user: {
              type: "string",
              description: "The user who sent the message",
            },
            text: {
              type: "string",
              description: "The text of the message",
            },
            ts: {
              type: "string",
              description: "The timestamp of the message",
            },
          },
        },
      },
    },
  },
  name: "getChannelMessages",
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
export const confluenceOverwritePageDefinition: ActionTemplate = {
  description: "Updates a Confluence page with the new content specified",
  scopes: [],
  parameters: {
    type: "object",
    required: ["pageId", "title", "content"],
    properties: {
      pageId: {
        type: "string",
        description: "The page id for the page to add content to",
      },
      title: {
        type: "string",
        description: "The title of the page that should be updated",
      },
      content: {
        type: "string",
        description: "The new content for the page",
      },
    },
  },
  name: "overwritePage",
  provider: "confluence",
};
export const confluenceFetchPageContentDefinition: ActionTemplate = {
  description: "Fetches content from a Confluence page",
  scopes: [],
  parameters: {
    type: "object",
    required: ["pageId"],
    properties: {
      pageId: {
        type: "string",
        description: "The ID of the page to fetch content from",
      },
    },
  },
  output: {
    type: "object",
    required: ["pageId", "title", "content"],
    properties: {
      pageId: {
        type: "string",
        description: "The ID of the page",
      },
      title: {
        type: "string",
        description: "The title of the page",
      },
      content: {
        type: "string",
        description: "The content of the page in storage format (HTML)",
      },
    },
  },
  name: "fetchPageContent",
  provider: "confluence",
};
export const jiraCommentJiraTicketDefinition: ActionTemplate = {
  description: "Comments on a Jira ticket with specified content",
  scopes: ["write:comment:jira"],
  parameters: {
    type: "object",
    required: ["projectKey", "issueId", "comment"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project you want to add it to",
      },
      issueId: {
        type: "string",
        description: "The issue ID associated with the ticket to be commented on",
      },
      comment: {
        type: "string",
        description: "The text to be commented on the ticket",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the comment was sent successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the comment was not sent successfully",
      },
      commentUrl: {
        type: "string",
        description: "The url to the created Jira comment",
      },
    },
  },
  name: "commentJiraTicket",
  provider: "jira",
};
export const jiraAssignJiraTicketDefinition: ActionTemplate = {
  description: "Assigns/Re-assignes a Jira ticket to a specified user",
  scopes: ["write:jira-work", "read:jira-user"],
  parameters: {
    type: "object",
    required: ["projectKey", "issueId", "assignee"],
    properties: {
      projectKey: {
        type: "string",
        description: "The key for the project you want to add it to",
      },
      assignee: {
        type: "string",
        description: "The assignee for the ticket, userID or email",
      },
      issueId: {
        type: "string",
        description: "The issue ID associated with the ticket to be assigned/re-assigned",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the ticket was successfully assigned/reassigned",
      },
      error: {
        type: "string",
        description: "The error that occurred if the ticket was not successfully assigned/reassigned",
      },
      ticketUrl: {
        type: "string",
        description: "The url to the newly assigned/reassigned Jira ticket",
      },
    },
  },
  name: "assignJiraTicket",
  provider: "jira",
};
export const jiraCreateJiraTicketDefinition: ActionTemplate = {
  description: "Create a jira ticket with new content specified",
  scopes: [],
  parameters: {
    type: "object",
    required: ["projectKey", "summary", "description", "issueType"],
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
      customFields: {
        type: "object",
        description: "Custom fields to be set on the create ticket request",
        additionalProperties: true,
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
export const googlemapsNearbysearchRestaurantsDefinition: ActionTemplate = {
  description: "Search for nearby places using Google Maps",
  scopes: [],
  parameters: {
    type: "object",
    required: ["latitude", "longitude"],
    properties: {
      latitude: {
        type: "number",
        description: "The latitude of the location to search nearby",
      },
      longitude: {
        type: "number",
        description: "The longitude of the location to search nearby",
      },
    },
  },
  output: {
    type: "object",
    required: ["results"],
    properties: {
      results: {
        type: "array",
        description: "The results of the nearby search",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the place",
            },
            address: {
              type: "string",
              description: "The address of the place",
            },
            rating: {
              type: "number",
              description: "The rating of the place",
            },
            priceLevel: {
              type: "string",
              description: "The price level of the place",
            },
            openingHours: {
              type: "string",
              description: "The opening hours of the place",
            },
            primaryType: {
              type: "string",
              description: "The primary type of the place",
            },
            editorialSummary: {
              type: "string",
              description: "The editorial summary of the place",
            },
            websiteUri: {
              type: "string",
              description: "The website URI of the place",
            },
          },
        },
      },
    },
  },
  name: "nearbysearchRestaurants",
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
      referencedSources: {
        type: "array",
        description: "The sources referenced in the response",
        items: {
          type: "object",
          description: "The source referenced in the response",
          required: ["id", "externalResourceId", "name"],
          properties: {
            id: {
              type: "string",
              description: "The id of the source",
            },
            externalResourceId: {
              type: "object",
              required: ["externalResourceId", "resourceType"],
              description: "The external resource id of the source",
              properties: {
                externalResourceId: {
                  type: "string",
                  description: "The external resource id of the source",
                },
                resourceType: {
                  type: "string",
                  description: "The type of the resource",
                },
              },
            },
            name: {
              type: "string",
              description: "The name of the source",
            },
            url: {
              type: "string",
              description: "The url of the source",
            },
          },
        },
      },
      sourcesInDataContext: {
        type: "array",
        description: "The sources in the data context of the response",
        items: {
          type: "object",
          description: "The source in the data context of the response",
          required: ["id", "externalResourceId", "name"],
          properties: {
            id: {
              type: "string",
              description: "The id of the source",
            },
            externalResourceId: {
              type: "object",
              description: "The external resource id of the source",
              required: ["externalResourceId", "resourceType"],
              properties: {
                externalResourceId: {
                  type: "string",
                  description: "The external resource id of the source",
                },
                resourceType: {
                  type: "string",
                  description: "The type of the resource",
                },
              },
            },
            name: {
              type: "string",
              description: "The name of the source",
            },
            url: {
              type: "string",
              description: "The url of the source",
            },
          },
        },
      },
      webSearchResults: {
        type: "array",
        description: "The web search results in the response",
        items: {
          type: "object",
          description: "The web search result in the response",
          required: ["title", "url"],
          properties: {
            title: {
              type: "string",
              description: "The title of the web search result",
            },
            url: {
              type: "string",
              description: "The url of the web search result",
            },
            contents: {
              type: "string",
              description: "The contents of the web search result",
            },
          },
        },
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
    required: ["subject", "subdomain"],
    properties: {
      subject: {
        type: "string",
        description: "The subject of the ticket",
      },
      body: {
        type: "string",
        description: "The body of the ticket",
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
export const zendeskGetTicketDetailsDefinition: ActionTemplate = {
  description: "Get details of a ticket in Zendesk",
  scopes: [],
  parameters: {
    type: "object",
    required: ["ticketId", "subdomain"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
    },
  },
  output: {
    type: "object",
    required: ["ticket"],
    properties: {
      ticket: {
        type: "object",
        description: "The details of the ticket",
      },
    },
  },
  name: "getTicketDetails",
  provider: "zendesk",
};
export const zendeskUpdateTicketStatusDefinition: ActionTemplate = {
  description: "Update the status of a ticket in Zendesk",
  scopes: [],
  parameters: {
    type: "object",
    required: ["ticketId", "subdomain", "status"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket to update",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
      status: {
        type: "string",
        description:
          'The state of the ticket. If your account has activated custom ticket statuses, this is the ticket\'s status category. Allowed values are "new", "open", "pending", "hold", "solved", or "closed".',
      },
    },
  },
  name: "updateTicketStatus",
  provider: "zendesk",
};
export const zendeskAddCommentToTicketDefinition: ActionTemplate = {
  description: "Add a comment to a ticket in Zendesk",
  scopes: [],
  parameters: {
    type: "object",
    required: ["ticketId", "subdomain", "comment"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket to update",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
      comment: {
        type: "object",
        description: "The comment to add to the ticket",
        required: ["body"],
        properties: {
          body: {
            type: "string",
            description: "The body of the comment",
          },
          public: {
            type: "boolean",
            description: "Whether the comment should be public",
          },
        },
      },
    },
  },
  name: "addCommentToTicket",
  provider: "zendesk",
};
export const zendeskAssignTicketDefinition: ActionTemplate = {
  description: "Assign a ticket in Zendesk to a specific user",
  scopes: [],
  parameters: {
    type: "object",
    required: ["ticketId", "subdomain", "assigneeEmail"],
    properties: {
      ticketId: {
        type: "string",
        description: "The ID of the ticket to update",
      },
      subdomain: {
        type: "string",
        description: "The subdomain of the Zendesk account",
      },
      assigneeEmail: {
        type: "string",
        description: "The email address of the agent to assign the ticket to",
      },
    },
  },
  name: "assignTicket",
  provider: "zendesk",
};
export const linkedinCreateShareLinkedinPostUrlDefinition: ActionTemplate = {
  description: "Create a share linkedin post link",
  scopes: [],
  parameters: {
    type: "object",
    required: [],
    properties: {
      text: {
        type: "string",
        description: "The text for the linkedin post",
      },
      url: {
        type: "string",
        description: "The url for the linkedin post",
      },
    },
  },
  output: {
    type: "object",
    required: ["linkedinUrl"],
    properties: {
      linkedinUrl: {
        type: "string",
        description: "The share post linkedin URL",
      },
    },
  },
  name: "createShareLinkedinPostUrl",
  provider: "linkedin",
};
export const xCreateShareXPostUrlDefinition: ActionTemplate = {
  description: "Create a share X (formerly twitter) post link",
  scopes: [],
  parameters: {
    type: "object",
    required: ["text"],
    properties: {
      text: {
        type: "string",
        description: "The text for the X(formerly twitter) post",
      },
      url: {
        type: "string",
        description: "The url for the X(formerly twitter) post",
      },
      hashtag: {
        type: "array",
        description: "List of hashtags to include in the X post",
        items: {
          type: "string",
        },
      },
      via: {
        type: "string",
        description: "The twitter username to associate with the tweet",
      },
      inReplyTo: {
        type: "string",
        description: "The tweet ID to reply to",
      },
    },
  },
  output: {
    type: "object",
    required: ["xUrl"],
    properties: {
      xUrl: {
        type: "string",
        description: "The share post X(formerly twitter) URL",
      },
    },
  },
  name: "createShareXPostUrl",
  provider: "x",
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
export const snowflakeRunSnowflakeQueryDefinition: ActionTemplate = {
  description: "Execute a Snowflake query and return output.",
  scopes: [],
  parameters: {
    type: "object",
    required: ["databaseName", "warehouse", "query", "user", "accountName"],
    properties: {
      databaseName: {
        type: "string",
        description: "The name of the database to query",
      },
      warehouse: {
        type: "string",
        description: "The warehouse to use for executing the query",
      },
      query: {
        type: "string",
        description: "The SQL query to execute",
      },
      user: {
        type: "string",
        description: "The username to authenticate with",
      },
      accountName: {
        type: "string",
        description: "The name of the Snowflake account",
      },
      outputFormat: {
        type: "string",
        description: "The format of the output",
        enum: ["json", "csv"],
      },
    },
  },
  output: {
    type: "object",
    required: ["format", "content", "rowCount"],
    properties: {
      format: {
        type: "string",
        description: "The format of the output",
        enum: ["json", "csv"],
      },
      content: {
        type: "string",
        description: "The content of the query result (json)",
      },
      rowCount: {
        type: "number",
        description: "The number of rows returned by the query",
      },
    },
  },
  name: "runSnowflakeQuery",
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
          required: ["latitude", "longitude", "display_name"],
          properties: {
            latitude: {
              type: "number",
              description: "The latitude of the location",
            },
            longitude: {
              type: "number",
              description: "The longitude of the location",
            },
            display_name: {
              type: "string",
              description: "The display name of the location",
            },
          },
        },
      },
    },
  },
  name: "getLatitudeLongitudeFromLocation",
  provider: "openstreetmap",
};
export const nwsGetForecastForLocationDefinition: ActionTemplate = {
  description: "Get the weather forecast for a location using latitude and longitude",
  scopes: [],
  parameters: {
    type: "object",
    required: ["latitude", "longitude", "isoDate"],
    properties: {
      latitude: {
        type: "number",
        description: "The latitude of the location",
      },
      longitude: {
        type: "number",
        description: "The longitude of the location",
      },
      isoDate: {
        type: "string",
        description: "The date to get the forecast for, in ISO datetime format",
      },
    },
  },
  output: {
    type: "object",
    required: [],
    properties: {
      result: {
        type: "object",
        required: ["temperature", "temperatureUnit", "forecast"],
        properties: {
          temperature: {
            type: "number",
            description: "The temperature at the location",
          },
          temperatureUnit: {
            type: "string",
            description: "The unit of temperature",
          },
          forecast: {
            type: "string",
            description: "The forecast for the location",
          },
        },
      },
    },
  },
  name: "getForecastForLocation",
  provider: "nws",
};
export const firecrawlScrapeUrlDefinition: ActionTemplate = {
  description: "Scrape a URL and get website content using Firecrawl",
  scopes: [],
  parameters: {
    type: "object",
    required: ["url"],
    properties: {
      url: {
        type: "string",
        description: "The URL to scrape",
      },
    },
  },
  output: {
    type: "object",
    required: ["content"],
    properties: {
      content: {
        type: "string",
        description: "The content of the URL",
      },
    },
  },
  name: "scrapeUrl",
  provider: "firecrawl",
};
export const firecrawlScrapeTweetDataWithNitterDefinition: ActionTemplate = {
  description: "Given A tweet URL scrape the tweet data with nitter+firecrawl",
  scopes: [],
  parameters: {
    type: "object",
    required: ["tweetUrl"],
    properties: {
      tweetUrl: {
        type: "string",
        description: "The url for the X(formerly twitter) post",
      },
    },
  },
  output: {
    type: "object",
    required: ["text"],
    properties: {
      text: {
        type: "string",
        description: "The text in the tweet URL",
      },
    },
  },
  name: "scrapeTweetDataWithNitter",
  provider: "firecrawl",
};
export const resendSendEmailDefinition: ActionTemplate = {
  description: "Send an email using Resend",
  scopes: [],
  parameters: {
    type: "object",
    required: ["to", "subject", "content"],
    properties: {
      to: {
        type: "string",
        description: "The email address to send the email to",
      },
      subject: {
        type: "string",
        description: "The subject of the email",
      },
      content: {
        type: "string",
        description: "The content of the email",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the email was sent successfully",
      },
      error: {
        type: "string",
        description: "The error that occurred if the email was not sent successfully",
      },
    },
  },
  name: "sendEmail",
  provider: "resend",
};
export const googleOauthCreateNewGoogleDocDefinition: ActionTemplate = {
  description: "Create a new Google Docs document using OAuth authentication",
  scopes: [],
  parameters: {
    type: "object",
    required: ["title"],
    properties: {
      title: {
        type: "string",
        description: "The title of the new Google Doc",
      },
      content: {
        type: "string",
        description: "The content to add to the new Google Doc",
      },
    },
  },
  output: {
    type: "object",
    required: ["documentId"],
    properties: {
      documentId: {
        type: "string",
        description: "The ID of the created Google Doc",
      },
      documentUrl: {
        type: "string",
        description: "The URL to access the created Google Doc",
      },
    },
  },
  name: "createNewGoogleDoc",
  provider: "googleOauth",
};
export const googleOauthUpdateDocDefinition: ActionTemplate = {
  description: "Update an existing Google Docs document using OAuth authentication with batch requests",
  scopes: [],
  parameters: {
    type: "object",
    required: ["documentId"],
    properties: {
      documentId: {
        type: "string",
        description: "The ID of the Google Doc to update",
      },
      requests: {
        type: "array",
        description:
          "Array of requests to apply to the document. See https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/request#Request",
        items: {
          type: "object",
          description: "A single update request that must contain exactly one of the following operations",
          oneOf: [
            {
              type: "object",
              required: ["replaceAllText"],
              properties: {
                replaceAllText: {
                  type: "object",
                  description: "Replaces all instances of text matching a criteria",
                  required: ["replaceText", "containsText"],
                  properties: {
                    replaceText: {
                      type: "string",
                      description: "The text that will replace the matched text",
                    },
                    containsText: {
                      type: "object",
                      description: "The text to search for",
                      required: ["text"],
                      properties: {
                        text: {
                          type: "string",
                          description: "The text to search for in the document",
                        },
                        matchCase: {
                          type: "boolean",
                          description: "Whether the search should be case sensitive",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertText"],
              properties: {
                insertText: {
                  type: "object",
                  description: "Inserts text at a specific location",
                  required: ["text", "location"],
                  properties: {
                    text: {
                      type: "string",
                      description: "The text to insert",
                    },
                    location: {
                      type: "object",
                      description: "The location where the text will be inserted",
                      required: ["index"],
                      properties: {
                        index: {
                          type: "integer",
                          description: "The zero-based index in the document where to insert the text",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateTextStyle"],
              properties: {
                updateTextStyle: {
                  type: "object",
                  description: "Updates the styling of text",
                  required: ["textStyle", "fields"],
                  properties: {
                    textStyle: {
                      type: "object",
                      description: "The styles to set on the text",
                      properties: {
                        backgroundColor: {
                          type: "object",
                          description: "The background color of the text",
                        },
                        baselineOffset: {
                          type: "string",
                          description: "The text's vertical offset from its normal position",
                          enum: ["BASELINE_OFFSET_UNSPECIFIED", "NONE", "SUPERSCRIPT", "SUBSCRIPT"],
                        },
                        bold: {
                          type: "boolean",
                          description: "Whether the text is bold",
                        },
                        fontSize: {
                          type: "object",
                          description: "The size of the text's font",
                          properties: {
                            magnitude: {
                              type: "number",
                              description: "The font size in points",
                            },
                            unit: {
                              type: "string",
                              description: "The units for the font size",
                            },
                          },
                        },
                        foregroundColor: {
                          type: "object",
                          description: "The foreground color of the text",
                        },
                        italic: {
                          type: "boolean",
                          description: "Whether the text is italicized",
                        },
                        link: {
                          type: "object",
                          description: "The hyperlink destination of the text",
                          properties: {
                            url: {
                              type: "string",
                              description: "The URL of the link",
                            },
                          },
                        },
                        strikethrough: {
                          type: "boolean",
                          description: "Whether the text is struck through",
                        },
                        underline: {
                          type: "boolean",
                          description: "Whether the text is underlined",
                        },
                        weightedFontFamily: {
                          type: "object",
                          description: "The font family and weight of the text",
                          properties: {
                            fontFamily: {
                              type: "string",
                              description: "The font family of the text",
                            },
                            weight: {
                              type: "integer",
                              description: "The weight of the font",
                            },
                          },
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields that should be updated",
                    },
                    range: {
                      type: "object",
                      description: "The range of text to style",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteContentRange"],
              properties: {
                deleteContentRange: {
                  type: "object",
                  description: "Deletes content between two structural locations",
                  required: ["range"],
                  properties: {
                    range: {
                      type: "object",
                      description: "The range of content to delete",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertTableRow"],
              properties: {
                insertTableRow: {
                  type: "object",
                  description: "Inserts a new table row",
                  required: ["tableCellLocation", "insertBelow"],
                  properties: {
                    tableCellLocation: {
                      type: "object",
                      description: "The location where the table row will be inserted",
                      required: ["tableStartLocation"],
                      properties: {
                        tableStartLocation: {
                          type: "object",
                          description: "The location where the table starts",
                          required: ["index"],
                          properties: {
                            index: {
                              type: "integer",
                              description: "The zero-based index in the document",
                            },
                          },
                        },
                        rowIndex: {
                          type: "integer",
                          description: "The zero-based row index",
                        },
                        columnIndex: {
                          type: "integer",
                          description: "The zero-based column index",
                        },
                      },
                    },
                    insertBelow: {
                      type: "boolean",
                      description: "Whether to insert the row below the reference row",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertTableColumn"],
              properties: {
                insertTableColumn: {
                  type: "object",
                  description: "Inserts a new table column",
                  required: ["tableCellLocation", "insertRight"],
                  properties: {
                    tableCellLocation: {
                      type: "object",
                      description: "The location where the table column will be inserted",
                      required: ["tableStartLocation"],
                      properties: {
                        tableStartLocation: {
                          type: "object",
                          description: "The location where the table starts",
                          required: ["index"],
                          properties: {
                            index: {
                              type: "integer",
                              description: "The zero-based index in the document",
                            },
                          },
                        },
                        rowIndex: {
                          type: "integer",
                          description: "The zero-based row index",
                        },
                        columnIndex: {
                          type: "integer",
                          description: "The zero-based column index",
                        },
                      },
                    },
                    insertRight: {
                      type: "boolean",
                      description: "Whether to insert the column to the right of the reference column",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteTableRow"],
              properties: {
                deleteTableRow: {
                  type: "object",
                  description: "Deletes a table row",
                  required: ["tableCellLocation"],
                  properties: {
                    tableCellLocation: {
                      type: "object",
                      description: "The location of the row to delete",
                      required: ["tableStartLocation"],
                      properties: {
                        tableStartLocation: {
                          type: "object",
                          description: "The location where the table starts",
                          required: ["index"],
                          properties: {
                            index: {
                              type: "integer",
                              description: "The zero-based index in the document",
                            },
                          },
                        },
                        rowIndex: {
                          type: "integer",
                          description: "The zero-based row index",
                        },
                        columnIndex: {
                          type: "integer",
                          description: "The zero-based column index",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteTableColumn"],
              properties: {
                deleteTableColumn: {
                  type: "object",
                  description: "Deletes a table column",
                  required: ["tableCellLocation"],
                  properties: {
                    tableCellLocation: {
                      type: "object",
                      description: "The location of the column to delete",
                      required: ["tableStartLocation"],
                      properties: {
                        tableStartLocation: {
                          type: "object",
                          description: "The location where the table starts",
                          required: ["index"],
                          properties: {
                            index: {
                              type: "integer",
                              description: "The zero-based index in the document",
                            },
                          },
                        },
                        rowIndex: {
                          type: "integer",
                          description: "The zero-based row index",
                        },
                        columnIndex: {
                          type: "integer",
                          description: "The zero-based column index",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateParagraphStyle"],
              properties: {
                updateParagraphStyle: {
                  type: "object",
                  description: "Updates the style of paragraphs",
                  required: ["range", "paragraphStyle", "fields"],
                  properties: {
                    range: {
                      type: "object",
                      description: "The range of paragraphs to update",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                    paragraphStyle: {
                      type: "object",
                      description: "The styles to set on the paragraphs",
                      properties: {
                        alignment: {
                          type: "string",
                          description: "The text alignment",
                          enum: ["ALIGNMENT_UNSPECIFIED", "START", "CENTER", "END", "JUSTIFIED"],
                        },
                        direction: {
                          type: "string",
                          description: "The text direction",
                          enum: ["CONTENT_DIRECTION_UNSPECIFIED", "LEFT_TO_RIGHT", "RIGHT_TO_LEFT"],
                        },
                        indentStart: {
                          type: "object",
                          description: "The amount of indentation for the paragraph",
                          properties: {
                            magnitude: {
                              type: "number",
                              description: "The magnitude of indentation",
                            },
                            unit: {
                              type: "string",
                              description: "The units of indentation",
                            },
                          },
                        },
                        indentEnd: {
                          type: "object",
                          description: "The amount of indentation from the end",
                        },
                        indentFirstLine: {
                          type: "object",
                          description: "The amount of indentation for the first line",
                        },
                        keepLinesTogether: {
                          type: "boolean",
                          description: "Whether to keep all lines on the same page",
                        },
                        keepWithNext: {
                          type: "boolean",
                          description: "Whether to keep with the next paragraph",
                        },
                        lineSpacing: {
                          type: "number",
                          description: "The amount of space between lines",
                        },
                        spaceAbove: {
                          type: "object",
                          description: "The amount of space above the paragraph",
                        },
                        spaceBelow: {
                          type: "object",
                          description: "The amount of space below the paragraph",
                        },
                        spacingMode: {
                          type: "string",
                          description: "The spacing mode",
                          enum: ["SPACING_MODE_UNSPECIFIED", "NEVER_COLLAPSE", "COLLAPSE_LISTS"],
                        },
                        tabStops: {
                          type: "array",
                          description: "The tab stops for the paragraph",
                          items: {
                            type: "object",
                            properties: {
                              offset: {
                                type: "object",
                                description: "The offset of the tab stop",
                              },
                              alignment: {
                                type: "string",
                                description: "The alignment of the tab stop",
                              },
                            },
                          },
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields that should be updated",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createParagraphBullets"],
              properties: {
                createParagraphBullets: {
                  type: "object",
                  description: "Creates bullets for paragraphs",
                  required: ["range", "bulletPreset"],
                  properties: {
                    range: {
                      type: "object",
                      description: "The range of paragraphs to bullet",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                    bulletPreset: {
                      type: "string",
                      description: "The preset type of bullet to use",
                      enum: [
                        "BULLET_UNSPECIFIED",
                        "BULLET_DISC_CIRCLE_SQUARE",
                        "BULLET_DIAMONDX_ARROW3D_SQUARE",
                        "BULLET_CHECKBOX",
                        "BULLET_ARROW_DIAMOND_DISC",
                        "BULLET_STAR_CIRCLE_SQUARE",
                        "BULLET_ARROW3D_CIRCLE_SQUARE",
                        "BULLET_LEFTTRIANGLE_DIAMOND_DISC",
                        "BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE",
                        "BULLET_DIAMOND_CIRCLE_SQUARE",
                        "NUMBERED_DECIMAL_NESTED",
                        "NUMBERED_DECIMAL_PARENTHESIS_NESTED",
                        "NUMBERED_DECIMAL_PERIOD_NESTED",
                        "NUMBERED_UPPERALPHA_PARENTHESIS_NESTED",
                        "NUMBERED_UPPERROMAN_PARENTHESIS_NESTED",
                        "NUMBERED_LOWERALPHA_PARENTHESIS_NESTED",
                        "NUMBERED_LOWERROMAN_PARENTHESIS_NESTED",
                      ],
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteParagraphBullets"],
              properties: {
                deleteParagraphBullets: {
                  type: "object",
                  description: "Deletes bullets from paragraphs",
                  required: ["range"],
                  properties: {
                    range: {
                      type: "object",
                      description: "The range of paragraphs to remove bullets from",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertPageBreak"],
              properties: {
                insertPageBreak: {
                  type: "object",
                  description: "Inserts a page break",
                  required: ["location"],
                  properties: {
                    location: {
                      type: "object",
                      description: "The location at which to insert the page break",
                      required: ["index"],
                      properties: {
                        index: {
                          type: "integer",
                          description: "The zero-based index in the document",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateDocumentStyle"],
              properties: {
                updateDocumentStyle: {
                  type: "object",
                  description: "Updates the style of the document",
                  required: ["documentStyle", "fields"],
                  properties: {
                    documentStyle: {
                      type: "object",
                      description: "The styles to set on the document",
                      properties: {
                        background: {
                          type: "object",
                          description: "The background of the document",
                        },
                        defaultHeaderId: {
                          type: "string",
                          description: "The ID of the default header",
                        },
                        defaultFooterId: {
                          type: "string",
                          description: "The ID of the default footer",
                        },
                        evenPageHeaderId: {
                          type: "string",
                          description: "The ID of the header used on even pages",
                        },
                        evenPageFooterId: {
                          type: "string",
                          description: "The ID of the footer used on even pages",
                        },
                        firstPageHeaderId: {
                          type: "string",
                          description: "The ID of the header used on the first page",
                        },
                        firstPageFooterId: {
                          type: "string",
                          description: "The ID of the footer used on the first page",
                        },
                        marginTop: {
                          type: "object",
                          description: "The top page margin",
                        },
                        marginBottom: {
                          type: "object",
                          description: "The bottom page margin",
                        },
                        marginRight: {
                          type: "object",
                          description: "The right page margin",
                        },
                        marginLeft: {
                          type: "object",
                          description: "The left page margin",
                        },
                        pageNumberStart: {
                          type: "integer",
                          description: "The page number from which to start counting",
                        },
                        pageSize: {
                          type: "object",
                          description: "The size of the pages in the document",
                          properties: {
                            width: {
                              type: "object",
                              description: "The width of the page",
                            },
                            height: {
                              type: "object",
                              description: "The height of the page",
                            },
                          },
                        },
                        useCustomHeaderFooterMargins: {
                          type: "boolean",
                          description: "Whether to use custom margins for headers and footers",
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields that should be updated",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createHeader"],
              properties: {
                createHeader: {
                  type: "object",
                  description: "Creates a header",
                  required: ["type"],
                  properties: {
                    type: {
                      type: "string",
                      description: "The type of header to create",
                      enum: ["HEADER_TYPE_UNSPECIFIED", "DEFAULT", "FIRST_PAGE", "EVEN_PAGE"],
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createFooter"],
              properties: {
                createFooter: {
                  type: "object",
                  description: "Creates a footer",
                  required: ["type"],
                  properties: {
                    type: {
                      type: "string",
                      description: "The type of footer to create",
                      enum: ["FOOTER_TYPE_UNSPECIFIED", "DEFAULT", "FIRST_PAGE", "EVEN_PAGE"],
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["updateTableCellStyle"],
              properties: {
                updateTableCellStyle: {
                  type: "object",
                  description: "Updates the style of table cells",
                  required: ["tableCellStyle", "fields", "tableRange"],
                  properties: {
                    tableCellStyle: {
                      type: "object",
                      description: "The style to apply to the cells",
                      properties: {
                        backgroundColor: {
                          type: "object",
                          description: "The background color of the cells",
                        },
                        borderBottom: {
                          type: "object",
                          description: "The bottom border of the cells",
                        },
                        borderLeft: {
                          type: "object",
                          description: "The left border of the cells",
                        },
                        borderRight: {
                          type: "object",
                          description: "The right border of the cells",
                        },
                        borderTop: {
                          type: "object",
                          description: "The top border of the cells",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns that the cell spans",
                        },
                        contentAlignment: {
                          type: "string",
                          description: "The alignment of the content within the cells",
                        },
                        paddingBottom: {
                          type: "object",
                          description: "The bottom padding of the cells",
                        },
                        paddingLeft: {
                          type: "object",
                          description: "The left padding of the cells",
                        },
                        paddingRight: {
                          type: "object",
                          description: "The right padding of the cells",
                        },
                        paddingTop: {
                          type: "object",
                          description: "The top padding of the cells",
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows that the cell spans",
                        },
                      },
                    },
                    fields: {
                      type: "string",
                      description: "The fields that should be updated",
                    },
                    tableRange: {
                      type: "object",
                      description: "The table range to apply the style to",
                      required: ["tableCellLocation", "rowSpan", "columnSpan"],
                      properties: {
                        tableCellLocation: {
                          type: "object",
                          description: "The location of the table cell",
                          required: ["tableStartLocation"],
                          properties: {
                            tableStartLocation: {
                              type: "object",
                              description: "The location where the table starts",
                              required: ["index"],
                              properties: {
                                index: {
                                  type: "integer",
                                  description: "The zero-based index in the document",
                                },
                              },
                            },
                            rowIndex: {
                              type: "integer",
                              description: "The zero-based row index",
                            },
                            columnIndex: {
                              type: "integer",
                              description: "The zero-based column index",
                            },
                          },
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows that the range should span",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns that the range should span",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["mergeTableCells"],
              properties: {
                mergeTableCells: {
                  type: "object",
                  description: "Merges table cells together",
                  required: ["tableRange"],
                  properties: {
                    tableRange: {
                      type: "object",
                      description: "The table range to merge",
                      required: ["tableCellLocation", "rowSpan", "columnSpan"],
                      properties: {
                        tableCellLocation: {
                          type: "object",
                          description: "The location of the table cell",
                          required: ["tableStartLocation"],
                          properties: {
                            tableStartLocation: {
                              type: "object",
                              description: "The location where the table starts",
                              required: ["index"],
                              properties: {
                                index: {
                                  type: "integer",
                                  description: "The zero-based index in the document",
                                },
                              },
                            },
                            rowIndex: {
                              type: "integer",
                              description: "The zero-based row index",
                            },
                            columnIndex: {
                              type: "integer",
                              description: "The zero-based column index",
                            },
                          },
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows that the range should span",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns that the range should span",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["unmergeTableCells"],
              properties: {
                unmergeTableCells: {
                  type: "object",
                  description: "Unmerges merged table cells",
                  required: ["tableRange"],
                  properties: {
                    tableRange: {
                      type: "object",
                      description: "The table range to unmerge",
                      required: ["tableCellLocation", "rowSpan", "columnSpan"],
                      properties: {
                        tableCellLocation: {
                          type: "object",
                          description: "The location of the table cell",
                          required: ["tableStartLocation"],
                          properties: {
                            tableStartLocation: {
                              type: "object",
                              description: "The location where the table starts",
                              required: ["index"],
                              properties: {
                                index: {
                                  type: "integer",
                                  description: "The zero-based index in the document",
                                },
                              },
                            },
                            rowIndex: {
                              type: "integer",
                              description: "The zero-based row index",
                            },
                            columnIndex: {
                              type: "integer",
                              description: "The zero-based column index",
                            },
                          },
                        },
                        rowSpan: {
                          type: "integer",
                          description: "The number of rows that the range should span",
                        },
                        columnSpan: {
                          type: "integer",
                          description: "The number of columns that the range should span",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["createNamedRange"],
              properties: {
                createNamedRange: {
                  type: "object",
                  description: "Creates a named range",
                  required: ["name", "range"],
                  properties: {
                    name: {
                      type: "string",
                      description: "The name of the range",
                    },
                    range: {
                      type: "object",
                      description: "The range to name",
                      required: ["startIndex", "endIndex"],
                      properties: {
                        startIndex: {
                          type: "integer",
                          description: "The zero-based starting index of the range",
                        },
                        endIndex: {
                          type: "integer",
                          description: "The zero-based ending index of the range (exclusive)",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteNamedRange"],
              properties: {
                deleteNamedRange: {
                  type: "object",
                  description: "Deletes a named range",
                  required: ["name"],
                  properties: {
                    name: {
                      type: "string",
                      description: "The name of the range to delete",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["replaceNamedRangeContent"],
              properties: {
                replaceNamedRangeContent: {
                  type: "object",
                  description: "Replaces the content of a named range",
                  required: ["name", "text"],
                  properties: {
                    name: {
                      type: "string",
                      description: "The name of the range to replace",
                    },
                    text: {
                      type: "string",
                      description: "The text to replace with",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["insertInlineImage"],
              properties: {
                insertInlineImage: {
                  type: "object",
                  description: "Inserts an inline image at a specific location",
                  required: ["location", "uri", "objectSize"],
                  properties: {
                    location: {
                      type: "object",
                      description: "The location at which to insert the image",
                      required: ["index"],
                      properties: {
                        index: {
                          type: "integer",
                          description: "The zero-based index in the document",
                        },
                      },
                    },
                    uri: {
                      type: "string",
                      description: "The image URI",
                    },
                    objectSize: {
                      type: "object",
                      description: "The size that the object should appear as in the document",
                      properties: {
                        width: {
                          type: "object",
                          description: "The width of the image",
                        },
                        height: {
                          type: "object",
                          description: "The height of the image",
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteHeader"],
              properties: {
                deleteHeader: {
                  type: "object",
                  description: "Deletes a header",
                  required: ["headerId"],
                  properties: {
                    headerId: {
                      type: "string",
                      description: "The ID of the header to delete",
                    },
                  },
                },
              },
            },
            {
              type: "object",
              required: ["deleteFooter"],
              properties: {
                deleteFooter: {
                  type: "object",
                  description: "Deletes a footer",
                  required: ["footerId"],
                  properties: {
                    footerId: {
                      type: "string",
                      description: "The ID of the footer to delete",
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the document was updated successfully",
      },
      documentId: {
        type: "string",
        description: "The ID of the updated Google Doc",
      },
      documentUrl: {
        type: "string",
        description: "The URL to access the updated Google Doc",
      },
      error: {
        type: "string",
        description: "The error message if the update failed",
      },
    },
  },
  name: "updateDoc",
  provider: "googleOauth",
};
export const googleOauthScheduleCalendarMeetingDefinition: ActionTemplate = {
  description: "Schedule a meeting on google calendar using OAuth authentication",
  scopes: [],
  parameters: {
    type: "object",
    required: ["calendarId", "name", "start", "end"],
    properties: {
      calendarId: {
        type: "string",
        description: "The ID of the calendar to schedule the meeting on",
      },
      name: {
        type: "string",
        description: "The name of the meeting",
      },
      start: {
        type: "string",
        description: "The start time of the meeting",
      },
      end: {
        type: "string",
        description: "The end time of the meeting",
      },
      description: {
        type: "string",
        description: "The description of the meeting",
      },
      attendees: {
        type: "array",
        description: "The attendees of the meeting",
        items: {
          type: "string",
          description: "The email of the attendee",
        },
      },
      useGoogleMeet: {
        type: "boolean",
        description: "Whether to use Google Meet for the meeting",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the meeting was scheduled successfully",
      },
      eventId: {
        type: "string",
        description: "The ID of the event that was scheduled",
      },
      eventUrl: {
        type: "string",
        description: "The URL to access the scheduled event",
      },
      error: {
        type: "string",
        description: "The error that occurred if the meeting was not scheduled successfully",
      },
    },
  },
  name: "scheduleCalendarMeeting",
  provider: "googleOauth",
};
export const googleOauthCreateSpreadsheetDefinition: ActionTemplate = {
  description: "Create a new Google Spreadsheet using OAuth authentication",
  scopes: [],
  parameters: {
    type: "object",
    required: ["title"],
    properties: {
      title: {
        type: "string",
        description: "The title of the new spreadsheet",
      },
      sheets: {
        type: "array",
        description: "The initial sheets to create in the spreadsheet",
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title of the sheet",
            },
            gridProperties: {
              type: "object",
              properties: {
                rowCount: {
                  type: "integer",
                  description: "The number of rows in the sheet",
                },
                columnCount: {
                  type: "integer",
                  description: "The number of columns in the sheet",
                },
                frozenRowCount: {
                  type: "integer",
                  description: "The number of frozen rows",
                },
                frozenColumnCount: {
                  type: "integer",
                  description: "The number of frozen columns",
                },
              },
            },
          },
        },
      },
      properties: {
        type: "object",
        description: "Properties for the spreadsheet",
        properties: {
          locale: {
            type: "string",
            description: "The locale of the spreadsheet (e.g., en_US)",
          },
          timeZone: {
            type: "string",
            description: "The time zone of the spreadsheet (e.g., America/New_York)",
          },
          autoRecalc: {
            type: "string",
            enum: ["ON_CHANGE", "MINUTE", "HOUR"],
            description: "When to recalculate the spreadsheet",
          },
        },
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the spreadsheet was created successfully",
      },
      spreadsheetId: {
        type: "string",
        description: "The ID of the created spreadsheet",
      },
      spreadsheetUrl: {
        type: "string",
        description: "The URL to access the created spreadsheet",
      },
      sheets: {
        type: "array",
        description: "Information about the created sheets",
        items: {
          type: "object",
          properties: {
            sheetId: {
              type: "integer",
              description: "The ID of the sheet",
            },
            title: {
              type: "string",
              description: "The title of the sheet",
            },
            index: {
              type: "integer",
              description: "The index of the sheet",
            },
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the spreadsheet was not created successfully",
      },
    },
  },
  name: "createSpreadsheet",
  provider: "googleOauth",
};
export const finnhubSymbolLookupDefinition: ActionTemplate = {
  description: "Look up a stock symbol by name",
  scopes: [],
  parameters: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        description: "The symbol or colloquial name of the company to look up",
      },
    },
  },
  output: {
    type: "object",
    required: ["result"],
    properties: {
      result: {
        type: "array",
        description: "The results of the symbol lookup",
        items: {
          type: "object",
          description: "The metadata of the stock",
          properties: {
            symbol: {
              type: "string",
              description: "The symbol of the stock",
            },
            description: {
              type: "string",
              description: "The description of the stock",
            },
          },
        },
      },
    },
  },
  name: "symbolLookup",
  provider: "finnhub",
};
export const finnhubGetBasicFinancialsDefinition: ActionTemplate = {
  description: "Get company basic financials such as margin, P/E ratio, 52-week high/low etc.",
  scopes: [],
  parameters: {
    type: "object",
    required: ["symbol"],
    properties: {
      symbol: {
        type: "string",
        description: "The symbol/TICKER of the stock",
      },
    },
  },
  output: {
    type: "object",
    required: ["result"],
    properties: {
      result: {
        type: "object",
        description: "The basic financials of the stock",
        properties: {
          annual: {
            type: "array",
            description: "The annual financials of the stock",
            items: {
              type: "object",
              description: "The annual financials of the stock",
              properties: {
                metric: {
                  type: "string",
                  description: "The name of the financial metric",
                },
                series: {
                  type: "array",
                  description: "The series of values for the financial metric",
                  items: {
                    type: "object",
                    description: "The value of the financial metric",
                    properties: {
                      period: {
                        type: "string",
                        description: "The period of the financial metric in YYYY-MM-DD format",
                      },
                      v: {
                        type: "number",
                        description: "The value of the financial metric",
                      },
                    },
                  },
                },
              },
            },
          },
          quarterly: {
            type: "array",
            description: "The quarterly financials of the stock",
            items: {
              type: "object",
              description: "The quarterly financials of the stock",
              properties: {
                metric: {
                  type: "string",
                  description: "The name of the financial metric",
                },
                series: {
                  type: "array",
                  description: "The series of values for the financial metric",
                  items: {
                    type: "object",
                    description: "The value of the financial metric",
                    properties: {
                      period: {
                        type: "string",
                        description: "The period of the financial metric in YYYY-MM-DD format",
                      },
                      v: {
                        type: "number",
                        description: "The value of the financial metric",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  name: "getBasicFinancials",
  provider: "finnhub",
};
export const lookerEnableUserByEmailDefinition: ActionTemplate = {
  description: "Search for a Looker user by email and enable them if disabled",
  scopes: [],
  parameters: {
    type: "object",
    required: ["userEmail"],
    properties: {
      userEmail: {
        type: "string",
        description: "The email address of the user to search for",
      },
    },
  },
  output: {
    type: "object",
    required: ["success", "message"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the operation was successful",
      },
      message: {
        type: "string",
        description: "Status message about the operation",
      },
      userId: {
        type: "string",
        description: "The ID of the user that was found",
      },
      userDetails: {
        type: "object",
        required: ["id", "firstName", "lastName", "email", "isDisabled"],
        description: "Details about the user",
        properties: {
          id: {
            type: "string",
            description: "The ID of the user",
          },
          firstName: {
            type: "string",
            description: "The first name of the user",
          },
          lastName: {
            type: "string",
            description: "The last name of the user",
          },
          email: {
            type: "string",
            description: "The email of the user",
          },
          isDisabled: {
            type: "boolean",
            description: "Whether the user is disabled",
          },
        },
      },
    },
  },
  name: "enableUserByEmail",
  provider: "looker",
};
export const ashbyCreateNoteDefinition: ActionTemplate = {
  description: "Creates a note on a candidate",
  scopes: [],
  parameters: {
    type: "object",
    required: ["candidateId", "note"],
    properties: {
      candidateId: {
        type: "string",
        description: "The ID of the candidate to create a note for",
      },
      note: {
        type: "string",
        description: "The note content",
      },
    },
  },
  name: "createNote",
  provider: "ashby",
};
export const ashbyGetCandidateInfoDefinition: ActionTemplate = {
  description: "Gets a candidate's information",
  scopes: [],
  parameters: {
    type: "object",
    required: ["candidateId"],
    properties: {
      candidateId: {
        type: "string",
        description: "The ID of the candidate to create a note for",
      },
    },
  },
  output: {
    type: "object",
    required: ["candidate"],
    properties: {
      candidate: {
        type: "object",
        description: "The candidate's information",
        required: [],
      },
    },
  },
  name: "getCandidateInfo",
  provider: "ashby",
};
