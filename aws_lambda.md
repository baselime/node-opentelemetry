# Tracing AWS Lambda Functions

Manually Instrument your AWS Lambda Functions using `withOpenTelemetry` wrapper.

If you want to instrument your lambda function with no code changes please read the docs [here](https://baselime.io/docs/sending-data/platforms/aws/aws-lambda/traces/node.js/).
  
## Getting Started 

Install the [`@baselime/node-opentelemetry`](https://www.npmjs.com/package/@baselime/node-opentelemetry) package.

```bash
npm i @baselime/node-opentelemetry
```

## Instrument the handler

Add the following code to your lambda handler to instrument your lambda handler with [OpenTelemetry](https://opentelemetry.io/).

```javascript
import { withOpenTelemetry } from "@baselime/node-opentelemetry/lambda";

export const handler = withOpenTelemetry(async () => {
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Hello from Lambda!',
    })
  };
});
```

## Add the Baselime OpenTelemetry SDK

There are 2 ways to add the Baselime SDK to your lambda function.

### Trac

ing tag

To automatically add the Baselime SDK and Baselime zero latency lambda extension add the `baselime:tracing` tag with the value `manual`

This will enable the Baselime SDK and add the `BASELIME_API_KEY` environment variable to your lambda 
### Import and Start the Baselime SDK

Create a file called tracing.js and import it at the top of your lambda function

```javascript
// tracing.js

import { BaselimeSDK, BetterHttpInstrumentation } from '@baselime/node-opentelemetry'
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';


new BaselimeSDK({
    instrumentation: [
        new AwsInstrumentation(),
        new BetterHttpInstrumentation({})
    ]
}).start();
```
import `tracing.js` at the top of your lambda entry file"

```javascript
import './tracing.js'

import { withOpenTelemetry } from "@baselime/node-opentelemetry/lambda";

export const handler = withOpenTelemetry(async () => {
  
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'Hello from Lambda!',
    })
  };
});
```

Finally add the `BASELIME_API_KEY` environment variable to send traces to your [baselime.io](https://baselime.io) account.

## Configuration Options

The `withOpenTelemetry` takes a second argument, an object with the following properties.

```javascript
export const handler = withOpenTelemetry(async (e: APIGatewayProxyEventV2) => {
  
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
```

| Field                        | Type                                                                                              | Description                                                                                             |
|------------------------------|---------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| proactiveInitializationThreshold | `number \| undefined`                                                                          | Represents the threshold for proactive initialization, if provided.                                      |
| captureEvent                 | `boolean \| undefined`                                                                         | Indicates whether to capture events or not, if specified.                                                 |
| captureResponse              | `boolean \| undefined`                                                                         | Indicates whether to capture responses or not, if specified.                                              |
| timeoutThreshold             | `number \| undefined`                                                                          | Represents the timeout threshold, if specified.                                                           |
| extractContext               | `(service: string, event: any) => { parent?: OtelContext, links?: Link[] } \| void \| undefined` | A function that extracts context based on provided service and event, 
