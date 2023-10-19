import { ClientRequest, IncomingMessage } from "http";
import { HttpPlugin } from "./plugin.ts";

export class StripePlugin extends HttpPlugin implements HttpPlugin {
    captureBody = true
    name = 'stripe'

    shouldParseRequest(request: ClientRequest | IncomingMessage): boolean {
        if (request instanceof ClientRequest && request.host?.includes('api.stripe.com')) {
            return true;
        }
        return false;
    }

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

const plugin = new StripePlugin();