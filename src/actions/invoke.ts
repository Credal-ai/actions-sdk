import { ActionMapper } from "./actionMapper.js";
import { ProviderName } from "./autogen/types.js";

interface InvokeActionInput<P, A> {
  provider: string;
  name: string;
  parameters: P;
  authParams: A;
}

export async function invokeAction<P, A>(input: InvokeActionInput<P, A>) {
  const { provider, name, parameters, authParams } = input;

  if (!isProviderName(provider)) {
    throw new Error(`Provider '${provider}' not found`);
  }
  const providerFunction = ActionMapper[provider][name].fn;

  const safeParseParams = ActionMapper[provider][name].paramsSchema.safeParse(parameters);
  if (!safeParseParams.success) {
    throw new Error(`Invalid parameters for action '${name}': ${safeParseParams.error}`);
  }

  return providerFunction({ params: parameters, authParams });
}

function isProviderName(value: string): value is ProviderName {
  return Object.values(ProviderName).includes(value as ProviderName);
}
