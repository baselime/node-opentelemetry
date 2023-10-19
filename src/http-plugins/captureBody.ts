import { ClientRequest } from "http";

export function captureBody(request: ClientRequest): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: string[] = [];
        const oldWrite = request.write.bind(request);
        const oldEnd = request.end.bind(request);
        request.on('data', chunk => {
            chunks.push(decodeURIComponent(chunk.toString()))
            return oldWrite(chunk);
        });
        request.on('end', (chunk) => {
            if (chunk) {
                chunks.push(decodeURIComponent(chunk.toString()));
            }
            oldEnd(chunk);
            return resolve(chunks.join(''))
        });
    });
}