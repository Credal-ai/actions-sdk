import { ActionMapper } from "./actionMapper";
import type { ActionName, ActionProviderName } from "./parse";

interface InvokeActionInput<P, A> {
  provider: ActionProviderName;
  name: ActionName;
  parameters: P;
  authParams: A;
}

export async function invokeAction<P, A>(input: InvokeActionInput<P, A>) {
  const { provider, name, parameters, authParams } = input;

  if (!ActionMapper[provider]) {
    throw new Error(`Provider '${provider}' not found`);
  }
  const action = ActionMapper[provider][name];
  if (!action) {
    throw new Error(`Action '${name}' not found for provider '${provider}'`);
  }
  const providerFunction = action.fn;

  const safeParseParams = action.paramsSchema.safeParse(parameters);
  if (!safeParseParams.success) {
    throw new Error(`Invalid parameters for action '${name}': ${safeParseParams.error}`);
  }

  return providerFunction({ params: parameters, authParams });
}
