import { Span } from "@opentelemetry/api";
import { ClientRequest, IncomingMessage } from "http";
import { HttpPlugin } from "./http-plugins/plugin.ts";
import { flatten } from "flat";
import { HttpInstrumentation, HttpInstrumentationConfig } from "@opentelemetry/instrumentation-http";
import { captureRequestBody } from "./utils/captureRequestBody.ts";


type BetterHttpInstrumentationOptions = {
    plugins?: HttpPlugin[],
    requestHook?: HttpInstrumentationConfig['requestHook']
    responseHook?: HttpInstrumentationConfig['responseHook']
    ignoreIncomingRequestHook?: HttpInstrumentationConfig['ignoreIncomingRequestHook']
    ignoreOutgoingRequestHook?: HttpInstrumentationConfig['ignoreOutgoingRequestHook']
    startIncomingSpanHook?: HttpInstrumentationConfig['startIncomingSpanHook']
    startOutgoingSpanHook?: HttpInstrumentationConfig['startOutgoingSpanHook']
}

export function _betterHttpInstrumentation (options: BetterHttpInstrumentationOptions = {}) {
    options.plugins = options.plugins || [];
    return {
        requestHook (span: Span, request: ClientRequest | IncomingMessage) {
            if (request instanceof ClientRequest) {
                const plugin = options.plugins.find(plugin => plugin.shouldParseRequest && plugin.shouldParseRequest(request));
                
                span.setAttribute('http.plugin.name', plugin.name);
                
                if (plugin.captureBody) {
                    captureRequestBody(request).then(body => {
                        span.setAttributes(flatten({ body }));
                    })
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

            if(options.requestHook) {
                options.requestHook(span, request);
            }
        },
        
    }
}

export class BetterHttpInstrumentation extends HttpInstrumentation {
    constructor(options: BetterHttpInstrumentationOptions = {}) {
        super({
            ..._betterHttpInstrumentation(options),
            responseHook: options.responseHook,
            ignoreIncomingRequestHook: options.ignoreIncomingRequestHook,
            ignoreOutgoingRequestHook: options.ignoreOutgoingRequestHook,
            startIncomingSpanHook: options.startIncomingSpanHook,
            startOutgoingSpanHook: options.startOutgoingSpanHook,
        })
    }
}