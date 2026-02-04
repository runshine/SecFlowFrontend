
export type MenuStatus = 'available' | 'development' | 'planning';

// Added DynamicMenuItem to support constants/constants.ts
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

export interface Agent {
  key: string;
  hostname: string;
  ip_address: string;
  workspace_id: string;
  status: 'online' | 'offline' | 'error' | 'timeout' | 'unknown';
  last_seen: string;
  version: string;
  pod_id?: string;
  full_name?: string;
  system_info?: {
    os_name: string;
    os_version: string;
    os_release: string;
    kernel_version: string;
    architecture: string;
    uptime: number;
    boot_time: string;
    cpu: {
      model: string;
      logical_cores: number;
      physical_cores: number;
      usage_percent: number;
      frequency_current: number;
      load_average_1min: number;
    };
    memory: {
      total: number;
      used: number;
      available: number;
      usage_percent: number;
    };
    docker: {
      version: string;
      containers_running: number;
      containers_total: number;
      images_total: number;
      is_docker_available: boolean;
    };
    disks: Array<{
      device: string;
      mountpoint: string;
      total: number;
      used: number;
      usage_percent: number;
    }>;
    network_interfaces: Array<{
      name: string;
      ip_address: string;
      mac_address: string;
      is_up: boolean;
    }>;
    processes_top: Array<{
      pid: number;
      name: string;
      cpu_percent: number;
      memory_percent: number;
      status: string;
      cmdline: string[];
    }>;
    formatted: {
      uptime: string;
      memory: {
        total: string;
        used: string;
        available: string;
      };
      docker: {
        containers: string;
      };
      nacos_agent_version: string;
    };
  };
}

export interface AgentStats {
  summary: {
    total_agents: number;
    offline_agents: number;
    workspace_count: number;
    status_distribution: Record<string, number>;
  };
  cleanup_info: {
    can_cleanup: boolean;
    offline_count: number;
  };
}

export interface EnvTemplate {
  name: string;
  type: 'yaml' | 'archive' | 'auto';
  description: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Added TemplateFile to support pages/env/EnvTemplatePage.tsx
export interface TemplateFile {
  path: string;
  size: number;
  modified: string;
}

export interface AsyncTask {
  id: string;
  type: 'deploy' | 'undeploy';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'success';
  service_name: string;
  agent_key: string;
  template_name?: string;
  create_time: string;
  end_time?: string;
  progress: number;
  error?: string;
}

// Added TaskLog to support pages/env/EnvTasksPage.tsx and environment api
export interface TaskLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface AgentService {
  id: string;
  name: string;
  image: string;
  status: string;
  created_at: string;
  ports: Record<string, number>;
  agent_key?: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  updatedAt?: string;
  size?: string;
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
  file_count: number;
  // Added fields to fix pages/StaticPackageDetailPage.tsx errors
  original_package_path?: string;
  upload_time?: string;
}

// Added PackageFile to support StaticPackage detail views and api
export interface PackageFile {
  name: string;
  path: string;
  size: number;
  download_count: number;
}

export interface PackageStats {
  summary: {
    total_packages: number;
    total_size_human: string;
    total_downloads: number;
  };
  by_architecture: Array<{
    architecture: string;
    package_count: number;
  }>;
}

// Added Workspace to support environment api
export interface Workspace {
  id: string;
  name: string;
}

// Added NamespaceStatus to support projects api and detail page
export interface NamespaceStatus {
  k8s_namespace: string;
  namespace: {
    status: string;
    created_at: string;
  };
}

// Added K8sResourceList to support projects api and detail page
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
  deployments: Array<{
    name: string;
    replica: number;
    ready_replica: number;
  }>;
  ingresses: Array<{
    name: string;
    host: string;
    tls: any[];
  }>;
  pvcs: Array<{
    name: string;
    status: string;
    capacity: { storage: string };
    storage_class: string;
  }>;
  configmaps: any[];
  secrets: any[];
}

// Added ProjectResource to support resources api
export interface ProjectResource {
  id: number;
  project_id: string;
  resource_type: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

// Added ProjectTask to support resources api
export interface ProjectTask {
  id: string;
  name: string;
  status: string;
}

// Added ProjectPVC to support resources api
export interface ProjectPVC {
  name: string;
  capacity: string;
  status: string;
}

export type ViewType = 
  | 'dashboard' | 'project-mgmt' | 'project-detail' | 'static-packages' | 'static-package-detail' | 'deploy-script-mgmt'
  | 'test-input-release' | 'test-input-code' | 'test-input-doc'
  | 'env-agent' | 'env-service' | 'env-template' | 'env-tasks'
  | 'engine-validation' | 'pentest-root' | 'pentest-risk' | 'pentest-system' 
  | 'pentest-threat' | 'pentest-orch' | 'pentest-exec-code' | 'pentest-exec-work' | 'pentest-report'
  | 'security-assessment';
