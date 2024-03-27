import { StackContext, Function } from "sst/constructs";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Chain, Parallel, StateMachine } from "aws-cdk-lib/aws-stepfunctions";
export function API({ stack }: StackContext) {

  stack.addDefaultFunctionEnv({
    BASELIME_TRACE_STEP_FUNCTION: "true"
  })
  const taskOne = new LambdaInvoke(stack, "TaskOne", {
    lambdaFunction: new Function(stack, "task-one", {
      handler: "packages/functions/src/task-one.handler",
    })
  })

  const taskTwoA = new LambdaInvoke(stack, "TaskTwoA", {
    lambdaFunction: new Function(stack, "task-two-a", {
      handler: "packages/functions/src/task-two.handler",
    }),
  })

  const taskTwoB = new LambdaInvoke(stack, "TaskTwoB", {
    lambdaFunction: new Function(stack, "task-two-b", {
      handler: "packages/functions/src/task-two.handler",
    }),
  })

  const taskThree = new LambdaInvoke(stack, "TaskThree", {
    lambdaFunction: new Function(stack, "task-three", {
      handler: "packages/functions/src/task-three.handler",
    }),
  })

  const parallel = new Parallel(stack, "ParallelCompute");
  const stateDefinition = Chain.start(taskOne).next(parallel.branch(taskTwoA).branch(taskTwoB)).next(taskThree)

  
  const stateMachine = new StateMachine(stack, "MyStateMachine", {
    definition: stateDefinition,
  });


  stack.addOutputs({
    stateMachine: stateMachine.stateMachineName
  })
}
