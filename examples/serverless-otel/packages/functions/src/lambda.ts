import { withOpenTelemetry } from "./tracing";
import { trace } from "@opentelemetry/api";

import { S3 } from "@aws-sdk/client-s3";
import axios from 'axios';
import qs from 'node:querystring';
import FormData from 'form-data';
import { APIGatewayProxyEventV2 } from "aws-lambda";

const s3 = new S3({});

const tracer = trace.getTracer('example');
export const handler = withOpenTelemetry(async (e: APIGatewayProxyEventV2) => {
  const span = tracer.startSpan('example');

  await s3.listBuckets({});
  await s3.putObject({ Bucket: process.env.CAT_PICTURES_BUCKET, Key: 'cat.png', Body: 'example' });
  await s3.getObject({ Bucket: process.env.CAT_PICTURES_BUCKET, Key: 'cat.png' });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if(Math.random() > 0.5) {
    throw new Error('Random error');
  }
  span.end()
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Hello from Lambda!',
    })
  };
}, {
  captureEvent: false,
  captureResponse: false,
  proactiveInitializationThreshold: 1000,
  timeoutThreshold: 500,
  extractContext(service, event) {
    console.log('Extracting context', service, event);
  }
});
