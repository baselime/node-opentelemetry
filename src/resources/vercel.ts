import {
    DetectorSync,
    Resource,
    ResourceDetectionConfig,
} from '@opentelemetry/resources';
import {
    SemanticResourceAttributes,
} from '@opentelemetry/semantic-conventions';

export class VercelDetector implements DetectorSync {
    detect(_config?: ResourceDetectionConfig): Resource {
        if (!process.env.VERCEL) {
            return Resource.empty();
        }

        const attributes = {
            [SemanticResourceAttributes.CLOUD_PROVIDER]: String(
                'Vercel'
            ),
            [SemanticResourceAttributes.CLOUD_PLATFORM]: String(
                'Vercel Functions'
            ),
            [SemanticResourceAttributes.CLOUD_REGION]: String(process.env.VERCEL_REGION),
            'vercel.environment': String(process.env.VERCEL_ENV),
            'vercel.url': String(process.env.VERCEL_URL),
            'vercel.git.provider': String(process.env.VERCEL_GIT_PROVIDER),
            'vercel.git.repo': String(process.env.VERCEL_GIT_REPO_SLUG),
            'vercel.git.commit': String(process.env.VERCEL_GIT_COMMIT_SHA),
            'vercel.git.message': String(process.env.VERCEL_GIT_COMMIT_MESSAGE),
            'vercel.git.author': String(process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME)
        }
        return new Resource(attributes);
    }
}