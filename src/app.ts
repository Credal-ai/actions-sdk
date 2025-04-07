import type { ActionTemplate } from "./actions/parse";
import { ACTION_GROUPS } from "./actions/groups";
import * as templates from "./actions/autogen/templates";
import { invokeAction } from "./actions/invoke";
import type { AuthParamsType } from "./actions/autogen/types";

export async function runAction(
  name: string,
  provider: string,
  authentication: AuthParamsType,
  // eslint-disable-next-line
  parameters: Record<string, any>,
) {
  if (!parameters || !name || !provider) {
    throw Error("Missing params");
  }

  const allActions = await getActions();
  const actionTemplate = allActions.find(
    x => (x as ActionTemplate).name == name && (x as ActionTemplate).provider == provider,
  ) as ActionTemplate;
  if (!actionTemplate) {
    throw Error(`Action with name ${name} does not exist`);
  }

  const result = await invokeAction({
    provider: actionTemplate.provider,
    name: actionTemplate.name,
    parameters: parameters,
    authParams: authentication,
  });

  return result;
}

/**
 * HELPER FUNCTIONS
 */

async function getActions(): Promise<ActionTemplate[]> {
  return Object.values(templates) as ActionTemplate[];
}

export type ActionGroupsReturn = { name: string; description: string; actions: ActionTemplate[] }[];

export async function getActionGroups(): Promise<ActionGroupsReturn> {
  const allDefinitions = await getActions();
  const result = [];
  for (const [key, value] of Object.entries(ACTION_GROUPS)) {
    const actionGroupDetails: ActionTemplate[] = [];

    for (const action of value.actions) {
      const definition = allDefinitions.find(def => def.name === action.name);
      if (definition) {
        actionGroupDetails.push(definition);
      }
    }

    if (actionGroupDetails.length > 0) {
      result.push({ name: key, description: value.description, actions: actionGroupDetails });
    }
  }

  return result;
}
