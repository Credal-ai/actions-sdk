import {
  finnhubGetBasicFinancialsFunction,
  finnhubGetBasicFinancialsParamsType,
  finnhubGetBasicFinancialsOutputType,
  finnhubGetBasicFinancialsOutputSchema,
  AuthParamsType,
} from "../../autogen/types";
import { axiosClient } from "../../util/axiosClient";

interface FinancialMetricData {
  period: string;
  v: number | null;
}

interface TransformedFinancialData {
  metric: string;
  series: {
    period: string;
    v: number | undefined;
  }[];
}

function transformData(data: Record<string, FinancialMetricData[]>): TransformedFinancialData[] {
  return Object.entries(data).map(([key, value]) => ({
    metric: key,
    series: value.map(item => ({
      period: item.period,
      v: item.v ?? undefined,
    })),
  }));
}
const getBasicFinancials: finnhubGetBasicFinancialsFunction = async ({
  params,
  authParams,
}: {
  params: finnhubGetBasicFinancialsParamsType;
  authParams: AuthParamsType;
}): Promise<finnhubGetBasicFinancialsOutputType> => {
  try {
    const apiKey = authParams.apiKey;
    const result = await axiosClient.get(`https://finnhub.io/api/v1/stock/metric?symbol=${params.symbol}`, {
      headers: {
        "X-Finnhub-Token": apiKey,
      },
    });

    return finnhubGetBasicFinancialsOutputSchema.parse({
      result: {
        annual: transformData(result.data.series.annual),
        quarterly: transformData(result.data.series.quarterly),
      },
    });
  } catch (error) {
    console.error(error);
    return finnhubGetBasicFinancialsOutputSchema.parse({
      result: {},
    });
  }
};

export default getBasicFinancials;
