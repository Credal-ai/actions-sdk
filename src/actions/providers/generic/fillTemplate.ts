import type {
  genericFillTemplateActionFunction,
  genericFillTemplateActionOutputType,
  genericFillTemplateActionParamsType,
} from "../../autogen/types";

const fillTemplate: genericFillTemplateActionFunction = async ({
  params,
}: {
  params: genericFillTemplateActionParamsType;
}): Promise<genericFillTemplateActionOutputType> => {
  return {
    result: params.template,
  };
};
export default fillTemplate;
