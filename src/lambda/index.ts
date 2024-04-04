import { trace, Context as OtelContext, Link} from "@opentelemetry/api";
import { Handler, Callback, Context } from "aws-lambda";
import { flatten } from "flat"
import { flushTraces, captureError, setupTimeoutDetection, trackColdstart } from "./utils.ts";
import { parseInput } from "./parse-event.ts";
import { extractContext, injectContextToResponse } from "./propation.ts";
const tracer = trace.getTracer('@baselime/baselime-lambda-wrapper', '1');

type LambdaWrapperOptions = {
    proactiveInitializationThreshold?: number | undefined
    captureEvent?: boolean | undefined
    captureResponse?: boolean | undefined
    timeoutThreshold?: number | undefined
    extractContext?: (service: string, event: any) => { parent?: OtelContext, links?: Link[] } | void | undefined
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


        const { attributes, service } = parseInput(event, lambda_context, coldstart, proactiveInitialization, opts.captureEvent);

        const { links, parent } = extractContext(service, event, opts.extractContext);

        return tracer.startActiveSpan(lambda_context.functionName, { links, attributes }, parent, async (span) => {
            setupTimeoutDetection(span, lambda_context, opts.timeoutThreshold);
            try {
                let result = await handler(event, lambda_context, async (err, res) => {
                    if (err) { captureError(span, err) }

                    if (res) {
                        if (opts.captureResponse) {
                            span.setAttributes(flatten({ result: res }));
                        }
                        injectContextToResponse(service, res, span);
                    }
                    if (callback) {
                        span.end();
                        await flushTraces();
                        return callback(err, res);
                    }
                });
                if (result) {
                    if (opts.captureResponse) {
                        span.setAttributes(flatten({ result }));
                    }
                    injectContextToResponse(service, result, span);
                }


                return result;
            } catch (e) {
                captureError(span, e);
                throw e;
            } finally {
                span.end();
                await flushTraces();
            }
        });
    };
}
