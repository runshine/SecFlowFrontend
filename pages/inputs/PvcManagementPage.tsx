import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ChevronRight,
  Database,
  Download,
  File,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Music,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { api } from '../../clients/api';
import { showConfirm, showPrompt } from '../../components/DialogService';
import { StatusBadge } from '../../components/StatusBadge';
import {
  OutputPvcDetail,
  ProjectResource,
  PvcBrowserChildrenResponse,
  PvcBrowserNode,
} from '../../types/types';


type PreviewState =
  | { mode: 'empty' }
  | { mode: 'text'; text: string; truncated: boolean; contentType?: string | null }
  | { mode: 'image' | 'pdf' | 'audio' | 'video'; url: string; contentType?: string | null }
  | { mode: 'binary'; size?: number | null; contentType?: string | null };

const TEXT_EXTENSIONS = new Set(['txt', 'json', 'yaml', 'yml', 'md', 'log', 'xml', 'csv', 'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'sh', 'sql']);

const formatBytes = (value?: number | null) => {
  if (value == null) return '-';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const toText = (base64: string) => {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const sortNodes = (nodes: PvcBrowserNode[]) =>
  [...nodes].sort((a, b) => (a.node_type === b.node_type ? a.name.localeCompare(b.name, 'zh-CN') : a.node_type === 'directory' ? -1 : 1));

const flattenNodes = (nodes: PvcBrowserNode[], map: Record<string, PvcBrowserNode>) => {
  nodes.forEach((node) => {
    map[node.path] = node;
    flattenNodes(node.children || [], map);
  });
};

const inferPreviewMode = (node: PvcBrowserNode, contentType?: string | null): PreviewState['mode'] => {
  const type = contentType || node.content_type || '';
  if (type.startsWith('text/') || type === 'application/json' || type === 'application/xml' || type === 'application/javascript') return 'text';
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('video/')) return 'video';
  const extension = node.name.includes('.') ? node.name.split('.').pop()!.toLowerCase() : '';
  if (TEXT_EXTENSIONS.has(extension)) return 'text';
  return 'binary';
};

const getParentPath = (path: string) => {
  if (path === '/') return '/';
  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) return '/';
  return `/${parts.slice(0, -1).join('/')}`;
};

const joinPath = (parent: string, name: string) => (parent === '/' ? `/${name}` : `${parent}/${name}`);

export const PvcManagementPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [pvcs, setPvcs] = useState<OutputPvcDetail[]>([]);
  const [selectedPvcId, setSelectedPvcId] = useState<number | null>(null);
  const [selectedPvcDetail, setSelectedPvcDetail] = useState<OutputPvcDetail | null>(null);
  const [browserTree, setBrowserTree] = useState<PvcBrowserNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
  const [currentDirectory, setCurrentDirectory] = useState<PvcBrowserChildrenResponse | null>(null);
  const [selectedNodePath, setSelectedNodePath] = useState<string>('/');
  const [previewNode, setPreviewNode] = useState<PvcBrowserNode | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ mode: 'empty' });
  const [searchTerm, setSearchTerm] = useState('');
  const [busy, setBusy] = useState<string>('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', pvc_size: 10 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const selectedPvc = useMemo(
    () => pvcs.find((item) => item.id === selectedPvcId) || null,
    [pvcs, selectedPvcId]
  );

  const nodeMap = useMemo(() => {
    const map: Record<string, PvcBrowserNode> = { '/': { path: '/', name: '/', node_type: 'directory', has_children: true, children: browserTree } };
    flattenNodes(browserTree, map);
    return map;
  }, [browserTree]);

  const filteredPvcs = useMemo(
    () =>
      pvcs.filter((item) =>
        [item.name, item.pvc_name, item.description || ''].some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [pvcs, searchTerm]
  );

  const stats = useMemo(() => {
    const totalSizeGi = pvcs.reduce((sum, item) => sum + Number.parseInt(item.pvc_size, 10), 0);
    return {
      totalCount: pvcs.length,
      activeCount: pvcs.filter((item) => item.in_use).length,
      totalSizeGi,
    };
  }, [pvcs]);

  useEffect(() => {
    void loadPvcList();
  }, [projectId]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const revokePreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const loadPvcList = async (preferredId?: number | null) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const resources = await api.resources.list(projectId, 'output_pvc');
      const details = await Promise.all(resources.map((item: ProjectResource) => api.resources.getOutputPvcDetail(item.id)));
      setPvcs(details);
      const nextId = preferredId ?? selectedPvcId ?? details[0]?.id ?? null;
      if (nextId) {
        await selectPvc(nextId, details);
      } else {
        setSelectedPvcId(null);
        setSelectedPvcDetail(null);
        setBrowserTree([]);
        setCurrentDirectory(null);
        setPreviewNode(null);
        setPreview({ mode: 'empty' });
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshBrowser = async (resourceId: number, keepDirectoryPath?: string, keepPreviewPath?: string) => {
    const [detail, tree, directory] = await Promise.all([
      api.resources.getOutputPvcDetail(resourceId),
      api.resources.getPvcBrowserTree(resourceId),
      api.resources.getPvcBrowserChildren(resourceId, keepDirectoryPath || currentDirectory?.current_path || '/'),
    ]);
    setSelectedPvcDetail(detail);
    setBrowserTree(sortNodes(tree.items));
    setCurrentDirectory({
      ...directory,
      directories: sortNodes(directory.directories),
      files: sortNodes(directory.files),
    });
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      directory.breadcrumbs.forEach((item) => next.add(item.path));
      return next;
    });
    if (keepPreviewPath) {
      const refreshedNode = [...directory.directories, ...directory.files].find((item) => item.path === keepPreviewPath) || nodeMap[keepPreviewPath];
      if (refreshedNode) {
        await openFile(resourceId, refreshedNode, directory.current_path);
      } else {
        setPreviewNode(null);
        setPreview({ mode: 'empty' });
      }
    }
  };

  const selectPvc = async (resourceId: number, currentList?: OutputPvcDetail[]) => {
    setSelectedPvcId(resourceId);
    setPreviewNode(null);
    setPreview({ mode: 'empty' });
    const detail = (currentList || pvcs).find((item) => item.id === resourceId) || (await api.resources.getOutputPvcDetail(resourceId));
    setSelectedPvcDetail(detail);
    const [tree, children] = await Promise.all([
      api.resources.getPvcBrowserTree(resourceId),
      api.resources.getPvcBrowserChildren(resourceId, '/'),
    ]);
    setBrowserTree(sortNodes(tree.items));
    setCurrentDirectory({
      ...children,
      directories: sortNodes(children.directories),
      files: sortNodes(children.files),
    });
    setExpandedPaths(new Set(['/', ...children.breadcrumbs.map((item) => item.path)]));
    setSelectedNodePath('/');
  };

  const openDirectory = async (path: string) => {
    if (!selectedPvcId) return;
    setBusy(`dir:${path}`);
    try {
      const children = await api.resources.getPvcBrowserChildren(selectedPvcId, path);
      setCurrentDirectory({
        ...children,
        directories: sortNodes(children.directories),
        files: sortNodes(children.files),
      });
      setSelectedNodePath(path);
      setExpandedPaths((prev) => new Set(prev).add(path));
    } finally {
      setBusy('');
    }
  };

  const openFile = async (resourceId: number, node: PvcBrowserNode, parentPath = getParentPath(node.path)) => {
    setBusy(`file:${node.path}`);
    setPreviewNode(node);
    revokePreviewUrl();
    try {
      const mode = inferPreviewMode(node, node.content_type);
      if (mode === 'text') {
        const payload = await api.resources.getPvcBrowserFile(resourceId, node.path);
        setPreview({
          mode: 'text',
          text: toText(payload.base64),
          truncated: payload.truncated,
          contentType: payload.content_type,
        });
      } else if (mode === 'binary') {
        const payload = await api.resources.getPvcBrowserFile(resourceId, node.path, 1);
        setPreview({ mode: 'binary', size: payload.size, contentType: payload.content_type });
      } else {
        const blob = await api.resources.fetchPvcBrowserPreviewBlob(resourceId, node.path);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreview({ mode, url, contentType: blob.type || node.content_type });
      }
      if (currentDirectory?.current_path !== parentPath) {
        await openDirectory(parentPath);
      }
      setSelectedNodePath(node.path);
    } finally {
      setBusy('');
    }
  };

  const onTreeClick = async (node: PvcBrowserNode) => {
    if (!selectedPvcId) return;
    if (node.node_type === 'directory') {
      if (expandedPaths.has(node.path) && currentDirectory?.current_path !== node.path) {
        setExpandedPaths((prev) => {
          const next = new Set(prev);
          next.delete(node.path);
          return next;
        });
      } else {
        await openDirectory(node.path);
      }
      return;
    }
    await openFile(selectedPvcId, node);
  };

  const handleCreatePvc = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateLoading(true);
    try {
      await api.resources.createOutputPvc({ ...createForm, project_id: projectId });
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', pvc_size: 10 });
      await loadPvcList();
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeletePvc = async (resource: OutputPvcDetail) => {
    const confirmed = await showConfirm({
      title: '删除 PVC',
      message: `确认删除 PVC "${resource.name}" 吗？`,
      confirmText: '确认删除',
      cancelText: '取消',
      danger: true,
    });
    if (!confirmed) return;
    setBusy(`delete-pvc:${resource.id}`);
    try {
      await api.resources.deleteOutputPvc(resource.id);
      await loadPvcList(selectedPvcId === resource.id ? null : selectedPvcId);
    } finally {
      setBusy('');
    }
  };

  const askCurrentDirectoryName = async (title: string, currentValue = '') => {
    const value = await showPrompt({
      title,
      message: '请输入名称后继续操作。',
      defaultValue: currentValue,
      placeholder: '请输入名称',
      confirmText: '确认',
      cancelText: '取消',
    });
    return (value || '').trim();
  };

  const requireSelectedPvc = () => {
    if (!selectedPvcId || !selectedPvc) {
      throw new Error('请先选择一个 PVC');
    }
    return selectedPvc;
  };

  const handleCreateDirectory = async () => {
    const pvc = requireSelectedPvc();
    const name = await askCurrentDirectoryName('新建目录');
    if (!name) return;
    setBusy('mkdir');
    try {
      await api.resources.createPvcBrowserDirectory(pvc.id, currentDirectory?.current_path || '/', name);
      await refreshBrowser(pvc.id, currentDirectory?.current_path || '/');
    } finally {
      setBusy('');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadFiles = async (files: FileList | null) => {
    const pvc = requireSelectedPvc();
    if (!files || files.length === 0) return;
    setBusy('upload');
    try {
      for (const file of Array.from(files)) {
        await api.resources.uploadPvcBrowserFile(pvc.id, currentDirectory?.current_path || '/', file);
      }
      await refreshBrowser(pvc.id, currentDirectory?.current_path || '/');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setBusy('');
    }
  };

  const handleRenameNode = async (node: PvcBrowserNode) => {
    const pvc = requireSelectedPvc();
    const targetName = await askCurrentDirectoryName('重命名', node.name);
    if (!targetName || targetName === node.name) return;
    setBusy(`rename:${node.path}`);
    try {
      await api.resources.renamePvcBrowserNode(pvc.id, node.path, targetName);
      await refreshBrowser(
        pvc.id,
        currentDirectory?.current_path || '/',
        previewNode?.path === node.path ? joinPath(getParentPath(node.path), targetName) : previewNode?.path
      );
    } finally {
      setBusy('');
    }
  };

  const handleMoveNode = async (node: PvcBrowserNode) => {
    const pvc = requireSelectedPvc();
    const targetPath = await showPrompt({
      title: '移动节点',
      message: '请输入目标目录路径，例如 `/reports/2026`。',
      defaultValue: currentDirectory?.current_path || '/',
      placeholder: '/target/path',
      confirmText: '确认移动',
      cancelText: '取消',
    });
    const normalized = (targetPath || '').trim();
    if (!normalized) return;
    setBusy(`move:${node.path}`);
    try {
      await api.resources.movePvcBrowserNode(pvc.id, node.path, normalized);
      await refreshBrowser(pvc.id, currentDirectory?.current_path || '/');
      if (previewNode?.path === node.path) {
        setPreviewNode(null);
        setPreview({ mode: 'empty' });
      }
    } finally {
      setBusy('');
    }
  };

  const handleDeleteNode = async (node: PvcBrowserNode) => {
    const pvc = requireSelectedPvc();
    const confirmed = await showConfirm({
      title: '删除节点',
      message: `确认删除 ${node.node_type === 'directory' ? '目录' : '文件'} "${node.name}" 吗？`,
      confirmText: '确认删除',
      cancelText: '取消',
      danger: true,
    });
    if (!confirmed) return;
    setBusy(`delete:${node.path}`);
    try {
      await api.resources.deletePvcBrowserNode(pvc.id, node.path);
      await refreshBrowser(pvc.id, currentDirectory?.current_path || '/');
      if (previewNode?.path === node.path) {
        setPreviewNode(null);
        setPreview({ mode: 'empty' });
      }
    } finally {
      setBusy('');
    }
  };

  const handleDownloadNode = async (node: PvcBrowserNode) => {
    const pvc = requireSelectedPvc();
    setBusy(`download:${node.path}`);
    try {
      const blob = await api.resources.fetchPvcBrowserDownloadBlob(pvc.id, node.path);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = node.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy('');
    }
  };

  const renderTreeNode = (node: PvcBrowserNode, depth = 0): React.ReactNode => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedNodePath === node.path;
    const isDirectory = node.node_type === 'directory';
    return (
      <div key={node.path}>
        <button
          onClick={() => void onTreeClick(node)}
          className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-all ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100 text-slate-700'}`}
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          <ChevronRight size={14} className={`transition-transform ${isDirectory && isExpanded ? 'rotate-90' : ''} ${!isDirectory ? 'opacity-0' : ''}`} />
          {isDirectory ? (isExpanded ? <FolderOpen size={16} className="text-amber-500" /> : <Folder size={16} className="text-amber-500" />) : <File size={16} className="text-slate-400" />}
          <span className="truncate text-sm font-semibold">{node.name}</span>
        </button>
        {isDirectory && isExpanded && node.children && node.children.length > 0 && (
          <div className="space-y-1">{node.children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const renderNodeIcon = (node: PvcBrowserNode) => {
    if (node.node_type === 'directory') return <Folder size={18} className="text-amber-500" />;
    const mode = inferPreviewMode(node, node.content_type);
    if (mode === 'image') return <FileImage size={18} className="text-pink-500" />;
    if (mode === 'audio') return <Music size={18} className="text-emerald-500" />;
    if (mode === 'video') return <Video size={18} className="text-violet-500" />;
    if (mode === 'text') return <FileCode size={18} className="text-sky-500" />;
    return <FileText size={18} className="text-slate-400" />;
  };

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-[1.5rem] bg-slate-900 p-3 text-white shadow-lg shadow-slate-900/15">
                <HardDrive size={26} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">PVC 管理</h1>
                <p className="mt-1 text-sm font-medium text-slate-500">统一管理输出 PVC 与其中的在线文件内容。</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => void loadPvcList()} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20">
              <Plus size={16} />
              创建 PVC
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/15">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">PVC 总量</div>
            <div className="mt-4 text-5xl font-black">{stats.totalCount}</div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">活跃挂载</div>
            <div className="mt-4 text-4xl font-black text-slate-900">{stats.activeCount}</div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">容量合计</div>
            <div className="mt-4 text-4xl font-black text-slate-900">{stats.totalSizeGi} Gi</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(360px,1fr)_420px]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索 PVC..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:border-blue-300"
              />
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="flex min-h-[240px] items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" size={28} />
                </div>
              ) : filteredPvcs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-400">当前项目暂无 PVC</div>
              ) : (
                filteredPvcs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => void selectPvc(item.id)}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition-all ${selectedPvcId === item.id ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900">{item.name}</div>
                        <div className="mt-1 truncate font-mono text-[11px] text-slate-500">{item.pvc_name}</div>
                      </div>
                      <StatusBadge status={item.pvc_k8s_status?.status || 'Unknown'} />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{item.pvc_size}</span>
                      <span className={item.in_use ? 'text-amber-600' : 'text-emerald-600'}>{item.in_use ? 'Mounted' : 'Idle'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedPvc ? (
              <div className="flex min-h-[560px] items-center justify-center text-center text-sm font-semibold text-slate-400">选择一个 PVC 后开始浏览文件内容。</div>
            ) : (
              <div className="flex h-full min-h-[560px] flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">当前 PVC</div>
                    <div className="mt-2 text-xl font-black text-slate-900">{selectedPvc.name}</div>
                    <div className="mt-1 font-mono text-[11px] text-slate-500">{selectedPvc.pvc_name}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => void refreshBrowser(selectedPvc.id)} className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 shadow-sm">
                      <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={() => void handleCreateDirectory()} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm">新建目录</button>
                    <button onClick={handleUploadClick} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/10">
                      <Upload size={16} />
                      上传
                    </button>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => void handleUploadFiles(event.target.files)} />
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                    <div className="border-b border-slate-200 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">目录树</div>
                    <div className="max-h-[430px] space-y-1 overflow-y-auto p-3 custom-scrollbar">
                      <button
                        onClick={() => void openDirectory('/')}
                        className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left ${selectedNodePath === '/' ? 'bg-blue-50 text-blue-700' : 'hover:bg-white text-slate-700'}`}
                      >
                        <Database size={16} className="text-blue-600" />
                        <span className="text-sm font-semibold">/</span>
                      </button>
                      {browserTree.map((node) => renderTreeNode(node))}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                    <div className="border-b border-slate-200 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                        {(currentDirectory?.breadcrumbs || [{ path: '/', name: '/' }]).map((item) => (
                          <button key={item.path} onClick={() => void openDirectory(item.path)} className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-slate-200">
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="max-h-[430px] overflow-y-auto custom-scrollbar">
                      <table className="w-full">
                        <thead className="bg-slate-50 text-left text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3">名称</th>
                            <th className="px-4 py-3">大小</th>
                            <th className="px-4 py-3">更新时间</th>
                            <th className="px-4 py-3 text-right">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...(currentDirectory?.directories || []), ...(currentDirectory?.files || [])].map((node) => (
                            <tr key={node.path} className="hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <button onClick={() => void onTreeClick(node)} className="flex items-center gap-3 text-left">
                                  {renderNodeIcon(node)}
                                  <div>
                                    <div className="text-sm font-black text-slate-900">{node.name}</div>
                                    <div className="font-mono text-[11px] text-slate-400">{node.path}</div>
                                  </div>
                                </button>
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">{node.node_type === 'directory' ? '-' : formatBytes(node.size)}</td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-500">{node.updated_at ? new Date(node.updated_at * 1000).toLocaleString() : '-'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  {node.node_type === 'file' && (
                                    <button onClick={() => void handleDownloadNode(node)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-slate-900">
                                      <Download size={14} />
                                    </button>
                                  )}
                                  <button onClick={() => void handleRenameNode(node)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-slate-900">
                                    <Pencil size={14} />
                                  </button>
                                  <button onClick={() => void handleMoveNode(node)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-slate-900">
                                    <ChevronRight size={14} />
                                  </button>
                                  <button onClick={() => void handleDeleteNode(node)} className="rounded-xl border border-rose-100 bg-rose-50 p-2 text-rose-500 hover:text-rose-700">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {(!currentDirectory || ((currentDirectory.directories.length + currentDirectory.files.length) === 0)) && (
                            <tr>
                              <td colSpan={4} className="px-4 py-16 text-center text-sm font-semibold text-slate-400">当前目录为空。</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedPvcDetail ? (
              <div className="flex min-h-[560px] items-center justify-center text-center text-sm font-semibold text-slate-400">右侧会显示 PVC 元信息与文件预览。</div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">PVC 元信息</div>
                      <div className="mt-2 text-xl font-black text-slate-900">{selectedPvcDetail.name}</div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500">{selectedPvcDetail.pvc_name}</div>
                    </div>
                    <button onClick={() => void handleDeletePvc(selectedPvcDetail)} className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black text-rose-600">
                      删除 PVC
                    </button>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-slate-400">容量</div>
                      <div className="mt-1 font-black text-slate-900">{selectedPvcDetail.pvc_size}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">挂载状态</div>
                      <div className="mt-1 font-black text-slate-900">{selectedPvcDetail.in_use ? '使用中' : '空闲'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">StorageClass</div>
                      <div className="mt-1 font-black text-slate-900">{selectedPvcDetail.pvc_k8s_status?.storage_class || '-'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">K8S 状态</div>
                      <div className="mt-1"><StatusBadge status={selectedPvcDetail.pvc_k8s_status?.status || 'Unknown'} /></div>
                    </div>
                  </div>
                  {selectedPvcDetail.use_message && (
                    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">{selectedPvcDetail.use_message}</div>
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-5 py-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">文件预览</div>
                    <div className="mt-2 text-sm font-black text-slate-900">{previewNode?.name || '未选择文件'}</div>
                  </div>
                  <div className="min-h-[320px] p-5">
                    {preview.mode === 'empty' ? (
                      <div className="flex min-h-[280px] items-center justify-center text-center text-sm font-semibold text-slate-400">选择一个文件即可在这里预览内容。</div>
                    ) : preview.mode === 'text' ? (
                      <div className="space-y-3">
                        {preview.truncated && (
                          <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">文本预览已截断，仅显示前 1 MiB 内容。</div>
                        )}
                        <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950 p-4 text-[12px] leading-6 text-slate-100 custom-scrollbar">{preview.text}</pre>
                      </div>
                    ) : preview.mode === 'image' ? (
                      <img src={preview.url} alt={previewNode?.name} className="max-h-[360px] w-full rounded-2xl object-contain bg-slate-50" />
                    ) : preview.mode === 'pdf' ? (
                      <iframe src={preview.url} title={previewNode?.name} className="h-[360px] w-full rounded-2xl border border-slate-200" />
                    ) : preview.mode === 'audio' ? (
                      <audio controls src={preview.url} className="w-full" />
                    ) : preview.mode === 'video' ? (
                      <video controls src={preview.url} className="max-h-[360px] w-full rounded-2xl bg-slate-950" />
                    ) : (
                      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
                        <FileAudio size={42} className="text-slate-300" />
                        <div className="text-sm font-semibold text-slate-500">当前文件不支持在线预览，请直接下载查看。</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-2xl">
            <div className="text-2xl font-black text-slate-900">创建 PVC</div>
            <p className="mt-2 text-sm font-medium text-slate-500">为当前项目分配新的输出持久化存储。</p>
            <form onSubmit={handleCreatePvc} className="mt-6 space-y-5">
              <input value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="PVC 名称" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
              <textarea value={createForm.description} onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="用途说明" rows={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none" />
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  <span>容量</span>
                  <span>{createForm.pvc_size} Gi</span>
                </div>
                <input type="range" min="1" max="100" value={createForm.pvc_size} onChange={(e) => setCreateForm((prev) => ({ ...prev, pvc_size: Number.parseInt(e.target.value, 10) }))} className="w-full accent-blue-600" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700">取消</button>
                <button type="submit" disabled={createLoading} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">
                  {createLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {busy && (
        <div className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-xl shadow-slate-900/20">
          <Loader2 size={16} className="animate-spin" />
          正在处理请求
        </div>
      )}
    </div>
  );
};
