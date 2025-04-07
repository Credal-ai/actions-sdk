import type { mathAddFunction, mathAddParamsType, mathAddOutputType } from "../../../actions/autogen/types";

const mathAdd: mathAddFunction = async ({ params }: { params: mathAddParamsType }): Promise<mathAddOutputType> => {
  return {
    result: params.a + params.b,
  };
};

export default mathAdd;
