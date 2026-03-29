import React, { useEffect, useMemo, useState } from 'react';
import { Archive, FileCode, FileText, FolderTree, HardDrive, ListTodo } from 'lucide-react';
import { ReleasePackagePage } from './ReleasePackagePage';
import { CodeAuditPage } from './CodeAuditPage';
import { DocAnalysisPage } from './DocAnalysisPage';
import { OtherInputPage } from './OtherInputPage';
import { PvcManagementPage } from './PvcManagementPage';
import { TaskMgmtPage } from './TaskMgmtPage';

type PublicResourceTab = 'release' | 'code' | 'doc' | 'other' | 'pvc' | 'tasks';

interface PublicResourceManagementPageProps {
  projectId: string;
  initialTab?: PublicResourceTab;
}

const TAB_OPTIONS: Array<{
  id: PublicResourceTab;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  { id: 'release', label: '发布包', description: '版本制品与安装包', icon: <Archive size={16} /> },
  { id: 'code', label: '源代码', description: '源码审计与代码输入', icon: <FileCode size={16} /> },
  { id: 'doc', label: '文档类', description: '文档与说明材料', icon: <FileText size={16} /> },
  { id: 'other', label: '其他资源', description: '补充文件与杂项输入', icon: <FolderTree size={16} /> },
  { id: 'pvc', label: 'PVC管理', description: 'PVC 生命周期与在线浏览', icon: <HardDrive size={16} /> },
  { id: 'tasks', label: '任务管理', description: '资源处理任务与状态', icon: <ListTodo size={16} /> },
];

export const PublicResourceManagementPage: React.FC<PublicResourceManagementPageProps> = ({
  projectId,
  initialTab = 'pvc',
}) => {
  const [activeTab, setActiveTab] = useState<PublicResourceTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const activeMeta = useMemo(
    () => TAB_OPTIONS.find((tab) => tab.id === activeTab) ?? TAB_OPTIONS[0],
    [activeTab],
  );

  const renderActivePage = () => {
    switch (activeTab) {
      case 'release':
        return <ReleasePackagePage projectId={projectId} />;
      case 'code':
        return <CodeAuditPage projectId={projectId} />;
      case 'doc':
        return <DocAnalysisPage projectId={projectId} />;
      case 'other':
        return <OtherInputPage projectId={projectId} />;
      case 'tasks':
        return <TaskMgmtPage projectId={projectId} />;
      case 'pvc':
      default:
        return <PvcManagementPage projectId={projectId} />;
    }
  };

  return (
    <div className="space-y-6">
      <section className="px-8 pt-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-600">Public Resources</p>
              <h1 className="mt-3 text-3xl font-black text-slate-900">公共资源管理</h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                将输入资源、PVC 内容和处理任务收进一个统一工作台，减少跨页切换。
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-black text-slate-900">{activeMeta.label}</span>
              <span className="ml-2">{activeMeta.description}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-6">
            {TAB_OPTIONS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'rounded-2xl border px-4 py-4 text-left transition-all',
                    active
                      ? 'border-cyan-300 bg-cyan-50 text-cyan-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 text-sm font-black">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-500">{tab.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section>{renderActivePage()}</section>
    </div>
  );
};
