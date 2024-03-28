import { withOpenTelemetry } from "./tracing";
import { trace } from "@opentelemetry/api";

import { S3 } from "@aws-sdk/client-s3";
import axios from 'axios';
import qs from 'node:querystring';
import FormData from 'form-data';

const s3 = new S3({});

const tracer = trace.getTracer('example');
export const handler = withOpenTelemetry(async () => {

  const span = tracer.startSpan('example');

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
});
