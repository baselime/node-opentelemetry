import { BaselimeSDK, BetterHttpInstrumentation } from '../../../../../src/index'
import { withOpenTelemetry } from '../../../../../src/lambda';

new BaselimeSDK({
    baselimeKey: '', collectorUrl: 'https://otel.baselime.cc/v1', serverless: false, instrumentations: [
      new BetterHttpInstrumentation({ 
        captureBody: true,
        captureHeaders: true,
      })
    ],
    resourceDetectors: [],
  }).start();

export {
    withOpenTelemetry
}