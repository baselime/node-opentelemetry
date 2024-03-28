import api, { trace, context, propagation } from "@opentelemetry/api";
import { Handler, Callback, Context } from "aws-lambda";
import { flatten } from "flat"
import { flushTraces, trackColdstart } from "./utils.ts";
import { parseInput } from "./parse-event.ts";
import { extractContext, injectContextToResponse } from "./propation.ts";
const tracer = trace.getTracer('@baselime/baselime-lambda-wrapper', '1');

type LambdaWrapperOptions = {
    proactiveInitializationThreshold?: number | undefined
    captureEvent?: boolean | undefined
    captureResponse?: boolean | undefined
    timeoutThreshold?: number | undefined
    determineParent?: (event: unknown, service: string) => { traceparent: string, tracestate?: string } | { traceparent: string, tracestate?: string }[] | undefined
}

const isColdstart = trackColdstart();
/**
 * Wrap a lambda handler with OpenTelemetry tracing
 * @param handler 
 * @param opts 
 * @returns 
 */
export function withOpenTelemetry(handler: Handler, opts: LambdaWrapperOptions = {}) {
    return async function (event: any, lambda_context: Context, callback?: Callback) {

        const { coldstart, proactiveInitialization } = isColdstart(opts.proactiveInitializationThreshold);
    
        
        const { attributes, service } = parseInput(event, lambda_context, coldstart, proactiveInitialization);

        const { links, parent } = extractContext(service, event);

        return tracer.startActiveSpan(lambda_context.functionName, { links, attributes }, parent, async (span) => {
            
            try {
                let result = await handler(event, lambda_context, (err, res) => {
                    if (err) {
                        let error = typeof err === 'string' ? new Error(err) : err;
                        span.recordException(err);
                        span.setAttributes(flatten({ error: { name: error.name, message: error.message, stack: error.stack } }));
                    }

                    if (res) {
                        span.setAttributes(flatten({ result: res }));
                        injectContextToResponse(service, res, span);
                    }
                    if (callback) {
                        span.end();
                        callback(err, res);
                    }
                });
                if (result) {
                    span.setAttributes(flatten({ result }));
                    injectContextToResponse(service, result, span);
                }

                
                return result;
            } catch (e) {
                const err = e as Error;
                span.recordException(err);
                span.setAttributes(flatten({ error: { name: err.name, message: err.message, stack: err.stack } }));
                throw err;
            } finally {
                span.end();
                await flushTraces();
            }
        });
    };
}
