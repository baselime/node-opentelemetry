import {
    DetectorSync,
    Resource,
    ResourceDetectionConfig,
} from '@opentelemetry/resources';
import {
    SemanticResourceAttributes,
    SEMRESATTRS_CLOUD_PROVIDER,
    SEMRESATTRS_CLOUD_REGION,
    SEMRESATTRS_CLOUD_PLATFORM,
} from '@opentelemetry/semantic-conventions';

export class VercelDetector implements DetectorSync {
    detect(_config?: ResourceDetectionConfig): Resource {
        if (!process.env.VERCEL) {
            return Resource.empty();
        }

        const deploymentUrl = String(process.env.VERCEL_URL);

        if (!deploymentUrl) {
            return Resource.empty();
        }

       
        const gitBranchUrl = String(process.env.VERCEL_BRANCH_URL);
        let serviceName: string;
        let serviceNamespace: string;

        if(gitBranchUrl) {
            try { 
                serviceName = gitBranchUrl.split('-git-')[0]
                serviceNamespace = serviceName;
            } catch(e) {
            }
        }

        const attributes = {
            [SEMRESATTRS_CLOUD_PROVIDER]: String(
                'Vercel'
            ),
            [SEMRESATTRS_CLOUD_PLATFORM]: String(
                'Vercel Functions'
            ),
            [SEMRESATTRS_CLOUD_REGION]: String(process.env.VERCEL_REGION),
            'vercel.environment': String(process.env.VERCEL_ENV),
            'vercel.url': String(process.env.VERCEL_URL),
            'vercel.url.branch': String(process.env.VERCEL_BRANCH_URL),
            'vercel.git.provider': String(process.env.VERCEL_GIT_PROVIDER),
            'vercel.git.repo': String(process.env.VERCEL_GIT_REPO_SLUG),
            'vercel.git.commit': String(process.env.VERCEL_GIT_COMMIT_SHA),
            'vercel.git.message': String(process.env.VERCEL_GIT_COMMIT_MESSAGE),
            'vercel.git.author': String(process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME),
            'service.name': serviceName,
            'service.namespace': serviceNamespace,
        }

        return new Resource(attributes);
    }
}