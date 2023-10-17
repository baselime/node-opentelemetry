import { trace, Span } from '@opentelemetry/api';
import { experimental_standaloneMiddleware } from '@trpc/server';
import { flatten } from 'flat';

type TracingOptions = {
    collectInput?: boolean,
    collectResult?: boolean,
    instrumentedContextFields?: string[],
    headers?: string[]
}

/**
 * 
 * @param options 
 * @param options.collectInput - Whether or not to collect the input of the request. Defaults to false.
 * 
 * @returns 
 */
export function tracing(options?: TracingOptions) {
    const tracer = trace.getTracer('@baselime/trpc');
    options = options || {};
    return experimental_standaloneMiddleware().create(async (opts) => {
        return tracer.startActiveSpan(`TRPC ${opts.type}`, async (span: Span) => {
            const result = await opts.next();

            if (options.collectInput && typeof opts.rawInput === "object") {
                span.setAttributes(flatten({ input: opts.rawInput }))
            }
            const meta = { path: opts.path, type: opts.type, ok: result.ok };
            span.setAttributes(meta)
            span.end();
            return result;
        });
    });
}