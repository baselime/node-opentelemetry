const { BaselimeSDK } = require('@baselime/node-opentelemetry');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');


const sdk = new BaselimeSDK({
  instrumentations: [    
    getNodeAutoInstrumentations(),
  ],
});

sdk.start();