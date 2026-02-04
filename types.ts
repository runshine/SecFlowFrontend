
export type MenuStatus = 'available' | 'development' | 'planning';

export interface DynamicMenuItem {
  id: string;
  label: string;
  status: MenuStatus;
  children?: DynamicMenuItem[];
  path?: string;
  icon?: string;
}

export interface ProjectRole {
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at?: string;
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
  roles?: ProjectRole[];
  k8s_namespace?: string;
}

export interface NamespaceStatus {
  namespace: {
    name: string;
    status: string;
    created_at: string;
  };
  resources: {
    pods: any[];
    services: any[];
    configmaps: any[];
    deployments: any[];
  };
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  size?: string;
  updatedAt: string;
  resource_type?: string;
  relative_path?: string;
  status?: string;
}

export interface Agent {
  key: string;
  ip_address: string;
  hostname: string;
  status: 'running' | 'offline' | 'error';
  last_seen: string;
  workspace_id?: string;
  system_info?: {
    cpu: string;
    memory: string;
    disk: string;
  };
}

export interface EnvTemplate {
  name: string;
  description: string;
  type: 'yaml' | 'archive' | 'auto';
  updated_at?: string;
}

export interface AsyncTask {
  id: string;
  task_type: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  progress: number;
  message?: string;
  created_at?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  is_active: boolean;
  role: string[];
}

export interface StaticPackage {
  id: string;
  name: string;
  version: string;
  system: string;
  architecture: string;
  original_filename: string;
  total_size: number;
  file_count: number;
  upload_time: string;
  last_check_time: string;
  check_status: 'pending' | 'checking' | 'valid' | 'invalid';
  download_count: number;
  last_download_time?: string;
}

export interface PackageFile {
  path: string;
  name: string;
  size: number;
  download_count: number;
  last_download_time?: string;
}

export interface PackageStats {
  summary: {
    total_packages: number;
    total_size: number;
    total_size_human: string;
    total_files: number;
    total_downloads: number;
  };
  by_architecture: Array<{
    architecture: string;
    package_count: number;
    total_size_human: string;
  }>;
}

export type ViewType = 
  | 'test-input-release' 
  | 'test-input-code' 
  | 'test-input-doc'
  | 'env-dashboard'
  | 'env-template'
  | 'env-agent'
  | 'env-service'
  | 'env-tasks'
  | 'pentest'
  | 'validation'
  | 'assessment'
  | 'dashboard'
  | 'code-audit'
  | 'project-mgmt'
  | 'project-detail'
  | 'static-packages'
  | 'static-package-detail'
  | 'deploy-script-mgmt'
  | 'login'
  | 'engine-validation'
  | 'pentest-risk'
  | 'pentest-system'
  | 'pentest-threat'
  | 'pentest-orch'
  | 'pentest-exec-code'
  | 'pentest-exec-web'
  | 'pentest-exec-poc'
  | 'pentest-exec-exp'
  | 'pentest-report'
  | 'engine-assessment';
