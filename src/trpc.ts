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
 * @param options.collectResult - Whether or not to collect the result of the request. Defaults to false.
 * @param options.instrumentedContextFields - The fields of the context to collect. Defaults to [].
 * @param options.headers - The headers to collect. Defaults to [].
 * 
 * @returns 
 */
export function tracing(options: TracingOptions) {
    const tracer = trace.getTracer('@baselime/trpc');

    return experimental_standaloneMiddleware().create(async (opts) => {
        return tracer.startActiveSpan('', async (span: Span) => {
          const result = await opts.next();
          
          if(options.collectInput) {
            span.setAttributes({ input: flatten(opts.input) })
          }

          if(options.collectResult) { 
            span.setAttributes({ result: flatten(result) })
          }

          const trpcContext = opts.ctx as Record<string, unknown>;
          if(options.instrumentedContextFields && options.instrumentedContextFields.length > 0) {
            const context = options.instrumentedContextFields.reduce((acc, field) => {
                acc[field] = trpcContext[field];
                return acc;
            }, {} as Record<string, unknown>)

            span.setAttributes({ context: flatten(context) })
          }

          if(options.headers && trpcContext.headers && options.headers.length > 0) {
            const headers = options.headers.reduce((acc, header) => {
                    acc[header] = (trpcContext.headers as Headers).get(header);
                return acc;
            }, {} as Record<string, unknown>)

            span.setAttributes({ headers: flatten(headers) })
          }

          const meta = { path: opts.path, type: opts.type, ok: result.ok };
          span.setAttributes(meta)
          span.end();
          return result;
        });
      });
}