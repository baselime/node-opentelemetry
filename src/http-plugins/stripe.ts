import { ClientRequest, IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { Plugin } from "./plugin.ts";

export const StripePlugin: Plugin = {
    captureBody: true,
    name: 'stripe',
    shouldParseRequest(request: ClientRequest | IncomingMessage): boolean {
       
        if (request instanceof ClientRequest && request.host?.includes('api.stripe.com')) {
            return true;
        }
        return false;
    },
    shouldParseResponse(response: IncomingMessage | ServerResponse<IncomingMessage>) {
        return false;
    },
    parseClientRequest(request: ClientRequest) {
        const method = request.method;
        
        const [version, entity, entityIdOrOperation, operation] = request.path.split('/');

        return {
            stripe: {
                version,
                method,
                entity,
                entityIdOrOperation,
                operation,
            }
        }
    }
}