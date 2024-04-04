import { context, propagation, ROOT_CONTEXT, Link, Context, Span, trace } from "@opentelemetry/api";

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


export function extractContext(service: string, event: any, cb: (service: string, event: any) => { parent?: Context, links?: Link[]} | void | undefined): { parent?: Context, links?: Link[] } {
    if (cb) {
        const res =  cb(service, event);
        if (res) {
            return res;
        }
    }
    switch (service) {
        case "api":
        case "api-gateway":
        case "api-gateway-v2":
        case "function-url":
            const httpHeaders = event.headers || {};
            return {
                parent: propagation.extract(context.active(), httpHeaders, headerGetter),
            };
        case "sns":
            return {
                parent: propagation.extract(context.active(), event.Records[0].Sns.MessageAttributes, snsGetter)
            }
        case 'step-function':
            if (Array.isArray(event)) {
                return {
                    links: event.map((parent) => {
                        const traceparent = parent._baselime?.traceparent || parent.Payload?._baselime?.traceparent || parent._baselime?._baselime?.traceparent;
                        if (!traceparent) {
                            return
                        }
                        return {
                            context: {
                                traceId: traceparent.split('-')[1],
                                spanId: traceparent.split('-')[2],
                                traceFlags: Number(traceparent.split('-')[3]),
                            }
                        }
                    }).filter(el => el)
                }
            }
            const traceparent = event._baselime?.traceparent || event.Payload?._baselime?.traceparent || event._baselime?._baselime?.traceparent;

            return {
                parent: propagation.extract(context.active(), { traceparent }, headerGetter)
            }
        default:
            return {
                parent: ROOT_CONTEXT,
            };
    }
}

export function injectContextToResponse(service: string, result: any, span: Span) {
    const ctx = trace.setSpan(context.active(), span);
    switch (service) {
        case 'step-function':
            propagation.inject(ctx, result, {
                set(carrier, key, value) {
                    carrier['_baselime'] = {
                        [key]: value
                    }
                }
            });
    }
}
