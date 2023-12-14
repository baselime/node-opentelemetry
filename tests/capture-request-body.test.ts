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

    it.skip('Instrument Req Body', () => new Promise(async (done) => {
        await mockServer.forAnyRequest().thenReply(200, "Ok");
        setupBaselimeSDK(async (request) => {
            const body = await captureRequestBody(request);
            console.log(body)
            expect(body).toBe('{"msg":"Hello World!"}');
        })
        
        await require('axios').post(mockServer.url, {
            'msg': 'Hello World!',
        });
        done(true);
    }));
});
