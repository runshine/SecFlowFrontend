import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FolderTree,
  FileText,
  File,
  Image as ImageIcon,
  Music,
  Video,
  FileCode,
  RefreshCw,
  Upload,
  FolderPlus,
  Download,
  Pencil,
  Trash2,
  HardDrive,
  Search,
  X,
} from 'lucide-react';
import {
  DirectoryChildrenResponse,
  ExplorerBreadcrumbItem,
  FileExplorerNode,
  ManagedFile,
  SecurityProject,
} from '../../types/types';
import { api } from '../../api/api';

type ExplorerNodeType = 'project' | 'subproject' | 'directory' | 'file';

interface ExplorerSelection {
  nodeType: ExplorerNodeType;
  subprojectId?: number | null;
  directoryId?: number | null;
  fileId?: number | null;
  name: string;
}

interface PreviewState {
  mode: 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary' | 'empty';
  contentType?: string;
  text?: string;
  url?: string;
  size?: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  node: FileExplorerNode | null;
}

const TEXT_EXTENSIONS = new Set(['txt', 'json', 'yaml', 'yml', 'md', 'log', 'xml', 'csv', 'js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'sh', 'sql']);

const createProjectRootNode = (projectId: string, projectName: string): FileExplorerNode => ({
  node_type: 'project',
  id: `project:${projectId}`,
  name: projectName || projectId,
  project_id: projectId,
  has_children: true,
  children: [],
});

const sortNodes = (nodes: FileExplorerNode[]) => {
  return [...nodes].sort((a, b) => {
    const order = (node: FileExplorerNode) => {
      if (node.node_type === 'subproject') return 0;
      if (node.node_type === 'directory') return 1;
      return 2;
    };
    return order(a) - order(b) || a.name.localeCompare(b.name, 'zh-CN');
  });
};

const replaceNodeChildren = (nodes: FileExplorerNode[], targetId: string, children: FileExplorerNode[]): FileExplorerNode[] => {
  return nodes.map((node) => {
    if (node.id === targetId) {
      return { ...node, children: sortNodes(children), has_children: children.length > 0 || node.has_children };
    }
    if (node.children && node.children.length > 0) {
      return { ...node, children: replaceNodeChildren(node.children, targetId, children) };
    }
    return node;
  });
};

const flattenNode = (node: FileExplorerNode, map: Record<string, FileExplorerNode>) => {
  map[node.id] = node;
  (node.children || []).forEach((child) => flattenNode(child, map));
};

const collectNodeMap = (root: FileExplorerNode) => {
  const map: Record<string, FileExplorerNode> = {};
  flattenNode(root, map);
  return map;
};

const toDirectoryNode = (directory: DirectoryChildrenResponse['directories'][number]): FileExplorerNode => ({
  node_type: 'directory',
  id: `directory:${directory.id}`,
  name: directory.name,
  project_id: directory.project_id,
  subproject_id: directory.subproject_id,
  directory_id: directory.id,
  parent_directory_id: directory.parent_id ?? null,
  path_key: directory.path_key,
  updated_at: directory.updated_at,
  has_children: true,
  children: [],
});

const toFileNode = (file: ManagedFile): FileExplorerNode => ({
  node_type: 'file',
  id: `file:${file.id}`,
  name: file.filename,
  project_id: file.project_id,
  subproject_id: file.subproject_id,
  directory_id: file.directory_id ?? null,
  file_id: file.id,
  parent_directory_id: file.directory_id ?? null,
  path_key: file.storage_key,
  content_type: file.content_type,
  size: file.size,
  updated_at: file.updated_at,
  has_children: false,
  children: [],
});

const inferPreviewMode = (file: ManagedFile, blob: Blob): PreviewState['mode'] => {
  const contentType = blob.type || file.content_type || '';
  if (contentType.startsWith('text/') || contentType === 'application/json' || contentType === 'application/xml' || contentType === 'application/javascript') {
    return 'text';
  }
  if (contentType.startsWith('image/')) return 'image';
  if (contentType === 'application/pdf') return 'pdf';
  if (contentType.startsWith('audio/')) return 'audio';
  if (contentType.startsWith('video/')) return 'video';
  const extension = file.filename.includes('.') ? file.filename.split('.').pop()!.toLowerCase() : '';
  if (TEXT_EXTENSIONS.has(extension)) return 'text';
  return 'binary';
};

export const ProjectFileExplorerPage: React.FC<{ projectId: string; projects: SecurityProject[] }> = ({ projectId, projects }) => {
  const projectName = projects.find((item) => item.id === projectId)?.name || projectId;
  const [rootNode, setRootNode] = useState<FileExplorerNode>(createProjectRootNode(projectId, projectName));
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([`project:${projectId}`]));
  const [selected, setSelected] = useState<ExplorerSelection | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<DirectoryChildrenResponse | null>(null);
  const [previewFile, setPreviewFile] = useState<ManagedFile | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ mode: 'empty' });
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dragHoverNodeId, setDragHoverNodeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<{ subprojectId: number; directoryId: number | null } | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const nodeMap = useMemo(() => collectNodeMap(rootNode), [rootNode]);

  useEffect(() => {
    void initialize();
  }, [projectId, projectName]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const initialize = async () => {
    setLoading(true);
    try {
      const root = await api.fileserver.getRoot(projectId);
      const projectRoot = createProjectRootNode(projectId, projectName || root.root_name);
      projectRoot.children = sortNodes(root.items);
      setRootNode(projectRoot);
      setExpandedNodes(new Set([projectRoot.id]));
      if (root.items[0]) {
        await openNode(root.items[0]);
      } else {
        setSelected({ nodeType: 'project', name: projectRoot.name });
        setCurrentDirectory(null);
        setPreviewFile(null);
        setPreview({ mode: 'empty' });
      }
    } catch (error: any) {
      alert(error?.message || '加载项目文件资源失败');
    } finally {
      setLoading(false);
    }
  };

  const resolveSelectionTarget = (node: FileExplorerNode | null): { subprojectId: number; directoryId: number | null } | null => {
    if (!node) return null;
    if (node.node_type === 'subproject') {
      return { subprojectId: node.subproject_id || 0, directoryId: null };
    }
    if (node.node_type === 'directory') {
      return { subprojectId: node.subproject_id || 0, directoryId: node.directory_id || null };
    }
    if (node.node_type === 'file') {
      return { subprojectId: node.subproject_id || 0, directoryId: node.directory_id || null };
    }
    return null;
  };

  const refreshCurrentView = async () => {
    const root = await api.fileserver.getRoot(projectId);
    const projectRoot = createProjectRootNode(projectId, projectName || root.root_name);
    projectRoot.children = sortNodes(root.items);
    setRootNode(projectRoot);
    if (!selected) {
      return;
    }
    if (selected.nodeType === 'project') {
      setSelected({ nodeType: 'project', name: projectRoot.name });
      setCurrentDirectory(null);
      setPreviewFile(null);
      setPreview({ mode: 'empty' });
      return;
    }
    if (selected.nodeType === 'subproject' && selected.subprojectId) {
      const node = root.items.find((item) => item.subproject_id === selected.subprojectId);
      if (node) await openNode(node);
      return;
    }
    if (selected.nodeType === 'directory' && selected.directoryId) {
      const payload = await api.fileserver.getDirectoryChildren(projectId, selected.directoryId);
      const target = nodeMap[`directory:${selected.directoryId}`] || {
        node_type: 'directory' as const,
        id: `directory:${selected.directoryId}`,
        name: payload.current_name,
        project_id: projectId,
        subproject_id: payload.subproject_id,
        directory_id: selected.directoryId,
        has_children: true,
      };
      await openNode(target);
      return;
    }
    if (selected.nodeType === 'file' && selected.fileId) {
      const file = currentDirectory?.files.find((item) => item.id === selected.fileId);
      if (file) {
        await openNode(toFileNode(file));
      }
    }
  };

  const updateNodeBranch = async (node: FileExplorerNode) => {
    if (node.node_type === 'subproject' && node.subproject_id) {
      const payload = await api.fileserver.getSubprojectChildren(projectId, node.subproject_id);
      const children = payload.directories.map(toDirectoryNode).concat(payload.files.map(toFileNode));
      setRootNode((prev) => replaceNodeChildren([prev], node.id, children)[0]);
      return payload;
    }
    if (node.node_type === 'directory' && node.directory_id) {
      const payload = await api.fileserver.getDirectoryChildren(projectId, node.directory_id);
      const children = payload.directories.map(toDirectoryNode).concat(payload.files.map(toFileNode));
      setRootNode((prev) => replaceNodeChildren([prev], node.id, children)[0]);
      return payload;
    }
    return null;
  };

  const loadPreview = async (file: ManagedFile) => {
    setBusyAction(`preview:${file.id}`);
    try {
      const blob = await api.fileserver.fetchPreviewBlob(file.id);
      const mode = inferPreviewMode(file, blob);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      if (mode === 'text') {
        const text = await blob.text();
        setPreview({ mode, text, contentType: blob.type || file.content_type || '', size: file.size });
      } else if (mode === 'binary') {
        setPreview({ mode, contentType: blob.type || file.content_type || '', size: file.size });
      } else {
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreview({ mode, url, contentType: blob.type || file.content_type || '', size: file.size });
      }
    } catch (error: any) {
      alert(error?.message || '加载文件预览失败');
      setPreview({ mode: 'binary', size: file.size, contentType: file.content_type || '' });
    } finally {
      setBusyAction('');
    }
  };

  const openNode = async (node: FileExplorerNode) => {
    setSelected({
      nodeType: node.node_type,
      subprojectId: node.subproject_id ?? null,
      directoryId: node.directory_id ?? null,
      fileId: node.file_id ?? null,
      name: node.name,
    });
    setContextMenu(null);

    if (node.node_type === 'project') {
      setCurrentDirectory(null);
      setPreviewFile(null);
      setPreview({ mode: 'empty' });
      return;
    }

    if (node.node_type === 'subproject') {
      const payload = await updateNodeBranch(node);
      setExpandedNodes((prev) => new Set(prev).add(node.id));
      if (payload) {
        setCurrentDirectory(payload);
        setPreviewFile(null);
        setPreview({ mode: 'empty' });
      }
      return;
    }

    if (node.node_type === 'directory') {
      const payload = await updateNodeBranch(node);
      setExpandedNodes((prev) => new Set(prev).add(node.id));
      if (payload) {
        setCurrentDirectory(payload);
        setPreviewFile(null);
        setPreview({ mode: 'empty' });
      }
      return;
    }

    if (node.node_type === 'file' && node.file_id) {
      const parentPayload = node.directory_id
        ? await api.fileserver.getDirectoryChildren(projectId, node.directory_id)
        : await api.fileserver.getSubprojectChildren(projectId, node.subproject_id || 0);
      setCurrentDirectory(parentPayload);
      const file = parentPayload.files.find((item) => item.id === node.file_id);
      if (file) {
        setPreviewFile(file);
        await loadPreview(file);
      }
    }
  };

  const toggleNode = async (node: FileExplorerNode) => {
    if (node.node_type === 'file') {
      await openNode(node);
      return;
    }
    if (expandedNodes.has(node.id)) {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        next.delete(node.id);
        return next;
      });
      return;
    }
    await openNode(node);
  };

  const askName = (title: string, currentValue = '') => {
    const value = window.prompt(title, currentValue);
    return value === null ? null : value.trim();
  };

  const handleCreateSubproject = async () => {
    const name = askName('请输入子项目名称');
    if (!name) return;
    setBusyAction('create-subproject');
    try {
      await api.fileserver.createSubproject({ project_id: projectId, name });
      await refreshCurrentView();
    } catch (error: any) {
      alert(error?.message || '创建子项目失败');
    } finally {
      setBusyAction('');
    }
  };

  const handleCreateDirectory = async (node?: FileExplorerNode | null) => {
    const targetNode = node || (selected ? nodeMap[`${selected.nodeType}:${selected.nodeType === 'subproject' ? selected.subprojectId : selected.nodeType === 'directory' ? selected.directoryId : selected.fileId}`] : null);
    const target = resolveSelectionTarget(targetNode || null);
    if (!target) {
      alert('请先选择子项目或目录');
      return;
    }
    const name = askName('请输入文件夹名称');
    if (!name) return;
    setBusyAction('create-directory');
    try {
      await api.fileserver.createDirectory({
        project_id: projectId,
        subproject_id: target.subprojectId,
        parent_id: target.directoryId,
        name,
      });
      await refreshCurrentView();
    } catch (error: any) {
      alert(error?.message || '创建目录失败');
    } finally {
      setBusyAction('');
    }
  };

  const handleRename = async (node: FileExplorerNode) => {
    const name = askName('请输入新的名称', node.name);
    if (!name || name === node.name) return;
    setBusyAction(`rename:${node.id}`);
    try {
      if (node.node_type === 'subproject' && node.subproject_id) {
        await api.fileserver.renameSubproject(projectId, node.subproject_id, { name });
      } else if (node.node_type === 'directory' && node.directory_id) {
        await api.fileserver.renameDirectory(node.directory_id, name);
      } else if (node.node_type === 'file' && node.file_id) {
        await api.fileserver.renameFile(node.file_id, name);
      }
      await refreshCurrentView();
    } catch (error: any) {
      alert(error?.message || '重命名失败');
    } finally {
      setBusyAction('');
    }
  };

  const handleDelete = async (node: FileExplorerNode) => {
    const confirmed = window.confirm(`确认永久删除 ${node.name} 吗？该操作不可恢复。`);
    if (!confirmed) return;
    setBusyAction(`delete:${node.id}`);
    try {
      if (node.node_type === 'subproject' && node.subproject_id) {
        await api.fileserver.deleteSubproject(projectId, node.subproject_id, true);
      } else if (node.node_type === 'directory' && node.directory_id) {
        await api.fileserver.deleteDirectory(projectId, node.directory_id, true);
      } else if (node.node_type === 'file' && node.file_id) {
        await api.fileserver.deleteFile(node.file_id);
      }
      await refreshCurrentView();
    } catch (error: any) {
      alert(error?.message || '删除失败');
    } finally {
      setBusyAction('');
    }
  };

  const triggerUpload = (targetNode: FileExplorerNode | null) => {
    const target = resolveSelectionTarget(targetNode);
    if (!target) {
      alert('请先选择子项目或目录');
      return;
    }
    uploadTargetRef.current = target;
    fileInputRef.current?.click();
  };

  const uploadFiles = async (files: FileList | File[], target: { subprojectId: number; directoryId: number | null }) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setBusyAction('upload');
    try {
      for (const file of list) {
        await api.fileserver.uploadFile({
          project_id: projectId,
          subproject_id: target.subprojectId,
          directory_id: target.directoryId,
          file,
        });
      }
      await refreshCurrentView();
    } catch (error: any) {
      alert(error?.message || '上传失败');
    } finally {
      setBusyAction('');
    }
  };

  const handleDownload = async (file: ManagedFile) => {
    setBusyAction(`download:${file.id}`);
    try {
      const blob = await api.fileserver.fetchDownloadBlob(file.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error?.message || '下载失败');
    } finally {
      setBusyAction('');
    }
  };

  const handleNodeDrop = async (dragNodeId: string, targetNode: FileExplorerNode) => {
    const dragNode = nodeMap[dragNodeId];
    if (!dragNode || dragNode.id === targetNode.id) return;
    if (dragNode.node_type === 'subproject') {
      alert('子项目不支持拖拽移动');
      return;
    }
    setBusyAction(`move:${dragNode.id}`);
    try {
      if (dragNode.node_type === 'file' && dragNode.file_id) {
        if ((targetNode.node_type === 'subproject' || targetNode.node_type === 'directory') && dragNode.subproject_id === targetNode.subproject_id) {
          const targetDirectoryId = targetNode.node_type === 'directory' ? targetNode.directory_id || null : null;
          await api.fileserver.moveFile(dragNode.file_id, targetDirectoryId);
        } else {
          throw new Error('暂不支持跨子项目移动文件');
        }
      }
      if (dragNode.node_type === 'directory' && dragNode.directory_id) {
        if ((targetNode.node_type === 'subproject' || targetNode.node_type === 'directory') && dragNode.subproject_id === targetNode.subproject_id) {
          const targetParentId = targetNode.node_type === 'directory' ? targetNode.directory_id || null : null;
          await api.fileserver.moveDirectory(dragNode.directory_id, targetParentId);
        } else {
          throw new Error('暂不支持跨子项目移动目录');
        }
      }
      await refreshCurrentView();
    } catch (error: any) {
      alert(error?.message || '移动失败');
    } finally {
      setBusyAction('');
      setDragHoverNodeId(null);
    }
  };

  const currentItems = useMemo(() => {
    if (!currentDirectory) return [];
    const directoryNodes = currentDirectory.directories.map(toDirectoryNode);
    const fileNodes = currentDirectory.files.map(toFileNode);
    return sortNodes(directoryNodes.concat(fileNodes));
  }, [currentDirectory]);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return currentItems;
    return currentItems.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [currentItems, searchTerm]);

  const renderNodeIcon = (node: FileExplorerNode, expanded: boolean) => {
    if (node.node_type === 'subproject') return expanded ? <HardDrive size={14} className="text-sky-500" /> : <HardDrive size={14} className="text-sky-500" />;
    if (node.node_type === 'directory') return expanded ? <FolderOpen size={14} className="text-amber-500" /> : <Folder size={14} className="text-amber-500" />;
    const type = node.content_type || '';
    if (type.startsWith('image/')) return <ImageIcon size={14} className="text-emerald-500" />;
    if (type.startsWith('audio/')) return <Music size={14} className="text-pink-500" />;
    if (type.startsWith('video/')) return <Video size={14} className="text-violet-500" />;
    const extension = node.name.includes('.') ? node.name.split('.').pop()!.toLowerCase() : '';
    if (TEXT_EXTENSIONS.has(extension)) return <FileCode size={14} className="text-blue-500" />;
    return <File size={14} className="text-slate-400" />;
  };

  const renderTree = (node: FileExplorerNode, depth = 0): React.ReactNode => {
    const expanded = expandedNodes.has(node.id);
    const active = selected?.nodeType === node.node_type &&
      ((node.node_type === 'subproject' && selected.subprojectId === node.subproject_id) ||
       (node.node_type === 'directory' && selected.directoryId === node.directory_id) ||
       (node.node_type === 'file' && selected.fileId === node.file_id) ||
       (node.node_type === 'project' && selected.nodeType === 'project'));

    return (
      <div key={node.id}>
        <div
          data-tree-node="true"
          className={`group flex items-center gap-1 rounded-md px-2 py-1 text-[12px] leading-5 cursor-pointer ${
            active ? 'bg-sky-100 text-sky-900' : dragHoverNodeId === node.id ? 'bg-amber-100' : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          draggable={node.node_type !== 'project'}
          onDragStart={(event) => {
            event.dataTransfer.setData('application/secflow-node', node.id);
            event.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(event) => {
            if (node.node_type === 'subproject' || node.node_type === 'directory') {
              event.preventDefault();
              setDragHoverNodeId(node.id);
            }
          }}
          onDragLeave={() => setDragHoverNodeId((prev) => (prev === node.id ? null : prev))}
          onDrop={async (event) => {
            event.preventDefault();
            const nodeId = event.dataTransfer.getData('application/secflow-node');
            setDragHoverNodeId(null);
            if (nodeId) {
              await handleNodeDrop(nodeId, node);
              return;
            }
            const files = event.dataTransfer.files;
            const target = resolveSelectionTarget(node);
            if (target && files && files.length > 0) {
              await uploadFiles(files, target);
            }
          }}
          onClick={() => void openNode(node)}
          onDoubleClick={() => void toggleNode(node)}
          onContextMenu={(event) => {
            event.preventDefault();
            setContextMenu({ x: event.clientX, y: event.clientY, node });
          }}
        >
          <button
            type="button"
            className="flex h-4 w-4 items-center justify-center rounded hover:bg-white/70"
            onClick={(event) => {
              event.stopPropagation();
              void toggleNode(node);
            }}
          >
            {(node.node_type === 'project' || node.node_type === 'subproject' || node.node_type === 'directory') ? (
              <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
            ) : <span className="w-3" />}
          </button>
          {renderNodeIcon(node, expanded)}
          <span className="truncate flex-1">{node.name}</span>
          {node.special_badge && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[9px] font-black text-sky-700">{node.special_badge}</span>}
        </div>
        {expanded && node.children && node.children.length > 0 && (
          <div>{node.children.map((child) => renderTree(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!previewFile) {
      return (
        <div className="flex h-full items-center justify-center text-slate-400">
          选择一个文件以预览内容
        </div>
      );
    }
    if (busyAction.startsWith('preview:')) {
      return <div className="flex h-full items-center justify-center text-slate-500">正在加载预览...</div>;
    }
    if (preview.mode === 'text') {
      return <pre className="h-full overflow-auto rounded-2xl bg-slate-950 p-5 text-[12px] text-slate-100 whitespace-pre-wrap">{preview.text || ''}</pre>;
    }
    if (preview.mode === 'image' && preview.url) {
      return <div className="flex h-full items-center justify-center"><img src={preview.url} alt={previewFile.filename} className="max-h-full max-w-full rounded-xl shadow-xl" /></div>;
    }
    if (preview.mode === 'pdf' && preview.url) {
      return <iframe src={preview.url} title={previewFile.filename} className="h-full w-full rounded-2xl border border-slate-200 bg-white" />;
    }
    if (preview.mode === 'audio' && preview.url) {
      return <div className="flex h-full items-center justify-center"><audio controls src={preview.url} className="w-full max-w-xl" /></div>;
    }
    if (preview.mode === 'video' && preview.url) {
      return <div className="flex h-full items-center justify-center"><video controls src={preview.url} className="max-h-full max-w-full rounded-xl shadow-xl" /></div>;
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
        <FileText size={36} className="text-slate-300" />
        <div className="text-sm font-bold">该文件类型暂不支持内嵌预览</div>
        <div className="text-xs text-slate-400">文件类型：{preview.contentType || previewFile.content_type || 'unknown'}</div>
        <button
          type="button"
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"
          onClick={() => void handleDownload(previewFile)}
        >
          下载文件
        </button>
      </div>
    );
  };

  const renderContextMenu = () => {
    if (!contextMenu) return null;
    const node = contextMenu.node;
    const actions: Array<{ label: string; icon: React.ReactNode; onClick: () => void }> = [];
    if (!node || node.node_type === 'project') {
      actions.push(
        { label: '刷新', icon: <RefreshCw size={14} />, onClick: () => void refreshCurrentView() },
        { label: '新建子项目', icon: <HardDrive size={14} />, onClick: () => void handleCreateSubproject() },
      );
    } else if (node.node_type === 'subproject' || node.node_type === 'directory') {
      actions.push(
        { label: '打开', icon: <FolderOpen size={14} />, onClick: () => void openNode(node) },
        { label: '新建文件夹', icon: <FolderPlus size={14} />, onClick: () => void handleCreateDirectory(node) },
        { label: '上传文件', icon: <Upload size={14} />, onClick: () => triggerUpload(node) },
        { label: '重命名', icon: <Pencil size={14} />, onClick: () => void handleRename(node) },
        { label: '删除', icon: <Trash2 size={14} />, onClick: () => void handleDelete(node) },
      );
    } else if (node.node_type === 'file' && node.file_id) {
      const file = currentDirectory?.files.find((item) => item.id === node.file_id) || previewFile;
      actions.push(
        { label: '打开预览', icon: <FileText size={14} />, onClick: () => void openNode(node) },
        ...(file ? [{ label: '下载', icon: <Download size={14} />, onClick: () => void handleDownload(file) }] : []),
        { label: '重命名', icon: <Pencil size={14} />, onClick: () => void handleRename(node) },
        { label: '删除', icon: <Trash2 size={14} />, onClick: () => void handleDelete(node) },
      );
    }
    return (
      <div
        className="fixed z-50 min-w-[180px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100"
            onClick={() => {
              setContextMenu(null);
              action.onClick();
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.08),_transparent_26%),linear-gradient(180deg,#f8fbff_0%,#f1f5f9_100%)] p-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={async (event) => {
          if (event.target.files && uploadTargetRef.current) {
            await uploadFiles(event.target.files, uploadTargetRef.current);
            event.target.value = '';
          }
        }}
      />
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 px-6 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.35em] text-sky-600">Project File Explorer</div>
              <h2 className="mt-2 text-3xl font-black text-slate-900">项目文件资源管理</h2>
              <p className="mt-1 text-sm text-slate-500">{projectName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <Search size={14} className="text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="搜索当前目录"
                  className="w-44 bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
                {searchTerm && (
                  <button type="button" onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-700">
                    <X size={12} />
                  </button>
                )}
              </div>
              <button type="button" onClick={() => void refreshCurrentView()} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700">
                <span className="inline-flex items-center gap-2"><RefreshCw size={14} /> 刷新</span>
              </button>
              <button type="button" onClick={() => void handleCreateSubproject()} className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black text-sky-700">
                <span className="inline-flex items-center gap-2"><HardDrive size={14} /> 新建子项目</span>
              </button>
              <button type="button" onClick={() => void handleCreateDirectory()} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
                <span className="inline-flex items-center gap-2"><FolderPlus size={14} /> 新建文件夹</span>
              </button>
              <button type="button" onClick={() => triggerUpload(selected ? nodeMap[`${selected.nodeType}:${selected.nodeType === 'subproject' ? selected.subprojectId : selected.nodeType === 'directory' ? selected.directoryId : selected.fileId}`] || null : null)} className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black text-white">
                <span className="inline-flex items-center gap-2"><Upload size={14} /> 上传文件</span>
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
            {(currentDirectory?.breadcrumbs || [{ id: `project:${projectId}`, name: projectName, node_type: 'project' } as ExplorerBreadcrumbItem]).map((item, index, array) => (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 hover:bg-slate-100"
                  onClick={() => {
                    if (item.node_type === 'project') {
                      setSelected({ nodeType: 'project', name: projectName });
                      setCurrentDirectory(null);
                      setPreviewFile(null);
                      setPreview({ mode: 'empty' });
                    } else if (item.node_type === 'subproject' && item.subproject_id) {
                      const node = nodeMap[`subproject:${item.subproject_id}`];
                      if (node) void openNode(node);
                    } else if (item.node_type === 'directory' && item.directory_id) {
                      const node = nodeMap[`directory:${item.directory_id}`];
                      if (node) void openNode(node);
                    }
                  }}
                >
                  {item.name}
                </button>
                {index < array.length - 1 && <ChevronRight size={12} className="text-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[320px_minmax(0,1fr)] gap-4">
          <div
            className="min-h-0 overflow-auto rounded-[2rem] border border-white/70 bg-white/90 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            onContextMenu={(event) => {
              if ((event.target as HTMLElement).closest('[data-tree-node]')) return;
              event.preventDefault();
              setContextMenu({ x: event.clientX, y: event.clientY, node: null });
            }}
          >
            <div className="mb-3 flex items-center gap-2 px-2 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
              <FolderTree size={14} />
              文件树
            </div>
            {loading ? (
              <div className="px-3 py-6 text-sm text-slate-400">正在加载目录结构...</div>
            ) : (
              <div data-tree-node>{renderTree(rootNode)}</div>
            )}
          </div>

          <div
            className="min-h-0 rounded-[2rem] border border-white/70 bg-white/92 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            onDragOver={(event) => {
              const target = selected ? resolveSelectionTarget(nodeMap[`${selected.nodeType}:${selected.nodeType === 'subproject' ? selected.subprojectId : selected.nodeType === 'directory' ? selected.directoryId : selected.fileId}`] || null) : null;
              if (target) event.preventDefault();
            }}
            onDrop={async (event) => {
              const target = selected ? resolveSelectionTarget(nodeMap[`${selected.nodeType}:${selected.nodeType === 'subproject' ? selected.subprojectId : selected.nodeType === 'directory' ? selected.directoryId : selected.fileId}`] || null) : null;
              if (target && event.dataTransfer.files.length > 0) {
                event.preventDefault();
                await uploadFiles(event.dataTransfer.files, target);
              }
            }}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <div className="text-sm font-black text-slate-900">{selected?.name || '项目文件资源'}</div>
                  <div className="mt-1 text-[11px] text-slate-400">{busyAction ? `执行中: ${busyAction}` : '双击目录进入，单击文件预览'}</div>
                </div>
              </div>

              {selected?.nodeType === 'file' ? (
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_280px] gap-0">
                  <div className="min-h-0 p-4">{renderPreview()}</div>
                  <div className="border-l border-slate-100 p-5 text-sm text-slate-600">
                    <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">文件信息</div>
                    <div className="mt-4 space-y-3">
                      <div><div className="text-xs text-slate-400">文件名</div><div className="font-bold text-slate-900 break-all">{previewFile?.filename}</div></div>
                      <div><div className="text-xs text-slate-400">内容类型</div><div className="font-semibold">{previewFile?.content_type || preview.contentType || 'unknown'}</div></div>
                      <div><div className="text-xs text-slate-400">大小</div><div className="font-semibold">{previewFile?.size || 0} bytes</div></div>
                      <div><div className="text-xs text-slate-400">更新时间</div><div className="font-semibold">{previewFile?.updated_at || '-'}</div></div>
                    </div>
                    {previewFile && (
                      <button
                        type="button"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white"
                        onClick={() => void handleDownload(previewFile)}
                      >
                        <Download size={14} />
                        下载文件
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-auto p-4">
                  <div className="grid grid-cols-[minmax(0,1fr)_120px_190px] gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <div>名称</div>
                    <div>大小</div>
                    <div>更新时间</div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`grid cursor-pointer grid-cols-[minmax(0,1fr)_120px_190px] gap-3 rounded-2xl px-4 py-3 text-sm ${
                          selected?.nodeType === item.node_type &&
                          ((item.node_type === 'directory' && selected.directoryId === item.directory_id) ||
                            (item.node_type === 'subproject' && selected.subprojectId === item.subproject_id))
                            ? 'bg-sky-50'
                            : 'hover:bg-slate-50'
                        }`}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('application/secflow-node', item.id);
                          event.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(event) => {
                          if (item.node_type === 'directory' || item.node_type === 'subproject') {
                            event.preventDefault();
                            setDragHoverNodeId(item.id);
                          }
                        }}
                        onDragLeave={() => setDragHoverNodeId((prev) => (prev === item.id ? null : prev))}
                        onDrop={async (event) => {
                          event.preventDefault();
                          const nodeId = event.dataTransfer.getData('application/secflow-node');
                          setDragHoverNodeId(null);
                          if (nodeId) {
                            await handleNodeDrop(nodeId, item);
                          }
                        }}
                        onClick={() => void openNode(item)}
                        onDoubleClick={() => void toggleNode(item)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          setContextMenu({ x: event.clientX, y: event.clientY, node: item });
                        }}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {renderNodeIcon(item, expandedNodes.has(item.id))}
                          <span className="truncate font-semibold text-slate-700">{item.name}</span>
                          {item.special_badge && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[9px] font-black text-sky-700">{item.special_badge}</span>}
                        </div>
                        <div className="text-xs text-slate-500">{item.node_type === 'file' ? `${item.size || 0} bytes` : '--'}</div>
                        <div className="truncate text-xs text-slate-500">{item.updated_at || '--'}</div>
                      </div>
                    ))}
                    {filteredItems.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-400">
                        当前目录没有匹配的文件或文件夹
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {renderContextMenu()}
    </div>
  );
};
