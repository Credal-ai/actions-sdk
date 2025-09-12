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

  const actionTemplate = getActionByProviderAndName(provider, name);
  if (!actionTemplate) {
    throw Error(`Action template with name ${name} does not exist`);
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
  return Object.values(templates);
}

export function getActionByProviderAndName(provider: string, name: string): ActionTemplate | undefined {
  const allActions = getActions();
  const actionTemplate = allActions.find(x => x.name == name && x.provider == provider);

  return actionTemplate;
}

export type ActionGroupsReturn = { name: string; description: string; actions: ActionTemplate[] }[];
