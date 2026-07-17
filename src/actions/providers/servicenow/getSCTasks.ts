import type {
  AuthParamsType,
  servicenowGetSCTasksFunction,
  servicenowGetSCTasksOutputType,
  servicenowGetSCTasksParamsType,
} from "../../autogen/types.js";
import { computeTimeToClosureMinutes, extractAdditionalFields, queryServiceNowTable } from "./utils/tableQuery.js";

const SC_TASK_FIELDS = [
  "number",
  "request_item",
  "short_description",
  "description",
  "state",
  "priority",
  "assigned_to",
  "assignment_group",
  "opened_at",
  "sys_updated_on",
  "closed_at",
  "work_notes",
  "comments",
];

const getSCTasks: servicenowGetSCTasksFunction = async ({
  params,
  authParams,
}: {
  params: servicenowGetSCTasksParamsType;
  authParams: AuthParamsType;
}): Promise<servicenowGetSCTasksOutputType> => {
  const { query, additionalFields, limit, offset } = params;

  const result = await queryServiceNowTable({
    authParams,
    tableName: "sc_task",
    fields: SC_TASK_FIELDS,
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
      // request_item's display value is the parent Requested Item's number (e.g. RITM0010023)
      ritmNumber: record.request_item,
      assignee: record.assigned_to,
      assignmentGroup: record.assignment_group,
      shortDescription: record.short_description,
      description: record.description,
      state: record.state,
      priority: record.priority,
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

export default getSCTasks;
