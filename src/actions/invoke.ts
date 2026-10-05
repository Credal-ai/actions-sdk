import { ActionMapper } from "./actionMapper.js";
import { ProviderName } from "./autogen/types.js";

interface InvokeActionInput<P, A> {
  provider: string;
  name: string;
  parameters: P;
  authParams: A;
  signal?: AbortSignal;
}

export async function invokeAction<P, A>(input: InvokeActionInput<P, A>) {
  const { provider, name, parameters, authParams, signal } = input;
  signal?.throwIfAborted();

  if (!isProviderName(provider)) {
    throw new Error(`Provider '${provider}' not found`);
  }
  const providerFunction = ActionMapper[provider][name].fn;

  const safeParseParams = ActionMapper[provider][name].paramsSchema.safeParse(parameters);
  if (!safeParseParams.success) {
    throw new Error(`Invalid parameters for action '${name}': ${safeParseParams.error}`);
  }

  const invocationArgs = { params: parameters, authParams: { ...authParams, provider }, signal };

  return providerFunction(invocationArgs);
}

function isProviderName(value: string): value is ProviderName {
  return Object.values(ProviderName).includes(value as ProviderName);
}
