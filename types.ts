
export type MenuStatus = 'available' | 'development' | 'planning';

export interface DynamicMenuItem {
  id: string;
  label: string;
  status: MenuStatus;
  children?: DynamicMenuItem[];
}

export interface SecurityProject {
  id: string;
  name: string;
  description: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  size?: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'busy';
  os: string;
  version: string;
  lastHeartbeat: string;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  content: string; // docker-compose yaml
  status: 'active' | 'inactive';
}

export type ViewType = 
  | 'test-input-release' 
  | 'test-input-code' 
  | 'test-input-doc'
  | 'env-template'
  | 'env-agent'
  | 'env-tasks'
  | 'pentest'
  | 'validation'
  | 'assessment'
  | 'dashboard'
  | 'code-audit';
