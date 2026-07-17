import type {
  AuthParamsType,
  servicenowGetIncidentsFunction,
  servicenowGetIncidentsOutputType,
  servicenowGetIncidentsParamsType,
} from "../../autogen/types.js";
import { computeTimeToClosureMinutes, extractAdditionalFields, queryServiceNowTable } from "./utils/tableQuery.js";

const INCIDENT_FIELDS = [
  "number",
  "short_description",
  "description",
  "state",
  "incident_state",
  "priority",
  "impact",
  "urgency",
  "caller_id",
  "assigned_to",
  "assignment_group",
  "opened_at",
  "sys_updated_on",
  "closed_at",
  "work_notes",
  "comments",
];

const getIncidents: servicenowGetIncidentsFunction = async ({
  params,
  authParams,
}: {
  params: servicenowGetIncidentsParamsType;
  authParams: AuthParamsType;
}): Promise<servicenowGetIncidentsOutputType> => {
  const { query, additionalFields, limit, offset } = params;

  const result = await queryServiceNowTable({
    authParams,
    tableName: "incident",
    fields: INCIDENT_FIELDS,
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
      caller: record.caller_id,
      assignee: record.assigned_to,
      assignmentGroup: record.assignment_group,
      shortDescription: record.short_description,
      description: record.description,
      state: record.state,
      incidentState: record.incident_state,
      priority: record.priority,
      impact: record.impact,
      urgency: record.urgency,
      openedAt: record.opened_at,
      updatedAt: record.sys_updated_on,
      closedAt: record.closed_at,
      workNotes: record.work_notes,
      comments: record.comments,
      timeToClosureMinutes: computeTimeToClosureMinutes(record.opened_at, record.closed_at),
      extraFields: extractAdditionalFields(record, additionalFields),
    })),
  };
};

export default getIncidents;
