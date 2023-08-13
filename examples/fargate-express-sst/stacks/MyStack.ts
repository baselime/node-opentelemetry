import { StackContext } from "sst/constructs";
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { Duration } from "aws-cdk-lib/core";


export function Container({ stack }: StackContext) {
  // Create an ECS Fargate cluster
  const cluster = new ecs.Cluster(stack, 'MyCluster', {});

  // Build and push Docker image to ECR
  const asset = new DockerImageAsset(stack, "image", {
    directory: './',
  });

  // Create a task definition
  const loadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(stack, 'Service', {
    cluster,
    memoryLimitMiB: 512,
    desiredCount: 1,
    cpu: 256,
    taskImageOptions: {
      image: ecs.ContainerImage.fromDockerImageAsset(asset),
      environment: {
        BASELIME_KEY: StringParameter.valueForStringParameter(stack, 'baselime-key'),
        PORT: '80'
      }
    },
    publicLoadBalancer: true,
    targetProtocol: elbv2.ApplicationProtocol.HTTP,
    loadBalancerName: 'fargate-express-sst',
    maxHealthyPercent: 200,
    minHealthyPercent: 100,

  });

  loadBalancedFargateService.targetGroup.configureHealthCheck({
    healthyThresholdCount: 2,
    interval: Duration.seconds(5),
    timeout: Duration.seconds(2),
  });

}
