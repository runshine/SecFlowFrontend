
import { authApi } from './auth';
import { projectsApi } from './projects';
import { resourcesApi } from './resources';
import { staticPackagesApi } from './staticPackages';
import { environmentApi } from './environment';
import { codeServerApi } from './codeServer';
import { secmateNGApi } from './secmateNG';
import { deployScriptApi } from './deployScript';
import { workflowApi } from './workflow';
import { k8sApi } from './k8s';
import { adminApi } from './admin';
import { vulnApi } from './vuln';
import { fileserverApi } from './fileserver';
import { configCenterApi } from './configcenter';

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
  k8s: k8sApi,
  admin: adminApi,
  vuln: vulnApi,
  fileserver: fileserverApi,
  configCenter: configCenterApi
};
