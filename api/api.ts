
import { authApi } from './auth';
import { projectsApi } from './projects';
import { resourcesApi } from './resources';
import { staticPackagesApi } from './staticPackages';
import { environmentApi } from './environment';

export const api = {
  auth: authApi,
  projects: projectsApi,
  resources: resourcesApi,
  staticPackages: staticPackagesApi,
  environment: environmentApi
};
