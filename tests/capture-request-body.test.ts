import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { captureRequestBody } from "../src/utils/captureRequestBody";
import { getLocal } from 'mockttp';
import { URL } from "url";
import { BaselimeSDK } from "../src";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ClientRequest } from "http";


function setupBaselimeSDK(cb) {
    const baselimeKey = "love is magic"
    const sdk = new BaselimeSDK({
        serverless: true,
        baselimeKey: baselimeKey,
        instrumentations: [
            new HttpInstrumentation({
                requestHook: async (span, request) => {
                    if (request instanceof ClientRequest) {
                       cb(request)
                       
                    }
                },
                responseHook: async (span, response) => {
                    // console.log('responseHook', response)
                }
            })
        ]
    })

    sdk.start();
}

describe("Test BaselimeSDK for opentelemetry", () => {

    const mockServer = getLocal();
    beforeAll(() => mockServer.start())
    afterAll(() => mockServer.stop())

    it('Instrument Req Body', () => new Promise(async (done) => {
        await mockServer.forAnyRequest().thenReply(200, "Ok");
        setupBaselimeSDK(async (request) => {
            const body = await captureRequestBody(request);
            console.log(body)
            expect(body).toBe('{"msg":"Hello World!"}');
        })


        // const postData = JSON.stringify({
        //     'msg': 'Hello World!',
        // });

        // const url = new URL(mockServer.url);

        // const options = {
        //     hostname: url.hostname,
        //     port: url.port,
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Content-Length': Buffer.byteLength(postData),
        //     },
        // };
        // /**
        //  * This needs to be require for the instrumentation to work
        //  */
        // const { request } = require('http');
        // const req = request(mockServer.url, options, () =>  done(true));
        // req.write(postData)
        // req.end();
        await require('axios').post(mockServer.url, {
            'msg': 'Hello World!',
        });
        done(true);
    }));
});
