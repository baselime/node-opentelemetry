import { afterEach, beforeEach, describe, expect, it, test } from "vitest";
import { captureBody } from "../src/http-plugins/captureBody";
import { getLocal } from 'mockttp';
import { URL } from "url";
import { BaselimeSDK } from "../src";
import { trace } from "@opentelemetry/api";
import { waitForCollector } from "./utils/otel";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { Client } from "undici";
import { ClientRequest } from "http";


describe("Test BaselimeSDK for opentelemetry", () => {

    const mockServer = getLocal();
    beforeEach(() => mockServer.start())
    afterEach(() => mockServer.stop())

    it('Instrument Req Body', async () => {
        const collector = await mockServer.forAnyRequest().twice().thenReply(200, "Ok");
        const baselimeKey = "love is magic"
        const sdk = new BaselimeSDK({
            collectorUrl: mockServer.url,
            serverless: true,
            baselimeKey: baselimeKey,
            instrumentations: [
                new HttpInstrumentation({
                    ignoreOutgoingRequestHook: (req) => {
                        if (req.hostname === "en0n5p81mzli7b.x.pipedream.net") {
                            return false;
                        }
                        return true
                    },
                    requestHook: async (span, request) => {
                        if (request instanceof ClientRequest) {
                            console.log("has request body", request._hasBody)
                            const chunks: string[] = [];
                            // const oldWrite = request.write.bind(request);
                           
                            request.on('socket', (socket) => {
                                const httpMessage = socket._httpMessage;

                                let lines = [];
                                if (httpMessage.hasOwnProperty('outputData')) {
                                  lines = httpMessage.outputData[0].data.split('\n');
                                } else if (httpMessage.hasOwnProperty('output')) {
                                  lines = httpMessage.output[0].split('\n');
                                }
                                if (lines.length > 0) {
                                    console.log(lines)
                                  return lines[lines.length - 1];
                                }
                                console.log('socket')
                            })

                            request.on('data', chunk => {
                                console.log(chunk)
                                chunks.push(decodeURIComponent(chunk.toString()))
                                // return oldWrite(chunk);
                            });
//  const oldEnd = request.end.bind(request);
                            request.on('end', (chunk) => {
                                if (chunk) {
                                    console.log("chunk", chunk)
                                    chunks.push(decodeURIComponent(chunk.toString()));
                                    const body = chunks.join();
                                    console.log(body)
                                    span.setAttribute("request.body", body);
                                    // return oldEnd(chunk);
                                }

                            });
                        }
                    },
                })
            ]
        })

        const provider = sdk.start();

        await trace.getTracer("test").startActiveSpan("test", async (span) => {
            return new Promise((resolve) => {
                const postData = JSON.stringify({
                    'msg': 'Hello World!',
                });

                const url = new URL("https://en0n5p81mzli7b.x.pipedream.net/");

                const options = {
                    hostname: url.hostname,
                    port: url.port,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData),
                    },
                };
                /**
                 * This needs to be require for the instrumentation to work
                 */
                const { request } = require('https');
                const req = request(options, (res: any) => {
                    console.log('span end')
                    span.end();
                    console.log('done')
                    return resolve(true)
                });
                console.log('sent req')
                req.write(postData)
                req.end();
                console.log('written body')
            })
        });

        const [req1, req2] = await waitForCollector(collector)
        // console.log(JSON.stringify(await req1.body.getJson(), null, 4))
        // console.log(JSON.stringify(await req2.body.getJson(), null, 4))
    })
});
