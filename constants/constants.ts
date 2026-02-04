
import { DynamicMenuItem } from '../types/types';

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
