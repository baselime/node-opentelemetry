import { propagation, context, trace, Context, ROOT_CONTEXT, Attributes, Link, } from "@opentelemetry/api";
import { APIGatewayProxyEvent, APIGatewayProxyEventV2, DynamoDBStreamEvent, S3Event, Context as LambdaContext } from "aws-lambda";
import { flatten } from "flat";

function triggerToServiceType(service: string) {
    switch (service) {
        case "api":
        case "api-gateway":
        case "api-gateway-v2":
        case "function-url":
            return "http";
        case "sns":
        case "sqs":
        case "kinesis":
        case "eventbridge":
            return "pubsub";
        case "dynamodb":
        case "s3":
            return "datasource"
        default:
            return "other";
    }
}

const DynamodbEventToDocumentOperations = {
    INSERT: 'insert',
    MODIFY: 'update',
    REMOVE: 'delete',
    default: ''
};

function getDynamodbStreamDocumentAttributes(event: DynamoDBStreamEvent): FaasDocument {
    const unixTime = event?.Records[0]?.dynamodb?.ApproximateCreationDateTime || Date.now() / 1000;
    return {
        // TODO we could do better for collection (infer from single table design patterns?)
        collection: (event?.Records[0]?.eventSourceARN || '').split("/")[1],
        name: (event?.Records[0]?.eventSourceARN || '').split("/")[1],
        operation: DynamodbEventToDocumentOperations[event?.Records[0]?.eventName || "default"],
        time: new Date(unixTime).toUTCString(),
    }
}

function getS3DocumentAttributes(event: S3Event): FaasDocument {
    let operation = 'unkown';

    if (event.Records[0].eventName.startsWith('ObjectCreated')) {
        operation = 'insert';
    }

    if (event.Records[0].eventName.startsWith('ObjectRemoved')) {
        operation = 'delete';
    }
    return {
        collection: event.Records[0].s3.bucket.name,
        name: event.Records[0].s3.object.key,
        operation,
        time: event.Records[0].eventTime,
    }
}

function parseJSON(str: string) {
    try {
        return JSON.parse(str);
    } catch (error) {
        return str;
    }
}
function parseHttpEvent(event: APIGatewayProxyEventV2 | APIGatewayProxyEvent): HttpEvent {
    try {
        if (event.headers['content-type']?.toLowerCase() === 'application/json') {
            return {
                body: parseJSON(event.body || '{}'),
                headers: event.headers
            };
        }

        /**
         * TODO: add support for other content types
         */

        return {
            body: event.body,
            headers: event.headers
        };
    } catch (_) {
        return {
            body: event.body,
            headers: event.headers
        };
    }

}

type FaasDocument = {
    collection: string
    operation: string
    time: string
    name: string
}

type HttpEvent = { body: unknown, headers: { [key: string]: string | undefined } };



function detectService(event: any) {
    if (event.requestContext?.apiId) {
        return "api-gateway";
    }

    if (event.requestContext?.apiId && event.version === "2.0") {
        return "api-gateway-v2";
    }

    if (event.Records && event.Records[0]?.EventSource === "aws:sns") {
        return "sns";
    }

    if (event.Records && event.Records[0]?.eventSource === "aws:sqs") {
        return "sqs";
    }

    if (event.Records && event.Records[0]?.eventSource === "aws:kinesis") {
        return "kinesis";
    }

    if (event.Records && event.Records[0]?.eventSource === "aws:dynamodb") {
        return "dynamodb";
    }

    if (event.Records && event.Records[0]?.eventSource === "aws:s3") {
        return "s3";
    }

    if (event.Records && event.Records[0]?.eventSource === "aws:eventbridge") {
        return "eventbridge";
    }

    if (
        process.env.BASELIME_TRACE_STEP_FUNCTION === "true" ||
        event.Payload?._baselime?.traceparent || event._baselime?.traceparent ||
        (Array.isArray(event) && (event[0]?.Payload?.baselime?.traceparent || event[0]?._baselime?.traceparent))
    ) {
        return "step-function";
    }
    return 'unknown'
}


export function parseInput(event: any, lambda_context: LambdaContext, coldstart: boolean, proActiveInitialization: boolean, captureEvent: boolean = false) {

    const service = detectService(event);
    const trigger = triggerToServiceType(service);

    let document: FaasDocument | null = null;
    let httpEvent: HttpEvent | undefined = undefined;
    if (trigger === "http" && captureEvent) {
        httpEvent = parseHttpEvent(event);
    }
    if (trigger === 'datasource') {
        if (service === 'dynamodb') {
            document = getDynamodbStreamDocumentAttributes(event);
        }

        if (service === 's3') {
            document = getS3DocumentAttributes(event);
        }
    }

    const attributes = flatten({
        event: captureEvent && (httpEvent || event),
        context: {
            functionName: lambda_context.functionName,
            functionVersion: lambda_context.functionVersion,
            invokedFunctionArn: lambda_context.invokedFunctionArn,
            memoryLimitInMB: lambda_context.memoryLimitInMB,
            awsRequestId: lambda_context.awsRequestId,
            logGroupName: lambda_context.logGroupName,
            logStreamName: lambda_context.logStreamName,
            identity: lambda_context.identity,
            clientContext: lambda_context.clientContext
        },
        faas: {
            execution: lambda_context.awsRequestId,
            runtime: 'nodejs',
            trigger,
            document,
            invoked_by: service,
            id: lambda_context.invokedFunctionArn,
            coldstart,
            proActiveInitialization
        },
        cloud: {
            resource_id: lambda_context.invokedFunctionArn,
            account_id: lambda_context.invokedFunctionArn.split(":")[4],
        }
    }) satisfies Attributes

    return { attributes, service }
}