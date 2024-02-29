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
        runtime: "nodejs18.x",
        functionName: "api",
        nodejs: {
          install: ["@smithy/middleware-stack", "@aws-sdk/middleware-stack", "import-in-the-middle"]
        },
        bind: [bus],
        environment: {
          BASELIME_KEY: process.env.BASELIME_KEY || '',
          OTEL_LOG_LEVEL: 'debug',
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
