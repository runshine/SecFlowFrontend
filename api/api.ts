
import { authApi } from './auth';
import { projectsApi } from './projects';
import { resourcesApi } from './resources';
import { staticPackagesApi } from './staticPackages';
import { environmentApi } from './environment';
import { codeServerApi } from './codeServer';
import { deployScriptApi } from './deployScript';

export const api = {
  auth: authApi,
  projects: projectsApi,
  resources: resourcesApi,
  staticPackages: staticPackagesApi,
  environment: environmentApi,
  codeServer: codeServerApi,
  deployScript: deployScriptApi
};
