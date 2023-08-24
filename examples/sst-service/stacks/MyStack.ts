import { StackContext, Service } from "sst/constructs";
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export function API({ stack }: StackContext) {
  const key = StringParameter.valueForStringParameter(stack, 'baselime-key');
  
  const service = new Service(stack, 'sst-service', {
    path: './',
    environment: {
      BASELIME_KEY: key,
      NODE_OPTIONS: "-r ./src/tracing.cjs --experimental-loader=import-in-the-middle/hook.mjs"
    },
    cdk: {
      container: {
        logging: new ecs.FireLensLogDriver({
          options: {
            "Name": "http",
            "Host": "ecs-logs-ingest.baselime.io",
            "Port": "443",
            "TLS": "on",
            "format": "json",
            "retry_limit": "2",
            "header": `x-api-key ${key}`,
          },
        }),
      }
    }
  });

  stack.addOutputs({
    URL: service.url
  })
}
