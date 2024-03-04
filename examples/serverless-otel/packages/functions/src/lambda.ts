import { withOpenTelemetry } from "./tracing";
import { S3 } from "@aws-sdk/client-s3";
import axios from 'axios';
import qs from 'node:querystring';
import FormData from 'form-data';
const s3 = new S3({});

export const handler = withOpenTelemetry(async () => {

  // await axios.get('https://jsonplaceholder.typicode.com/todos/1');
  await axios.post('https://jsonplaceholder.typicode.com/posts', {
    title: 'foo',
    body: 'bar',
    userId: 5
  });

  await axios.post('https://jsonplaceholder.typicode.com/posts', {
    title: 'foo',
    body: 'bar',
    userId: 5
  });

  await new Promise((resolve) => setTimeout(resolve, 30000));

  return {
    statusCode: 200,
    body: 'hi there from lambda!',
  };
});
