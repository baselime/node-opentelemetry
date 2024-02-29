import { withOpenTelemetry } from "./tracing";
import { S3 } from "@aws-sdk/client-s3";
const s3 = new S3({ });

export const handler = withOpenTelemetry(async (_evt) => {
  console.log('Hello world. The time is', new Date().toISOString());

  const result = await fetch('https://api.github.com/users/octocat');
  const json = await result.json();

  const buckets = await s3.listBuckets({});
  return {
    statusCode: 200,
    body: JSON.stringify(buckets.Buckets),
  };
});
