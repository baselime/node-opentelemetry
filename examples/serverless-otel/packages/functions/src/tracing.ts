import { BaselimeSDK, BetterHttpInstrumentation } from '../../../../../src/index'
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { withOpenTelemetry } from '../../../../../src/lambda';
import { flatten } from 'flat'

const blockedRequestOperations = [
  { service: 'S3', operation: 'PutObject'  },
  { service: 'Kinesis', operation: 'PutRecord' }
]

const blockedResponseOperations = [
  { service: 'S3', operation: 'GetObject'},
]


new BaselimeSDK({
    baselimeKey: process.env.BASELIME_KEY, collectorUrl: 'https://otel.baselime.cc/v1', serverless: false, instrumentations: [
      new AwsInstrumentation({
        suppressInternalInstrumentation: true,
        responseHook(span, { response }) {
          if(response && !blockedResponseOperations.some(({ service, operation }) => response.request.serviceName === service && response.request.commandName === operation)){
            span.setAttributes(flatten({
              response: response.data,
            }))
          }
        },
        preRequestHook(span, request) {

          if(!blockedRequestOperations.some(({ service, operation }) => request.request.serviceName === service && request.request.commandName === operation)){
            span.setAttributes(flatten({
              request: request.request,
            }))
          }
        }
      }),
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