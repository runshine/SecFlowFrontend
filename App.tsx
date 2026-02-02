
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Shield, 
  ChevronRight, 
  ChevronDown, 
  Upload, 
  Search, 
  Trash2, 
  LayoutDashboard, 
  FileBox, 
  Server, 
  FileCode, 
  Files, 
  Terminal, 
  BarChart3, 
  User, 
  Globe, 
  LogOut, 
  Settings,
  Folder,
  FileText,
  Plus,
  Cpu,
  Monitor,
  Activity,
  Code,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Download,
  CheckSquare,
  Square,
  FileArchive,
  ArrowRight,
  Edit2,
  FolderPlus,
  FilePlus,
  Lock,
  SearchCode,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  ViewType, 
  SecurityProject, 
  DynamicMenuItem, 
  MenuStatus, 
  FileItem, 
  Agent, 
  ServiceTemplate 
} from './types';
import { 
  MOCK_PROJECTS, 
  DYNAMIC_PENTEST_MENU, 
  MOCK_FILES, 
  MOCK_AGENTS, 
  MOCK_TEMPLATES 
} from './constants';

// --- Utility Functions ---

const updateItemInTree = (items: FileItem[], id: string, newName: string): FileItem[] => {
  return items.map(item => {
    if (item.id === id) {
      return { ...item, name: newName };
    }
    if (item.children) {
      return { ...item, children: updateItemInTree(item.children, id, newName) };
    }
    return item;
  });
};

const deleteItemFromTree = (items: FileItem[], id: string): FileItem[] => {
  return items
    .filter(item => item.id !== id)
    .map(item => ({
      ...item,
      children: item.children ? deleteItemFromTree(item.children, id) : undefined
    }));
};

// --- Sub-components ---

