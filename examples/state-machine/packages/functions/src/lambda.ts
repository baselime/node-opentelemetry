import { withOpenTelemetry } from "./tracing";
import { ApiHandler } from "sst/node/api";

export const handler = withOpenTelemetry(ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: `Hello world. The time is ${new Date().toISOString()}`,
  };
}));
