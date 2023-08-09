import { NodeSDK } from '@opentelemetry/sdk-node'
import { detectResourcesSync } from '@opentelemetry/resources';
import { awsEc2Detector, awsEcsDetector } from '@opentelemetry/resource-detector-aws'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { InstrumentationOption } from '@opentelemetry/instrumentation';

type BaselimeSDKOpts = {
    instrumentations: InstrumentationOption[],
    collectorUrl?: string,
    baselimeKey?: string
}

const resource =  detectResourcesSync({
    detectors: [awsEcsDetector, awsEc2Detector],
});

enum CompressionAlgorithm {
	GZIP = "gzip",
}

export class BaselimeSDK extends NodeSDK {
    constructor(opts: BaselimeSDKOpts) {

        const collectorURL = opts.collectorUrl || process.env.COLLECTOR_URL || "https://otel.baselime.io/v1";

        const key = opts.baselimeKey || process.env.BASELIME_KEY;

        if(!key) {
            throw Error(`Please ensure that the BASELIME_KEY environment variable is set.`)
        }

        super({
            resource,
            traceExporter: new OTLPTraceExporter({
                url: collectorURL,
                compression: CompressionAlgorithm.GZIP,
                headers: {
                    "x-api-key": process.env.BASELIME_KEY,
                },
            }),
            instrumentations: [...opts.instrumentations]
        })
    }
}