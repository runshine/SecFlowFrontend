
import { DynamicMenuItem, SecurityProject, FileItem, Agent, ServiceTemplate } from './types';

export const MOCK_PROJECTS: SecurityProject[] = [
  { id: '1', name: '金融支付系统安全审计', description: '核心交易系统年度安全测试' },
  { id: '2', name: '云原生架构漏洞扫描', description: 'K8s集群渗透测试项目' },
  { id: '3', name: '移动端App合规性测试', description: '隐私合规性专项检测' },
  { id: '4', name: '物联网网关固件分析', description: '智能家居安全测试' },
];

export const DYNAMIC_PENTEST_MENU: DynamicMenuItem[] = [
  {
    id: 'target',
    label: '目标选择',
    status: 'available',
    children: [
      { id: 't1', label: '资产导入', status: 'available' },
      { id: 't2', label: '存活扫描', status: 'development' },
      { id: 't3', label: '端口探测', status: 'available', children: [
          { id: 't3-1', label: '全量扫描', status: 'available' },
          { id: 't3-2', label: '指纹识别', status: 'planning' }
      ]}
    ]
  },
  { id: 'strategy', label: '策略制定', status: 'available' },
  { id: 'system', label: '系统分析', status: 'available' },
  { id: 'threat', label: '威胁分析', status: 'development' },
  { id: 'execution', label: '测试执行', status: 'planning' },
  { id: 'report', label: '报告分析', status: 'available' },
];

export const MOCK_FILES: Record<string, FileItem[]> = {
  release: [
    {
      id: 'f1', name: 'Project_v1.0_Final', type: 'folder', updatedAt: '2023-10-01', children: [
        { id: 'f2', name: 'binary_release.zip', type: 'file', size: '45MB', updatedAt: '2023-10-01' },
        { id: 'f3', name: 'config.json', type: 'file', size: '2KB', updatedAt: '2023-10-02' },
      ]
    }
  ],
  code: [
    {
      id: 'c1', name: 'src', type: 'folder', updatedAt: '2023-10-05', children: [
        { id: 'c2', name: 'main.py', type: 'file', size: '12KB', updatedAt: '2023-10-05' },
        { id: 'c3', name: 'utils.py', type: 'file', size: '4KB', updatedAt: '2023-10-06' },
      ]
    }
  ]
};

export const MOCK_AGENTS: Agent[] = [
  { id: 'ag1', name: 'Scan-Node-01', ip: '192.168.1.10', status: 'online', os: 'Ubuntu 22.04', version: 'v2.1.0', lastHeartbeat: '2023-10-27 10:30:00' },
  { id: 'ag2', name: 'Exfil-Node-02', ip: '10.0.0.45', status: 'offline', os: 'CentOS 7', version: 'v2.0.5', lastHeartbeat: '2023-10-26 22:15:00' },
  { id: 'ag3', name: 'Task-Node-Local', ip: '127.0.0.1', status: 'busy', os: 'macOS 14', version: 'v2.2.0', lastHeartbeat: '2023-10-27 11:05:00' },
];

export const MOCK_TEMPLATES: ServiceTemplate[] = [
  { id: 't1', name: 'Nmap Distributed Scan', content: 'version: "3.9"\nservices:\n  nmap:\n    image: nmap/nmap:latest\n    command: -sV -T4 localhost', status: 'active' },
  { id: 't2', name: 'OWASP ZAP API Scanner', content: 'version: "3"\nservices:\n  zap:\n    image: owasp/zap2docker-stable\n    ports: ["8080:8080"]', status: 'active' },
];
