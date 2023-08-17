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
