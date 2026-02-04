
export type MenuStatus = 'available' | 'development' | 'planning';

export interface DynamicMenuItem {
  id: string;
  label: string;
  status: MenuStatus;
  children?: DynamicMenuItem[];
}

export interface UserInfo {
  id: number;
  username: string;
  is_active: boolean;
  role: string[];
}

export interface SecurityProject {
  id: string;
  name: string;
  description: string;
  owner_id?: string;
  owner_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  k8s_namespace?: string;
}

export interface ProjectResource {
  id: number;
  project_id: string;
  resource_type: 'document' | 'software' | 'code' | 'other';
  file_name: string;
  file_size: number;
  url?: string;
  target_path: string;
  extract_path?: string;
  created_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  task_type: 'download' | 'extract';
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  progress: number;
  message?: string;
  created_at: string;
  resource_id?: number;
}

export interface ProjectPVC {
  pvc_name: string;
  resource_type: string;
  namespace: string;
  capacity: string;
  status: string;
  mount_path: string;
  resources_count: number;
  storage_class: string;
}

export interface Agent {
  key: string;
  hostname: string;
  status: 'online' | 'offline' | 'error' | 'timeout' | 'unknown';
  ip_address: string;
  system_info?: any;
  // Additional properties used in the application
  workspace_id?: string;
  last_seen?: string;
}

export interface EnvTemplate {
  name: string;
  type: string;
  description: string;
  file_size: number;
  updated_at: string;
}

export interface AsyncTask {
  id: string;
  type: string;
  status: string;
  service_name: string;
  progress: number;
  create_time: string;
  agent_key: string;
}

export interface TaskLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface StaticPackage {
  id: string;
  name: string;
  version: string;
  system: string;
  architecture: string;
  total_size: number;
  download_count: number;
  check_status: string;
  // Additional properties used in the application
  file_count?: number;
  original_package_path?: string;
  upload_time?: string;
}

export interface PackageStats {
  summary: {
    total_packages: number;
    total_size_human: string;
    total_downloads: number;
  };
  by_architecture: Array<{ architecture: string; package_count: number }>;
}

// Added missing types to resolve compilation errors across the application
export interface FileItem {
  id: number;
  name: string;
  size: string;
  updatedAt: string;
}

export interface AgentStats {
  total: number;
  online: number;
  offline: number;
  error: number;
}

export interface TemplateFile {
  path: string;
  size: number;
  modified: string;
}

export interface PackageFile {
  path: string;
  name: string;
  size: number;
  download_count: number;
}

export interface NamespaceStatus {
  k8s_namespace: string;
  namespace: {
    status: string;
    created_at: string;
  };
}

export interface K8sResourceList {
  pods: Array<{
    name: string;
    node: string;
    ip: string;
    status: string;
  }>;
  services: Array<{
    name: string;
    type: string;
    cluster_ip: string;
    ports: string[];
  }>;
  ingresses: Array<{
    name: string;
    host: string;
    tls: any[];
  }>;
  pvcs: Array<{
    name: string;
    status: string;
    capacity: {
      storage: string;
    };
    storage_class: string;
  }>;
  deployments: Array<{
    name: string;
    replica: number;
    ready_replica: number;
  }>;
  configmaps: any[];
  secrets: any[];
}

export interface AgentService {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: Record<string, string>;
  agent_key?: string;
  agent_hostname?: string;
}

export interface Workspace {
  id: string;
  name: string;
}

export type ViewType = 
  | 'dashboard' | 'project-mgmt' | 'project-detail' | 'static-packages' | 'static-package-detail' | 'deploy-script-mgmt'
  | 'test-input-release' | 'test-input-code' | 'test-input-doc' | 'test-input-other'
  | 'env-agent' | 'env-service' | 'env-template' | 'env-tasks'
  | 'engine-validation' | 'pentest-root' | 'pentest-risk' | 'pentest-system' 
  | 'pentest-threat' | 'pentest-orch' | 'pentest-exec-code' | 'pentest-exec-work' | 'pentest-exec-secmate' | 'pentest-report'
  | 'security-assessment';
