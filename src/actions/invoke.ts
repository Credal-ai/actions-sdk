import { ActionMapper } from "./actionMapper";

interface InvokeActionInput<P, A> {
  provider: string;
  name: string;
  parameters: P;
  authParams: A;
}

export async function invokeAction<P, A>(input: InvokeActionInput<P, A>) {
  const { provider, name, parameters, authParams } = input;

  if (!ActionMapper[provider]) {
    throw new Error(`Provider '${provider}' not found`);
  }
  const providerFunction = ActionMapper[provider][name].fn;

  const safeParseParams = ActionMapper[provider][name].paramsSchema.safeParse(parameters);
  if (!safeParseParams.success) {
    throw new Error(`Invalid parameters for action '${name}': ${safeParseParams.error}`);
  }

  return providerFunction({ params: parameters, authParams });
}
