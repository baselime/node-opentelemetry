import { StackContext, Api, EventBus } from "sst/constructs";

export function API({ stack }: StackContext) {
  const bus = new EventBus(stack, "bus", {
    defaults: {
      retries: 10,
    },
  });

  const api = new Api(stack, "api", {
    defaults: {
      function: {
        runtime: "nodejs16.x",
        functionName: "api",
        nodejs: {
          format: 'cjs',
          install: ["@smithy/middleware-stack", "@aws-sdk/middleware-stack"]
        },
        bind: [bus],
        environment: {
          BASELIME_KEY: process.env.BASELIME_KEY || '',
        }
      },
    },
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
    },
  });

  api.attachPermissions(["s3"]);
  
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
