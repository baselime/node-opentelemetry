import { ClientRequest } from "http";
import shimmer from "shimmer";
import { safely } from './utils.js';
type HTTPMessage = {
    outputData?: {
        data: string
    }[],
    output?: string[]
} | undefined;

function isHttpBody(body?: any) {
    if (typeof body === "string") return true;
    if (body instanceof Buffer) return true;
    return false;
}

function patchWriteOrEndReq(original: ClientRequest['write' | 'end']) {

    console.log('running the patch')
    return function () {
        var returned = original.apply(this, arguments);
        if (isHttpBody(arguments[0])) {
            if(typeof arguments[0] === "string") {
                return arguments[0]
            }
            if(arguments[0] instanceof Buffer) {
                return arguments[0].toString()
            }
        }
        return returned;
    };
}

export function captureRequestBody(request: ClientRequest): Promise<string> {
    return new Promise((resolve) => {
        
        /** patch write function */
        shimmer.wrap(request, 'write', patchWriteOrEndReq);

        shimmer.wrap(request, 'end', patchWriteOrEndReq);

        request.on('socket', (socket) => safely(() => {
            console.log('on socket')
            if (socket.hasOwnProperty('_httpMessage')) {

                const httpMessage = (socket as any)._httpMessage as HTTPMessage;

                let lines: string[] = [];
                if (httpMessage.hasOwnProperty('outputData')) {
                    lines = httpMessage.outputData[0].data.split('\n');
                } else if (httpMessage.hasOwnProperty('output')) {
                    lines = httpMessage.output[0].split('\n');
                }
                if (lines.length > 0 && lines[lines.length - 1]) {
                    return resolve(lines[lines.length - 1]);
                }
            }
        }));
    });
}