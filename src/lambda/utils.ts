import { Span, trace } from "@opentelemetry/api";
import { Context } from "aws-lambda";
import { flatten } from "flat";

const timeoutErrorMessage = `The Baselime OpenTelemetry SDK has detected that this lambda is very close to timing out.`

export function setupTimeoutDetection(span: Span, lambda_context: Context, timeoutThreshold: number = 500) {
    const timeRemaining = lambda_context.getRemainingTimeInMillis();
    setTimeout(async () => {
      const error = new Error(timeoutErrorMessage);
      error.name = "Possible Lambda Timeout";
      span.setAttributes(flatten({ error: { name: error.name, message: error.message } }));
      span.recordException(error);
      span.end();
      await flushTraces();

    }, timeRemaining - (timeoutThreshold));
}

export function trackColdstart() {
    let coldstart = true;
    const startTime = Date.now();
    return (proactiveInitializationThreshold: number = 1000) => {
        if (coldstart) {
            coldstart = false;
            const coldstartDuration = Date.now() - startTime;
            return {
                coldstart,
                coldstartDuration,
                proactiveInitialization: coldstartDuration > proactiveInitializationThreshold
            };
        }
        return { coldstart };
    }
}

export async function flushTraces() {
    try {
        // @ts-expect-error
        await trace.getTracerProvider().getDelegate().forceFlush();
      } catch (_) {
      }
}