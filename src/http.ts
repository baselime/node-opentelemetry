import { Span } from "@opentelemetry/api";
import { ClientRequest, IncomingMessage, OutgoingHttpHeaders, ServerResponse } from "http";
import { HttpPlugin } from "./http-plugins/plugin.ts";
import { flatten } from "flat";
import { HttpInstrumentation } from "./http/index.ts";
import { HttpInstrumentationConfig } from "./http/types.ts"
import { parse } from 'querystring'
import { PassThrough } from "stream";

type BetterHttpInstrumentationOptions = {
    plugins?: HttpPlugin[],
    captureBody?: boolean,
    captureHeaders?: boolean,
    requestHook?: HttpInstrumentationConfig['requestHook']
    responseHook?: HttpInstrumentationConfig['responseHook']
    ignoreIncomingRequestHook?: HttpInstrumentationConfig['ignoreIncomingRequestHook']
    ignoreOutgoingRequestHook?: HttpInstrumentationConfig['ignoreOutgoingRequestHook']
    startIncomingSpanHook?: HttpInstrumentationConfig['startIncomingSpanHook']
    startOutgoingSpanHook?: HttpInstrumentationConfig['startOutgoingSpanHook']
}

export function _betterHttpInstrumentation(options: BetterHttpInstrumentationOptions = {}) {
    options.plugins = options.plugins || [];
    return {
        requestHook(span: Span, request: ClientRequest | IncomingMessage) {
            if (request instanceof ClientRequest) {
                const plugin = options.plugins.find(plugin => plugin?.shouldParseRequest(request)) as HttpPlugin | undefined;

                if (plugin) {
                    span.setAttribute('http.plugin.name', plugin.name);

                    const headers = request.getHeaders();


                    if (options.captureHeaders) {
                        span.setAttributes(flatten({ request: { headers } }));
                    }
                    if (plugin.captureBody) {
                        getClientRequestBody(request, (body) => {
                            const requestData = _parseBodySafe(body, headers);
                            span.setAttributes(flatten({ request: { body: requestData } }));
                        })
                    }
                } else {

                    const headers = request.getHeaders();


                    if (options.captureHeaders) {
                        span.setAttributes(flatten({ request: { headers } }));
                    }

                    if (options.captureBody && shouldCaptureBody(request.host)) {
                        getClientRequestBody(request, (body) => {
                            const requestData = _parseBodySafe(body, headers);
                            span.setAttributes(flatten({ request: { body: requestData } }));
                        })

                    }
                }

            }
            if (request instanceof IncomingMessage) {
                const plugin = options.plugins.find(plugin => plugin.shouldParseRequest && plugin.shouldParseRequest(request));

                span.setAttribute('http.plugin.name', plugin.name);

                if (plugin.parseIncommingMessage) {
                    const attributes = plugin.parseIncommingMessage(request);
                    span.setAttributes(flatten(attributes));
                }
            }

            if (options.requestHook) {
                options.requestHook(span, request);
            }
        },
        responseHook(span: Span, response: IncomingMessage | ServerResponse, cb: () => void) {
            if (response instanceof IncomingMessage) {
                try {
                    const headers = response.headers;
                    if (options.captureHeaders) {
                        span.setAttributes(flatten({ response: { headers } }));
                    }


                    if (options.captureBody && shouldCaptureBody(response.url || '')) {
                        getClientResponseBody(response, (body) => {
                            const responseData = _parseBodySafe(body, headers);
                            span.setAttributes(flatten({ response: { body: responseData } }));
                            cb();
                        })
                    } else {
                        cb();
                    }
                } catch (e) {
                    cb();
                }
            }

            if (options.responseHook) {
                options.responseHook(span, response, cb);
            }

        },
    }
}

const ignoredHosts = [
    'localhost',
    'otel.baselime',
];

function getClientRequestBody(r: ClientRequest, cb: (body: string) => void) {
    const chunks: Buffer[] = [];
    const oldWrite = r.write.bind(r);
    r.write = (data: Buffer | string) => {
        try {
            if (typeof data === 'string') {
                chunks.push(Buffer.from(data));

                if (data[data.length - 1] === '}') {
                    const body = Buffer.concat(chunks).toString('utf8');
                    cb(body);
                }
            } else {
                chunks.push(data);

                if (data[data.length - 1] === 125) {
                    const body = Buffer.concat(chunks).toString('utf8');
                    cb(body);
                }
            }
        } catch (e) {
        }
        return oldWrite(data);
    };
    const oldEnd = r.end.bind(r);
    r.end = (data: any) => {
        try {
            if (data) {
                if (typeof data === 'string') {
                    chunks.push(Buffer.from(data));
                } else {
                    chunks.push(data);
                }
            }
            if (chunks.length > 0) {
                const body = Buffer.concat(chunks).toString('utf8');
                cb(body);
            }
        } catch (e) {
        }
        return oldEnd(data);
    };
};

function getClientResponseBody(r: IncomingMessage, cb: (body: string) => void) {
    const chunks: Buffer[] = [];
    const pt = new PassThrough();

    pt.on('data', (chunk) => {
        try {
            if (typeof chunk === 'string') {
                chunks.push(Buffer.from(chunk));
            } else {
                chunks.push(chunk);
            }
        } catch (e) {
        }
    }).on('end', () => {
        try {
            if (chunks.length > 0) {
                const body = Buffer.concat(chunks).toString('utf8');
                cb(body)
            }
        } catch (e) {
        }
    });
    
    const originalState = r.readableFlowing;
    r.pipe(pt);
    // @ts-ignore
    r.readableFlowing = originalState;
}

function shouldCaptureBody(host: string) {
    return !ignoredHosts.find(ignoredHost => host.includes(ignoredHost));
}

function _parseBodySafe(body: string, headers: OutgoingHttpHeaders): unknown {
    let requestData: unknown = body;
    try {
        if (headers['content-type'] && typeof headers['content-type'] === 'string') {
            if (headers['content-type'].includes('application/json') || headers['content-type'].includes('application/x-amz-json')) {
                requestData = JSON.parse(body);
            } else if (headers['content-type'].includes('application/x-www-form-urlencoded')) {
                requestData = parse(body);
            }
        }
    } catch (_) {
    }

    return requestData;
}

export class BetterHttpInstrumentation extends HttpInstrumentation {
    constructor(options: BetterHttpInstrumentationOptions = {}) {
        super({
            ..._betterHttpInstrumentation(options),
            ignoreIncomingRequestHook: options.ignoreIncomingRequestHook,
            ignoreOutgoingRequestHook: options.ignoreOutgoingRequestHook,
            startIncomingSpanHook: options.startIncomingSpanHook,
            startOutgoingSpanHook: options.startOutgoingSpanHook,
        })
    }
}