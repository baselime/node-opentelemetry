import { SSTConfig } from "sst";
import { Container } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "fargate-express-alb",
      region: "eu-west-2",
    };
  },
  stacks(app) {
    app.stack(Container);
  }
} satisfies SSTConfig;
