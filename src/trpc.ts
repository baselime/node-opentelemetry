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

            // opts.rawInput is for v10, `opts.getRawInput` is for v11
            // @ts-expect-error
            const rawInput = "rawInput" in opts ? opts.rawInput : await opts.getRawInput();
            if (options.collectInput && typeof rawInput === "object") {
                span.setAttributes(flatten({ input: rawInput }))
            }
            const meta = { path: opts.path, type: opts.type, ok: result.ok };
            span.setAttributes(meta)
            span.end();
            return result;
        });
    });
}