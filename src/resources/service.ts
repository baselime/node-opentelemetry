import { Attributes } from '@opentelemetry/api';
import {
    DetectorSync,
    Resource,
    ResourceDetectionConfig,
} from '@opentelemetry/resources';
type ServiceDetectorConfig = {
    serviceName?: string,
    attributes?: Attributes | Resource,
}

export class ServiceDetector implements DetectorSync {
    serviceName?: string;
    attributes?: Attributes
    constructor(config?: ServiceDetectorConfig) {
        this.serviceName = config?.serviceName || process.env.OTEL_SERVICE_NAME;
        this.attributes = config?.attributes instanceof Resource ? config.attributes.attributes : config?.attributes || {};
    }
    detect(_config?: ResourceDetectionConfig): Resource {
        if (!this.serviceName || !this.attributes) {
            return Resource.empty();
        }

        const attributes = {
            'service.name': this.serviceName,
            'service.namespace': this.serviceName,
            ...this.attributes,
        }
        return new Resource(attributes);
    }
}