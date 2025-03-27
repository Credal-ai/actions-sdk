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

  return providerFunction({ params: parameters, authParams });
}
