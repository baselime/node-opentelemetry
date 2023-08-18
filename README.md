# Node OpenTelemetry


## QuickStart

Get started with Open Telemetry for containers on baselime

Install the dependencies

```bash
npm i --save-dev @baselime/node-opentelemetry @opentelemetry/auto-instrumentations-node
```

Create a tracing JS file to your src directory

```javascript
// tracing.cjs
import { BaselimeSDK } from '@baselime/node-opentelemetry';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';


const sdk = new BaselimeSDK({
  instrumentations: [    
    getNodeAutoInstrumentations(),
  ],
});

sdk.start();
```

Add this environment variable to your Dockerfile to load the tracing configuration and enable tracing of ESM imports

```bash
ENV NODE_OPTIONS="-r ./src/tracing.cjs --experimental-loader=import-in-the-middle/hook.mjs"
```

In your SST construct add the Baselime key environment variable

```javascript
import { StackContext, Service } from "sst/constructs";
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
export function API({ stack }: StackContext) {

  const service = new Service(stack, 'sst-service', {
    path: './',
    environment: {
      BASELIME_KEY: StringParameter.valueForStringParameter(stack, 'baselime-key')
    }
  });

  stack.addOutputs({
    URL: service.url
  })
}
```
