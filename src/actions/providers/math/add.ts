import type { mathAddFunction, mathAddParamsType, mathAddOutputType } from "../../../actions/autogen/types";

const mathAdd: mathAddFunction = async ({ params }: { params: mathAddParamsType }): Promise<mathAddOutputType> => {
  if (params.a === undefined || params.b === undefined) {
    throw new Error("Both 'a' and 'b' parameters are required.");
  }

  return {
    result: params.a + params.b,
  };
};

export default mathAdd;
