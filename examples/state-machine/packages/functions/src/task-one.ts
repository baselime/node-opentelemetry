import { withOpenTelemetry } from "./tracing";

export const handler = withOpenTelemetry(async (_,__, callback) => {
  callback(null, {
    statusCode: 200,
    body: `Hello world. The time is ${new Date().toISOString()}`,
  });
});
