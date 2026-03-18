
import { authApi } from './auth';
import { projectsApi } from './projects';
import { resourcesApi } from './resources';
import { staticPackagesApi } from './staticPackages';
import { environmentApi } from './environment';
import { codeServerApi } from './codeServer';
import { secmateNGApi } from './secmateNG';
import { deployScriptApi } from './deployScript';
import { workflowApi } from './workflow';
import { adminApi } from './admin';

export const api = {
  auth: authApi,
  projects: projectsApi,
  resources: resourcesApi,
  staticPackages: staticPackagesApi,
  environment: environmentApi,
  codeServer: codeServerApi,
  secmateNG: secmateNGApi,
  deployScript: deployScriptApi,
  workflow: workflowApi,
  admin: adminApi
};
