import type {
  genericFillTemplateFunction,
  genericFillTemplateOutputType,
  genericFillTemplateParamsType,
} from "../../autogen/types.js";

const fillTemplate: genericFillTemplateFunction = async ({
  params,
}: {
  params: genericFillTemplateParamsType;
}): Promise<genericFillTemplateOutputType> => {
  return {
    result: params.template,
  };
};
export default fillTemplate;
