import type {
  AuthParamsType,
  servicenowGetVIPTicketsFunction,
  servicenowGetVIPTicketsOutputType,
  servicenowGetVIPTicketsParamsType,
} from "../../autogen/types.js";
import {
  computeTimeToResolutionMinutes,
  extractAdditionalFields,
  queryServiceNowTable,
  type ServiceNowRecord,
} from "./utils/tableQuery.js";

const SHARED_FIELDS = [
  "number",
  "assigned_to",
  "assignment_group",
  "short_description",
  "description",
  "state",
  "opened_at",
  "sys_updated_on",
  "closed_at",
  "work_notes",
  "comments",
];

// vip is a standard (non-custom) boolean field on sys_user used to flag VIP users.
const INCIDENT_VIP_FIELDS = [...SHARED_FIELDS, "caller_id"];
const INCIDENT_VIP_BASE_FILTER = "caller_id.vip=true";

const SC_TASK_VIP_FIELDS = [...SHARED_FIELDS, "request_item", "request_item.requested_for"];
const SC_TASK_VIP_BASE_FILTER = "request_item.requested_for.vip=true";

function mapRecord(record: ServiceNowRecord, ticketType: "incident" | "sc_task", additionalFields?: string[]) {
  return {
    ticketType,
    number: record.number,
    ritmNumber: ticketType === "sc_task" ? record.request_item : undefined,
    vipUser: ticketType === "incident" ? record.caller_id : record["request_item.requested_for"],
    assignee: record.assigned_to,
    assignmentGroup: record.assignment_group,
    shortDescription: record.short_description,
    description: record.description,
    state: record.state,
    openedAt: record.opened_at,
    updatedAt: record.sys_updated_on,
    closedAt: record.closed_at,
    workNotes: record.work_notes,
    comments: record.comments,
    timeToResolutionMinutes: computeTimeToResolutionMinutes(record.opened_at, record.closed_at),
    extraFields: extractAdditionalFields(record, additionalFields),
  };
}

const getVIPTickets: servicenowGetVIPTicketsFunction = async ({
  params,
  authParams,
}: {
  params: servicenowGetVIPTicketsParamsType;
  authParams: AuthParamsType;
}): Promise<servicenowGetVIPTicketsOutputType> => {
  const { ticketType, query, additionalFields, limit, offset } = params;

  const isIncident = ticketType === "incident";

  const result = await queryServiceNowTable({
    authParams,
    tableName: isIncident ? "incident" : "sc_task",
    fields: isIncident ? INCIDENT_VIP_FIELDS : SC_TASK_VIP_FIELDS,
    baseFilter: isIncident ? INCIDENT_VIP_BASE_FILTER : SC_TASK_VIP_BASE_FILTER,
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
    records: result.records.map(record => mapRecord(record, ticketType, additionalFields)),
  };
};

export default getVIPTickets;