const StatusBadge: React.FC<{ status: MenuStatus }> = ({ status }) => {
  const styles = {
    available: 'bg-green-100 text-green-700 border-green-200',
    development: 'bg-amber-100 text-amber-700 border-amber-200',
    planning: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const labels = {
    available: '可用',
    development: '开发中',
    planning: '规划中',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, options }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div 
      className="fixed z-[1000] bg-white border border-slate-200 rounded-xl shadow-2xl py-2 w-48 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((opt, i) => (
        <button
          key={i}
          className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${opt.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}
          onClick={() => { opt.onClick(); onClose(); }}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const FileTreeItem: React.FC<{ 
  item: FileItem; 
  depth: number; 
  selectedIds: Set<string>; 
  onToggleSelect: (id: string) => void;
  onDownload: (item: FileItem) => void;
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, item: FileItem) => void;
  editingId: string | null;
  onRename: (id: string, newName: string) => void;
  cancelEdit: () => void;
}> = ({ item, depth, selectedIds, onToggleSelect, onDownload, onDelete, onContextMenu, editingId, onRename, cancelEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempName, setTempName] = useState(item.name);
  const isFolder = item.type === 'folder';
  const isSelected = selectedIds.has(item.id);
  const isEditing = editingId === item.id;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setTempName(item.name);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isEditing, item.name]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onRename(item.id, tempName);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1.5 px-2 hover:bg-slate-100 cursor-pointer rounded transition-colors group ${isSelected ? 'bg-blue-50' : ''}`}
        style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        onContextMenu={(e) => onContextMenu(e, item)}
      >
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(item.id);
          }}
          className={`text-blue-600 transition-colors ${isSelected ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'}`}
        >
          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => isFolder && setIsOpen(!isOpen)}>
          {isFolder ? (
            <span className="text-slate-400">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : <span className="w-3.5" />}
          
          {isFolder ? <Folder size={16} className="text-blue-500 shrink-0" /> : <FileText size={16} className="text-slate-400 shrink-0" />}
          
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => onRename(item.id, tempName)}
              className="text-sm bg-white border border-blue-500 rounded px-1 outline-none w-full max-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm truncate">{item.name}</span>
          )}
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 pr-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onDownload(item); }}
            className="text-slate-400 hover:text-blue-600 transition-colors" 
            title="下载"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="text-slate-400 hover:text-red-500 transition-colors" 
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {isFolder && isOpen && item.children && (
        <div>
          {item.children.map(child => (
            <FileTreeItem 
              key={child.id} 
              item={child} 
              depth={depth + 1} 
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              onDownload={onDownload}
              onDelete={onDelete}
              onContextMenu={onContextMenu}
              editingId={editingId}
              onRename={onRename}
              cancelEdit={cancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType | string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(MOCK_PROJECTS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // File Management State
  const [localFiles, setLocalFiles] = useState<Record<string, FileItem[]>>(MOCK_FILES);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'direct' | 'compressed'>('direct');
  const [uploadPath, setUploadPath] = useState('/');
  
  // Sidebar expansion state for recursive menus
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['test-input', 'env', 'pentest']));

  // Context Menu & Editing State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item?: FileItem } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const currentProject = MOCK_PROJECTS.find(p => p.id === selectedProjectId) || MOCK_PROJECTS[0];
  const filteredProjects = MOCK_PROJECTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleMenu = (id: string) => {
    const newSet = new Set(expandedMenus);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedMenus(newSet);
  };

  const toggleFileSelect = (id: string) => {
    const newSet = new Set(selectedFileIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedFileIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (selectedFileIds.size === 0) return;
    if (confirm(`确定要删除选中的 ${selectedFileIds.size} 个项目吗？`)) {
      const typeKey = (currentView as string).split('-').pop() as keyof typeof localFiles;
      let updatedList = localFiles[typeKey];
      selectedFileIds.forEach(id => {
        updatedList = deleteItemFromTree(updatedList, id);
      });
      setLocalFiles({ ...localFiles, [typeKey]: updatedList });
      setSelectedFileIds(new Set());
      alert('批量删除成功');
    }
  };

  const handleDownloadItem = (item: FileItem) => {
    alert(`正在下载: ${item.name}`);
  };

  const handleDownloadSelected = () => {
    alert(`正在打包下载选中的 ${selectedFileIds.size} 个项目`);
  };

  const handleContextMenu = (e: React.MouseEvent, item?: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleRename = (id: string, newName: string) => {
    const typeKey = (currentView as string).split('-').pop() as keyof typeof localFiles;
    const updated = updateItemInTree(localFiles[typeKey], id, newName);
    setLocalFiles({ ...localFiles, [typeKey]: updated });
    setEditingId(null);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('确定要删除此项目吗？')) {
      const typeKey = (currentView as string).split('-').pop() as keyof typeof localFiles;
      const updated = deleteItemFromTree(localFiles[typeKey], id);
      setLocalFiles({ ...localFiles, [typeKey]: updated });
      alert('删除成功');
    }
  };

  const handleCreateFile = (type: 'file' | 'folder', parentId?: string) => {
    alert(`正在在 ${parentId || '根目录'} 下创建新${type === 'file' ? '文件' : '文件夹'}`);
  };

  const SidebarRecursiveItem: React.FC<{ item: any, depth: number }> = ({ item, depth }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.id);
    const isActive = currentView === item.id;
    const isAvailable = !item.status || item.status === 'available';

    return (
      <div className="space-y-1">
        <div 
          onClick={() => {
            if (!isAvailable) return;
            if (hasChildren) {
              toggleMenu(item.id);
            } else {
              setCurrentView(item.id);
            }
          }}
          className={`
            flex items-center gap-3 px-4 py-2 rounded-lg transition-colors cursor-pointer group 
            ${isSidebarCollapsed ? 'justify-center' : ''}
            ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}
            ${!isAvailable ? 'opacity-50 grayscale cursor-not-allowed' : ''}
          `}
          style={{ paddingLeft: isSidebarCollapsed ? undefined : `${(depth * 1) + 1}rem` }}
          title={isSidebarCollapsed ? item.label : undefined}
        >
          {item.icon ? <span className="shrink-0">{item.icon}</span> : <div className="w-4" />}
          {!isSidebarCollapsed && (
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="text-sm font-medium truncate">{item.label}</span>
              <div className="flex items-center gap-1">
                {item.status && <StatusBadge status={item.status} />}
                {hasChildren && (
                  <ChevronRight 
                    size={14} 
                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                  />
                )}
                {!isAvailable && <Lock size={12} className="text-slate-500" />}
              </div>
            </div>
          )}
        </div>
        {!isSidebarCollapsed && hasChildren && isExpanded && (
          <div className="animate-in slide-in-from-top-1 duration-200">
            {item.children.map((child: any) => (
              <SidebarRecursiveItem key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return (
        <div className="p-8 space-y-6">
          <h1 className="text-2xl font-bold">欢迎使用 SecFlow 安全测试平台</h1>
          <p className="text-slate-500">当前正在执行项目：<span className="font-semibold text-blue-600">{currentProject.name}</span></p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: '在线 Agent', value: '12', icon: <Cpu className="text-green-500" />, color: 'bg-green-50' },
              { label: '测试进度', value: '68%', icon: <Activity className="text-blue-500" />, color: 'bg-blue-50' },
              { label: '发现漏洞', value: '24', icon: <Shield className="text-red-500" />, color: 'bg-red-50' },
            ].map((stat, i) => (
              <div key={i} className={`${stat.color} p-6 rounded-xl border border-white/50 shadow-sm flex items-center justify-between`}>
                <div>
                  <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">{stat.icon}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (currentView === 'code-audit') {
      return (
        <div className="h-full flex flex-col bg-slate-50">
          <div className="p-6 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><SearchCode size={20} /></div>
              <div>
                <h2 className="text-lg font-bold">在线代码审计</h2>
                <p className="text-xs text-slate-400">正在分析: core/services/auth_module.py</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                <CheckCircle2 size={14} /> 审计完成
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700">重新扫描</button>
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            {/* File Sidebar */}
            <div className="w-64 border-r border-slate-200 bg-white overflow-y-auto p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">文件浏览</p>
              {[
                { name: 'main.py', active: false },
                { name: 'auth_module.py', active: true, issues: 2 },
                { name: 'db_manager.py', active: false, issues: 1 },
                { name: 'api_handler.py', active: false },
                { name: 'utils.py', active: false },
              ].map((f, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg text-sm cursor-pointer transition-colors ${f.active ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-slate-50 text-slate-600'}`}>
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={16} className={f.active ? 'text-blue-500' : 'text-slate-400'} />
                    <span className="truncate">{f.name}</span>
                  </div>
                  {f.issues && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{f.issues}</span>}
                </div>
              ))}
            </div>

            {/* Code Area */}
            <div className="flex-1 bg-[#1e1e1e] text-slate-300 font-mono text-sm overflow-auto p-6 leading-relaxed relative">
              <div className="absolute top-0 left-0 w-12 h-full bg-[#252526] border-r border-slate-800 flex flex-col items-center pt-6 text-slate-600 select-none">
                {Array.from({length: 30}).map((_, i) => <div key={i} className="h-6">{i + 1}</div>)}
              </div>
              <div className="pl-10 space-y-0.5">
                <div className="h-6"><span className="text-blue-400">import</span> os, sys</div>
                <div className="h-6"><span className="text-blue-400">from</span> database <span className="text-blue-400">import</span> connection</div>
                <div className="h-6"></div>
                <div className="h-6"><span className="text-blue-400">def</span> <span className="text-yellow-400">authenticate</span>(username, password):</div>
                <div className="h-6 bg-red-900/30 border-l-2 border-red-500 flex items-center">
                  <span className="pl-4">query = <span className="text-green-400">f"SELECT * FROM users WHERE user='{'{'}username{'}'}' AND pass='{'{'}password{'}'}'"</span></span>
                  <div className="ml-auto flex items-center gap-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded mr-2 animate-pulse">
                    <ShieldAlert size={10} /> SQL Injection Detected
                  </div>
                </div>
                <div className="h-6">    cursor = connection.cursor()</div>
                <div className="h-6">    <span className="text-slate-500"># Executing the raw query</span></div>
                <div className="h-6">    cursor.execute(query)</div>
                <div className="h-6">    <span className="text-blue-400">return</span> cursor.fetchone()</div>
                <div className="h-6"></div>
                <div className="h-6"><span className="text-blue-400">def</span> <span className="text-yellow-400">get_profile</span>(user_id):</div>
                <div className="h-6">    <span className="text-slate-500"># Safe query implementation</span></div>
                <div className="h-6">    <span className="text-blue-400">return</span> connection.query(<span className="text-green-400">"SELECT * FROM profiles WHERE id=?"</span>, (user_id,))</div>
              </div>
            </div>

            {/* Audit Results */}
            <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto p-4 flex flex-col">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">审计漏洞发现 (3)</p>
               <div className="space-y-3">
                 {[
                   { title: 'SQL 注入风险', level: 'high', file: 'auth_module.py', line: 5, desc: '检测到拼接 SQL 字符串的行为，可能导致未经授权的数据库访问。' },
                   { title: '敏感信息泄露', level: 'medium', file: 'db_manager.py', line: 12, desc: '日志中记录了数据库连接字符串。' },
                   { title: '低强度加密算法', level: 'low', file: 'auth_module.py', line: 42, desc: '使用了已过时的 MD5 算法进行哈希。' },
                 ].map((issue, idx) => (
                   <div key={idx} className="p-3 border border-slate-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer bg-white">
                     <div className="flex items-center justify-between mb-2">
                       <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${issue.level === 'high' ? 'bg-red-100 text-red-600' : issue.level === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                         {issue.level}
                       </div>
                       <span className="text-[10px] text-slate-400 font-mono">L{issue.line}</span>
                     </div>
                     <h4 className="text-sm font-bold text-slate-800 mb-1">{issue.title}</h4>
                     <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">{issue.desc}</p>
                     <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <FileText size={10} /> {issue.file}
                     </div>
                   </div>
                 ))}
               </div>
               
               <div className="mt-auto pt-6 border-t border-slate-100">
                 <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                   <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
                     <Info size={16} /> 修复建议
                   </div>
                   <p className="text-xs text-blue-600 leading-relaxed">
                     建议使用参数化查询或 ORM 框架来替代字符串拼接方式执行 SQL 命令。
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      );
    }

    if (typeof currentView === 'string' && currentView.startsWith('test-input-')) {
      const typeKey = currentView.split('-').pop() as 'release' | 'code' | 'doc';
      const files = localFiles[typeKey] || [];
      return (
        <div className="p-6 h-full flex flex-col" onContextMenu={(e) => handleContextMenu(e)}>
          <div className="flex justify-between items-center mb-6" onContextMenu={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Files size={20} className="text-blue-500" />
              {currentView === 'test-input-release' ? '发布包输入管理' : currentView === 'test-input-code' ? '代码包管理' : '文档包管理'}
            </h2>
            <div className="flex gap-2">
              {selectedFileIds.size > 0 && (
                <div className="flex gap-2 mr-4 animate-in fade-in slide-in-from-right-2">
                  <button onClick={handleDownloadSelected} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                    <Download size={16} /> 下载已选 ({selectedFileIds.size})
                  </button>
                  <button onClick={handleDeleteSelected} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                    <Trash2 size={16} /> 删除已选
                  </button>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="搜索文件..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                <Upload size={16} /> 上传
              </button>
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 grid grid-cols-12 text-xs font-semibold text-slate-500">
              <div className="col-span-1"></div>
              <div className="col-span-7">名称</div>
              <div className="col-span-2">大小</div>
              <div className="col-span-2 text-right">更新时间</div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {files.map(file => (
                <FileTreeItem 
                  key={file.id} 
                  item={file} 
                  depth={0} 
                  selectedIds={selectedFileIds} 
                  onToggleSelect={toggleFileSelect}
                  onDownload={handleDownloadItem}
                  onDelete={handleDeleteItem}
                  onContextMenu={handleContextMenu}
                  editingId={editingId}
                  onRename={handleRename}
                  cancelEdit={() => setEditingId(null)}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'env-agent') {
      return (
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Cpu size={20} className="text-indigo-500" />
              Agent 管理
            </h2>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
              <Plus size={16} /> 新增 Agent 接入
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-2 overflow-y-auto space-y-3">
              {MOCK_AGENTS.map(agent => (
                <div key={agent.id} onClick={() => setSelectedAgent(agent)} className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedAgent?.id === agent.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${agent.status === 'online' ? 'bg-green-100 text-green-600' : agent.status === 'busy' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                        <Monitor size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{agent.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{agent.ip}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-500' : agent.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      <span className="text-xs font-medium text-slate-600 uppercase">{agent.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              {selectedAgent ? (
                <>
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50"><h3 className="font-bold text-slate-800">Agent 详细信息</h3></div>
                  <div className="p-4 space-y-4 text-sm">
                    <div><p className="text-slate-500 mb-1">系统信息</p><p className="font-medium">{selectedAgent.os}</p></div>
                    <div><p className="text-slate-500 mb-1">Agent 版本</p><p className="font-medium font-mono">{selectedAgent.version}</p></div>
                    <div><p className="text-slate-500 mb-1">上次心跳时间</p><p className="font-medium">{selectedAgent.lastHeartbeat}</p></div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center"><Monitor size={48} className="mb-4 opacity-20" /><p>点击列表中的 Agent 查看详情</p></div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (currentView === 'env-template') {
      return (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><Code size={20} className="text-orange-500" />服务模板管理</h2>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-orange-700"><Plus size={16} /> 创建模板</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_TEMPLATES.map(tpl => (
              <div key={tpl.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold">{tpl.name}</h3></div>
                <pre className="p-4 bg-slate-900 text-blue-300 text-[10px] overflow-x-auto leading-relaxed">{tpl.content}</pre>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xl">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Terminal size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">渗透测试工作空间</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              您当前位于：{currentView}
            </p>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700">开始测试任务</button>
              <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">配置测试参数</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      
      {/* Sidebar */}
      <aside 
        className={`
          ${isSidebarCollapsed ? 'w-20' : 'w-72'} 
          bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 
          transition-all duration-300 ease-in-out relative z-30
        `}
      >
        <div className={`p-6 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Shield className="text-white" size={24} />
          </div>
          {!isSidebarCollapsed && (
            <span className="text-xl font-bold tracking-tight text-white animate-in fade-in duration-300">SecFlow</span>
          )}
        </div>

        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 bg-slate-800 text-slate-400 p-1 rounded-full border border-slate-700 hover:text-white transition-all shadow-md z-50"
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>

        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
          
          <div>
            {!isSidebarCollapsed && (
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 animate-in fade-in duration-300">管理与输入</p>
            )}
            <div className="space-y-1">
              <div 
                onClick={() => setCurrentView('dashboard')}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                title={isSidebarCollapsed ? '控制台' : undefined}
              >
                <LayoutDashboard size={18} />
                {!isSidebarCollapsed && <span className="text-sm font-medium">控制台</span>}
              </div>

              {[
                { 
                  id: 'test-input', 
                  label: '测试输入管理', 
                  icon: <FileBox size={18} />,
                  children: [
                    { id: 'test-input-release', label: '发布包输入' },
                    { id: 'test-input-code', label: '代码包' },
                    { id: 'test-input-doc', label: '文档包' },
                  ]
                },
                { 
                  id: 'env', 
                  label: '测试环境管理', 
                  icon: <Server size={18} />,
                  children: [
                    { id: 'env-template', label: '服务模板' },
                    { id: 'env-agent', label: 'Agent 管理' },
                    { id: 'env-tasks', label: 'Agent 任务' },
                  ]
                },
              ].map(item => (
                <SidebarRecursiveItem key={item.id} item={item} depth={0} />
              ))}
            </div>
          </div>

          <div>
            {!isSidebarCollapsed && (
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 animate-in fade-in duration-300">测试执行</p>
            )}
            <div className="space-y-1">
              {[
                { id: 'code-audit', label: '在线代码审计', icon: <SearchCode size={18} />, status: 'available' },
                { id: 'validation', label: '安全验证', icon: <FileCode size={18} /> },
                { 
                  id: 'pentest', 
                  label: '渗透测试', 
                  icon: <Terminal size={18} />,
                  children: DYNAMIC_PENTEST_MENU 
                },
                { id: 'assessment', label: '安全评估', icon: <BarChart3 size={18} /> },
              ].map(item => (
                <SidebarRecursiveItem key={item.id} item={item} depth={0} />
              ))}
            </div>
          </div>
        </nav>

        <div className={`p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0"><User size={18} /></div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                 <p className="text-xs font-bold text-white truncate">管理员 A</p>
                 <p className="text-[10px] text-slate-500 truncate">admin@secflow.io</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">当前项目:</span>
            <div className="relative">
              <button onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold transition-all">
                <div className="w-2 h-2 rounded-full bg-blue-500" /><span className="max-w-[120px] sm:max-w-none truncate">{currentProject.name}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isProjectDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input autoFocus type="text" placeholder="搜索项目..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {filteredProjects.map(p => (
                      <button key={p.id} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedProjectId === p.id ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-slate-50'}`} onClick={() => { setSelectedProjectId(p.id); setIsProjectDropdownOpen(false); }}>{p.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex items-center gap-1 text-slate-500 border-r border-slate-200 pr-4 mr-2">
                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><Globe size={18} /></button>
                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><Settings size={18} /></button>
             </div>
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-end hidden sm:flex"><span className="text-sm font-bold text-slate-800">Administrator</span><span className="text-[10px] text-slate-400 uppercase tracking-tighter">Superuser</span></div>
               <button className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border-2 border-white shrink-0"><User size={20} /></button>
               <button className="ml-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="退出登录"><LogOut size={18} /></button>
             </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Context Menu Component */}
        {contextMenu && (
          <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            onClose={() => setContextMenu(null)}
            options={contextMenu.item ? [
              { label: '重命名', icon: <Edit2 size={14} />, onClick: () => setEditingId(contextMenu.item!.id) },
              { label: '下载', icon: <Download size={14} />, onClick: () => handleDownloadItem(contextMenu.item!) },
              { label: '新建文件夹', icon: <FolderPlus size={14} />, onClick: () => handleCreateFile('folder', contextMenu.item!.id) },
              { label: '新建文件', icon: <FilePlus size={14} />, onClick: () => handleCreateFile('file', contextMenu.item!.id) },
              { label: '删除', icon: <Trash2 size={14} />, onClick: () => handleDeleteItem(contextMenu.item!.id), danger: true },
            ] : [
              { label: '新建文件夹', icon: <FolderPlus size={14} />, onClick: () => handleCreateFile('folder') },
              { label: '新建文件', icon: <FilePlus size={14} />, onClick: () => handleCreateFile('file') },
            ]}
          />
        )}
      </main>
    </div>
  );
};

export default App;
