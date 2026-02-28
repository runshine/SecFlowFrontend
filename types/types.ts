
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
  created_at?: string;
  updated_at?: string;
}

// --- Workflow Service Types ---

export type WorkflowStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'stopped';
export type TemplateScope = 'global' | 'project';
export type NodeType = 'app' | 'job';

export interface VolumeMount {
  pvc_name: string;
  mount_path: string;
  sub_path?: string;
  read_only?: boolean;
}

export interface EnvVarInput {
  name: string;
  source_key: string;
  default_value?: string;
}

export interface EnvVarOutput {
  name: string;
  description?: string;
}

export interface VolumeMountInput {
  mount_path: string;
  sub_path?: string;
  read_only?: boolean;
}

export interface VolumeMountOutput {
  mount_path: string;
  sub_path?: string;
  description?: string;
}

export interface ResourceRequirements {
  requests?: { cpu?: string; memory?: string };
  limits?: { cpu?: string; memory?: string };
}

export interface HealthCheck {
  type: 'http' | 'tcp' | 'exec';
  port?: number;
  path?: string;
  command?: string[];
  initial_delay_seconds?: number;
  period_seconds?: number;
  timeout_seconds?: number;
  failure_threshold?: number;
  success_threshold?: number;
}

export interface WorkflowContainer {
  name: string;
  image: string;
  command?: string[];
  args?: string[];
  env_vars?: Array<{ name: string; value: string }>;
  volume_mounts?: VolumeMount[];
  input_env_vars?: EnvVarInput[];
  input_volume_mounts?: VolumeMountInput[];
  output_env_vars?: EnvVarOutput[];
  output_volume_mounts?: VolumeMountOutput[];
  privileged?: boolean;
  image_pull_policy?: 'Always' | 'IfNotPresent' | 'Never';
  resources?: ResourceRequirements;
  liveness_probe?: HealthCheck;
  readiness_probe?: HealthCheck;
}

export interface ServicePort {
  name: string;
  port: number;
  target_port: number;
  protocol?: string;
}

export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  scope: TemplateScope;
  project_id?: string;
  containers: WorkflowContainer[];
  service_ports?: ServicePort[];
  service_name?: string;
  create_service?: boolean;
  service_type?: 'ClusterIP' | 'LoadBalancer' | 'NodePort';
  replicas: number;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  scope: TemplateScope;
  project_id?: string;
  containers: WorkflowContainer[];
  backoff_limit: number;
  ttl_seconds_after_finished?: number;
  created_at: string;
}

export interface WorkflowNode {
  id: string;
  node_type: NodeType;
  template_id: string;
  name: string;
  position: { x: number; y: number };
  status?: WorkflowStatus;
}

export interface WorkflowEdge {
  edge_id: string;
  source: string;
  target: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  scope: TemplateScope;
  project_id?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  created_at: string;
}

export interface WorkflowInstance {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  project_id: string;
  run_mode: 'once' | 'persistent';
  trigger_type: 'manual' | 'http';
  trigger_enabled: boolean;
  trigger_url?: string;
  is_active: boolean;
  run_count: number;
  last_run_at?: string;
  nodes: WorkflowNodeInstance[];
  edges?: WorkflowEdge[];
  created_by?: string;
  started_at?: string;
  finished_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNodeInstance {
  id: string;
  node_type: NodeType;
  template_id: string;
  name: string;
  status: WorkflowStatus;
  k8s_resource_name?: string;
  k8s_resource_type?: string;
  depends_on?: string[];
  downstream_node_ids?: string[];
  service_name?: string;
  timeout_seconds?: number;
  position?: { x: number; y: number };
  env_vars?: any[];
  volume_mounts?: any[];
  resources?: any;
  started_at?: string;
  finished_at?: string;
  message?: string;
  input_env_vars?: any[];
  input_volume_mounts?: any[];
  created_at: string;
}

// --- End Workflow Types ---

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  user_ids?: number[];
}

export interface UserSession {
  user_id: number;
  username: string;
  role: string[];
  ip_address: string;
  user_agent: string;
  login_at: string;
  last_active_at: string;
}

export interface DetailedSession {
  id: number;
  token_jti: string;
  ip_address: string;
  user_agent: string;
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
  last_active_at: string;
  expires_at: string;
}

export interface MachineToken {
  id: number;
  machine_code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
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
  resource_uuid: string;
  name: string;
  resource_type: 'document' | 'software' | 'code' | 'other';
  original_file_name: string;
  original_file_size: number;
  original_file_format?: string;
  upload_status: 'pending' | 'running' | 'completed' | 'failed';
  upload_message?: string;
  pvc_name?: string;
  pvc_namespace?: string;
  pvc_size?: number;
  extract_path?: string;
  project_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  task_id: string;
  resource_id: number;
  project_id: string;
  task_type: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectPVC {
  pvc_name: string;
  resource_type: string;
  namespace: string;
  capacity: string;
  status: string;
  storage_class: string;
  resource_id?: number;
  resource_name?: string;
}

export interface Agent {
  key: string;
  hostname: string;
  full_name?: string;
  status: 'online' | 'offline' | 'error' | 'timeout' | 'unknown';
  ip_address: string;
  system_info?: any;
  project_id?: string;
  last_seen?: string;
  pod_id?: string;
  services?: any[];
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

export interface FileItem {
  id: number;
  name: string;
  size: string;
  updatedAt: string;
}

export interface AgentStats {
  timestamp: string;
  project_id: string;
  summary: {
    total_agents: number;
    offline_agents: number;
    status_distribution: {
      online: number;
      offline: number;
      error: number;
      unknown: number;
    };
  };
  cleanup_info: {
    can_cleanup: boolean;
    offline_count: number;
    suggested_action: string;
  };
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

// Deploy Script Management Types
export interface DeployScriptItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified_at: number;
}

export interface DeployScriptListResponse {
  path: string;
  total: number;
  items: DeployScriptItem[];
}

export type ViewType = 
  | 'dashboard' | 'project-mgmt' | 'project-detail' | 'static-packages' | 'static-package-detail' | 'deploy-script-mgmt'
  | 'test-input-release' | 'test-input-code' | 'test-input-doc' | 'test-input-tasks' | 'test-input-other' | 'test-output-pvc'
  | 'env-mgmt' | 'env-agent' | 'env-service' | 'env-template' | 'env-tasks'
  | 'workflow-instances' | 'workflow-instance-detail' | 'workflow-jobs' | 'workflow-job-detail' | 'workflow-apps' | 'workflow-app-detail'
  | 'engine-validation' | 'pentest-root' | 'pentest-risk' | 'pentest-system' 
  | 'pentest-threat' | 'pentest-orch' | 'pentest-exec-code' | 'pentest-exec-work' | 'pentest-exec-secmate' | 'pentest-report'
  | 'security-assessment'
  | 'sys-settings' | 'change-password' 
  | 'user-mgmt-users' | 'user-mgmt-roles' | 'user-mgmt-perms' | 'user-mgmt-online';
