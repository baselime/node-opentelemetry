import { SSTConfig } from "sst";
import { Container } from "./stacks/MyStack";

export default {
  config(_input) {
    return {
      name: "fargate-express-sst",
      region: "eu-west-1",
    };
  },
  stacks(app) {
    app.stack(Container);
  }
} satisfies SSTConfig;
