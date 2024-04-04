import { StackContext, Api, EventBus, Bucket } from "sst/constructs";

export function API({ stack }: StackContext) {
  const bus = new EventBus(stack, "bus", {
    defaults: {
      retries: 10,
    },
  });

  const catPictures = new Bucket(stack, "cat-pictures")

  const api = new Api(stack, "api", {
    defaults: {
      function: {
        runtime: "nodejs16.x",
        functionName: "api",
        nodejs: {
          format: 'cjs',
          install: ["@smithy/middleware-stack", "@aws-sdk/middleware-stack"]
        },
        timeout: 5,
        bind: [bus],
        environment: {
          BASELIME_KEY: process.env.BASELIME_KEY || '',
          CAT_PICTURES_BUCKET: catPictures.bucketName
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
