import type {
  AuthParamsType,
  servicenowGetChangeRequestsFunction,
  servicenowGetChangeRequestsOutputType,
  servicenowGetChangeRequestsParamsType,
} from "../../autogen/types.js";
import { computeTimeToResolutionMinutes, extractAdditionalFields, queryServiceNowTable } from "./utils/tableQuery.js";

const CHANGE_REQUEST_FIELDS = [
  "number",
  "short_description",
  "description",
  "state",
  "priority",
  "impact",
  "urgency",
  "requested_by",
  "assigned_to",
  "assignment_group",
  "opened_at",
  "sys_updated_on",
  "closed_at",
  "work_notes",
  "comments",
];

const getChangeRequests: servicenowGetChangeRequestsFunction = async ({
  params,
  authParams,
}: {
  params: servicenowGetChangeRequestsParamsType;
  authParams: AuthParamsType;
}): Promise<servicenowGetChangeRequestsOutputType> => {
  const { query, additionalFields, limit, offset } = params;

  const result = await queryServiceNowTable({
    authParams,
    tableName: "change_request",
    fields: CHANGE_REQUEST_FIELDS,
    filter: query,
    additionalFields,
    limit,
    offset,
  });

  if ("error" in result) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    records: result.records.map(record => ({
      number: record.number,
      requestor: record.requested_by,
      assignee: record.assigned_to,
      assignmentGroup: record.assignment_group,
      shortDescription: record.short_description,
      description: record.description,
      state: record.state,
      priority: record.priority,
      impact: record.impact,
      urgency: record.urgency,
      openedAt: record.opened_at,
      updatedAt: record.sys_updated_on,
      closedAt: record.closed_at,
      workNotes: record.work_notes,
      comments: record.comments,
      timeToResolutionMinutes: computeTimeToResolutionMinutes(record.opened_at, record.closed_at),
      extraFields: extractAdditionalFields(record, additionalFields),
    })),
  };
};

export default getChangeRequests;
