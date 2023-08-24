# BaselimeSDK for Open Telemetry and Node.js

Ship your Open Telemetry traces to Baselime. It makes getting started with a custom trace configuration and Baselime simpler.

![A trace from an ECS task](./traces.png)


## Getting Started 

To find out how to configure the BaselimeSDK for container runtimes checkout the [baselime docs](https://baselime.io/docs/sending-data/opentelemetry/node.js/containers/)

## Example

```javascript
import { BaselimeSDK } from '@baselime/node-opentelemetry';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';


const sdk = new BaselimeSDK({
  instrumentations: [    
    getNodeAutoInstrumentations(),
  ],
});

sdk.start();
```