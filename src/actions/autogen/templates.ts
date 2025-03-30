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
export const salesforceUpdateRecordDefinition: ActionTemplate = {
  description: "Update a record in Salesforce",
  scopes: [],
  parameters: {
    type: "object",
    required: ["objectType", "recordId", "fieldsToUpdate"],
    properties: {
      objectType: {
        type: "string",
        description: "The Salesforce object type to update (e.g., Lead, Account, Contact)",
      },
      recordId: {
        type: "string",
        description: "The ID of the record to update",
      },
      fieldsToUpdate: {
        type: "object",
        description: "The fields to update on the record",
        additionalProperties: {
          type: "string",
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
        description: "Whether the record was successfully updated",
      },
      error: {
        type: "string",
        description: "The error that occurred if the record was not successfully updated",
      },
    },
  },
  name: "updateRecord",
  provider: "salesforce",
};
export const salesforceCreateCaseDefinition: ActionTemplate = {
  description: "Create a case or support ticket in Salesforce",
  scopes: [],
  parameters: {
    type: "object",
    required: ["subject", "description", "priority", "origin"],
    properties: {
      subject: {
        type: "string",
        description: "The subject of the case",
      },
      description: {
        type: "string",
        description: "The detailed description of the case",
      },
      priority: {
        type: "string",
        description: "The priority of the case (e.g., High, Medium, Low)",
      },
      origin: {
        type: "string",
        description: "The origin of the case (e.g., Phone, Email, Web)",
      },
      customFields: {
        type: "object",
        description: "Additional custom fields to set on the case",
        additionalProperties: {
          type: "string",
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
        description: "Whether the case was successfully created",
      },
      caseId: {
        type: "string",
        description: "The ID of the created case",
      },
      error: {
        type: "string",
        description: "The error that occurred if the case was not successfully created",
      },
    },
  },
  name: "createCase",
  provider: "salesforce",
};
export const salesforceGenerateSalesReportDefinition: ActionTemplate = {
  description: "Generate a sales report from Salesforce",
  scopes: [],
  parameters: {
    type: "object",
    required: ["startDate", "endDate"],
    properties: {
      startDate: {
        type: "string",
        description: "The start date for the sales report in ISO 8601 format (e.g., 2025-01-01).",
      },
      endDate: {
        type: "string",
        description: "The end date for the sales report in ISO 8601 format (e.g., 2025-01-31).",
      },
      filters: {
        type: "object",
        description: "Additional filters for the sales report (e.g., by region, product).",
        additionalProperties: {
          type: "string",
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
        description: "Whether the sales report was successfully generated.",
      },
      reportData: {
        type: "array",
        description: "The data of the sales report.",
        items: {
          type: "object",
          description: "A row in the sales report.",
          additionalProperties: {
            type: "string",
          },
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the sales report was not successfully generated.",
      },
    },
  },
  name: "generateSalesReport",
  provider: "salesforce",
};
export const salesforceGetRecordDefinition: ActionTemplate = {
  description: "Retrieve a record from Salesforce",
  scopes: [],
  parameters: {
    type: "object",
    required: ["objectType", "recordId"],
    properties: {
      objectType: {
        type: "string",
        description: "The Salesforce object type to retrieve (e.g., Lead, Account, Contact)",
      },
      recordId: {
        type: "string",
        description: "The ID of the record to retrieve",
      },
    },
  },
  output: {
    type: "object",
    required: ["success"],
    properties: {
      success: {
        type: "boolean",
        description: "Whether the record was successfully retrieved",
      },
      record: {
        type: "object",
        description: "The retrieved record data",
        additionalProperties: {
          type: "string",
        },
      },
      error: {
        type: "string",
        description: "The error that occurred if the record was not successfully retrieved",
      },
    },
  },
  name: "getRecord",
  provider: "salesforce",
};
