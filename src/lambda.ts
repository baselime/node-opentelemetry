import api, { trace, context, propagation, Context as OtelContext, ROOT_CONTEXT, Attributes, Link, } from "@opentelemetry/api";
import { Handler, DynamoDBStreamEvent, S3Event, APIGatewayProxyEventV2, APIGatewayProxyEvent, Callback, Context } from "aws-lambda";
import { flatten } from "flat"

type FaasDocument = {
  collection: string
  operation: string
  time: string
  name: string
}

type HttpEvent = { body: unknown, headers: { [key: string]: string | undefined } };
let coldstart = true;
const initTime = Date.now();
const tracer = trace.getTracer('@baselime/baselime-lambda-wrapper', '1');

type LambdaWrapperOptions = {
  proactiveInitializationThreshold?: number | undefined
  captureEvent?: boolean | undefined
  captureResponse?: boolean | undefined
  timeoutThreshold?: number | undefined
  determineParent?: (event: unknown, service: string) => { traceparent: string, tracestate?: string } | { traceparent: string, tracestate?: string }[] | undefined
}

const timeoutErrorMessage = `The Baselime OpenTelemetry SDK has detected that this lambda is very close to timing out.`
/**
 * Wrap a lambda handler with OpenTelemetry tracing
 * @param handler 
 * @param opts 
 * @returns 
 */
export function withOpenTelemetry(handler: Handler, opts: LambdaWrapperOptions = {}) {
  return async function (event: any, lambda_context: Context, callback?: Callback) {
    let proActiveInitialization
    if (Date.now() - initTime > (opts.proactiveInitializationThreshold || 2000)) {
      proActiveInitialization = true;
    }
    const service = detectService(event);
    const trigger = triggerToServiceType(service);

    const rawParent = opts.determineParent?.(event, service);

    const links = determineLinks(rawParent);
    const parent = determinParent(event, service, rawParent);

    let document: FaasDocument | null = null;
    let httpEvent: HttpEvent | undefined = undefined;
    if (trigger === "http") {
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


    const span = tracer.startSpan(lambda_context.functionName, {
      links,
      attributes: flatten({
        event: httpEvent || event,
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
      }) as Attributes,
    }, parent);
    coldstart = false;
    const ctx = trace.setSpan(context.active(), span);

    const timeRemaining = lambda_context.getRemainingTimeInMillis();
    setTimeout(async () => {
      const error = new Error(timeoutErrorMessage);
      error.name = "Possible Lambda Timeout";
      span.setAttributes(flatten({ error: { name: error.name, message: error.message } }) as Attributes);
      span.recordException(error);
      span.end();
      try {
        // @ts-expect-error
        await trace.getTracerProvider().getDelegate().forceFlush();
      } catch (_) {
      }

    }, timeRemaining - (opts.timeoutThreshold || 500));
    try {

      const result = await context.with(ctx, async (e, lc, cb) => {
        const unkownResult = handler(e, lc, (err, res) => {
          if (err) {
            let error = typeof err === 'string' ? new Error(err) : err;
            span.recordException(err);
            span.setAttributes(flatten({ error: { name: error.name, message: error.message, stack: error.stack } }) as Attributes);
          }

          if (res) {
            span.setAttributes(flatten({ result: res }));
          }
          if (cb) {
            span.end();
            cb(err, res);
          }
        });
        if (unkownResult) {
          return await unkownResult
        }
      }, null, event, lambda_context, callback);
      if (result) {
        span.setAttributes(flatten({ result }));
      }

      span.end();
      return result;
    } catch (e) {
      const err = e as Error;
      span.recordException(err);
      span.setAttributes(flatten({ error: { name: err.name, message: err.message, stack: err.stack } }) as Attributes);
      span.end();
      throw e
    } finally {
      try {
        // @ts-expect-error
        await trace.getTracerProvider().getDelegate().forceFlush();
      } catch (_) {

      }

    }
  }
}

function determineLinks(rawParent: { traceparent: string } | { traceparent: string, tracestate?: string }[] | undefined): Link[] {
  if (!Array.isArray(rawParent)) {
    return []
  }

  return rawParent.map((parent) => {
    return {
      context: {
        traceId: parent.traceparent.split('-')[1],
        spanId: parent.traceparent.split('-')[2],
        traceFlags: Number(parent.traceparent.split('-')[3]),
      }
    }
  });
}


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

  return 'unknown'
}

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

const headerGetter = {
  keys(carrier: Object): string[] {
    return Object.keys(carrier);
  },
  get(carrier: Record<string, string>, key: string): string | undefined {
    return carrier[key];
  },
};

const snsGetter = {
  keys(carrier: Object): string[] {
    return Object.keys(carrier);
  },
  get(carrier: Record<string, { Value: string }>, key: string): string | undefined {
    return carrier[key]?.Value;
  },
};

function determinParent(event: any, service: string, rawParent: ReturnType<LambdaWrapperOptions['determineParent']>): OtelContext {
  if (rawParent && !Array.isArray(rawParent)) {
    return propagation.extract(api.context.active(), rawParent);
  }

  const extractedContext = extractContext(event, service);

  if (trace.getSpan(extractedContext)?.spanContext()) {
    return extractedContext;
  }

  return ROOT_CONTEXT
}

function extractContext(event: any, service: string) {
  switch (service) {
    case "api":
    case "api-gateway":
    case "api-gateway-v2":
    case "function-url":
      const httpHeaders = event.headers || {};
      return propagation.extract(
        api.context.active(),
        httpHeaders,
        headerGetter,
      );
    case "sns":
      return propagation.extract(
        api.context.active(),
        event.Records[0].Sns.MessageAttributes,
        snsGetter,
      );
  }
  return propagation.extract(api.context.active(), {}, headerGetter);
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