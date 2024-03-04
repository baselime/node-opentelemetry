import { BaselimeSDK, BetterHttpInstrumentation } from '../../../../../src/index'
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { withOpenTelemetry } from '../../../../../src/lambda';

new BaselimeSDK({
    baselimeKey: process.env.BASELIME_KEY, collectorUrl: 'https://otel.baselime.cc/v1', serverless: false, instrumentations: [
      new AwsInstrumentation({
        suppressInternalInstrumentation: true,
      }),
      new BetterHttpInstrumentation({ 
        captureBody: true,
        captureHeaders: true,
      })
    ]
  }).start();

export {
    withOpenTelemetry
}