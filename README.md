# Lambda Node OpenTelemetry


## QuickStart

Install the dependencies

```bash
npm i --save-dev @baselime/node-opentelemetry @opentelemetry/auto-instrumentations-node
```

Add the tracing JS file

```javascript
// tracing.js
import { BaselimeSDK } from '@baselime/node-opentelemetry';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';


const sdk = new BaselimeSDK({
  instrumentations: [    
    getNodeAutoInstrumentations(),
  ],
});

sdk.start();
```

Ensure this file is included in your docker image and that the BASELIME_KEY environment variable is set

```bash
env BASELIME_KEY <secret key>
```

update the production start script in your package.json
```
{
    "scripts": {
        "start": "BASELIME_KEY=<secret key> OTEL_SERVICE_NAME=<service name> node -r ./tracing.js <main_file>.js"
    }
}