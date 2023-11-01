export function captureBody(request: any): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const chunks: string[] = [];
            const oldWrite = request.write.bind(request);
           
            request.on('data', chunk => {
                console.log(chunk)
                chunks.push(decodeURIComponent(chunk.toString()))
                return oldWrite(chunk);
            });
            const oldEnd = request.end.bind(request);
            request.on('end', (chunk) => {
                if (chunk) {
                    console.log("chunk", chunk)
                    chunks.push(decodeURIComponent(chunk.toString()));
                }
                
                 resolve(chunks.join(''))

                 return oldEnd(chunk);
            });
            request.on('error', (err: any) => {
                reject(err);
            });
        } catch(e) { 
            console.log(e) 
        }
    });
}