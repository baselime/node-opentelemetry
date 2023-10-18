import {
    DetectorSync,
    Resource,
    ResourceAttributes,
    ResourceDetectionConfig,
} from '@opentelemetry/resources';

type BaselimeDetectorOpts = {
    service?: string,
    namespace?: string
}
export class BaselimeDetector implements DetectorSync {
    attributes: ResourceAttributes = {}
    constructor(options: BaselimeDetectorOpts) {
        if (options.service) {
            this.attributes['$baselime.service'] = process.env.OTEL_SERVICE_NAME || options.service
            this.attributes['service.name'] = options.service
        } else {
            this.attributes['$baselime.service'] = process.env.OTEL_SERVICE_NAME;
            this.attributes['service.name'] = process.env.OTEL_SERVICE_NAME;
        }

        if (options.namespace) {
            this.attributes['$baselime.namespace'] = options.namespace
        }

    }
    detect(_config?: ResourceDetectionConfig): Resource {
        if (!this.attributes['service.name'] && !this.attributes['$baselime.namespace']) {
            return Resource.empty();
        }


        return new Resource(this.attributes);
    }
}