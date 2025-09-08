import type { ActionTemplate } from "./actions/parse.js";
import * as templates from "./actions/autogen/templates.js";
import { invokeAction } from "./actions/invoke.js";
import type { AuthParamsType } from "./actions/autogen/types.js";

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

  const actionTemplate = await getActionByProviderAndName(provider, name);
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

export function getActions(): ActionTemplate[] {
  return Object.values(templates) as ActionTemplate[];
}

export function getActionByProviderAndName(provider: string, name: string): ActionTemplate {
  const allActions = getActions();
  const actionTemplate = allActions.find(
    x => (x as ActionTemplate).name == name && (x as ActionTemplate).provider == provider,
  ) as ActionTemplate;
  if (!actionTemplate) {
    throw Error(`Action with name ${name} does not exist`);
  }

  return actionTemplate;
}

export type ActionGroupsReturn = { name: string; description: string; actions: ActionTemplate[] }[];
