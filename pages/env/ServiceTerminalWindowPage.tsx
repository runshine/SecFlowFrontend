import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Plug, PlugZap, TerminalSquare } from 'lucide-react';
import { api } from '../../api/api';
import { XTerminal } from '../../components/XTerminal';

type TerminalMode = 'attach' | 'shell';

const isIpHost = (host: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(host);

const buildWsCandidates = (rawUrl: string): string[] => {
  try {
    const parsed = new URL(rawUrl, window.location.href);
    const candidates: string[] = [];
    const seen = new Set<string>();

    const pushCandidate = (value: string) => {
      if (!seen.has(value)) {
        seen.add(value);
        candidates.push(value);
      }
    };

    pushCandidate(parsed.toString());

    const sameHost = parsed.host === window.location.host;
    const publicDomainHost =
      !!parsed.hostname &&
      !isIpHost(parsed.hostname) &&
      parsed.hostname !== 'localhost' &&
      !parsed.hostname.endsWith('.local');

    // 对外域名经 ingress 暴露时，WS 往往只在 TLS 入口上稳定可用。
    if (parsed.protocol === 'ws:' && (window.location.protocol === 'https:' || sameHost || publicDomainHost)) {
      const secure = new URL(parsed.toString());
      secure.protocol = 'wss:';
      pushCandidate(secure.toString());
    }

    return candidates;
  } catch {
    return [rawUrl];
  }
};

const parseQuery = () => {
  const q = new URLSearchParams(window.location.search);
  return {
    projectId: q.get('project_id') || '',
    agentKey: q.get('agent_key') || '',
    serviceName: q.get('service_name') || '',
    container: q.get('container') || '',
    shell: q.get('shell') || '/bin/bash',
    mode: (q.get('mode') === 'attach' ? 'attach' : 'shell') as TerminalMode,
  };
};

export const ServiceTerminalWindowPage: React.FC = () => {
  const initial = useMemo(parseQuery, []);
  const [projectId] = useState(initial.projectId);
  const [agentKey] = useState(initial.agentKey);
  const [serviceName] = useState(initial.serviceName);
  const [container] = useState(initial.container);
  const [mode, setMode] = useState<TerminalMode>(initial.mode);
  const [shell, setShell] = useState(initial.shell || '/bin/bash');
  const [terminalWs, setTerminalWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (terminalWs) terminalWs.close();
    };
  }, [terminalWs]);

  useEffect(() => {
    void connectTerminal(initial.mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectTerminal = async (nextMode = mode) => {
    if (!agentKey || !serviceName) {
      setError('缺少必要参数：agent_key/service_name');
      return;
    }
    setError('');
    setConnecting(true);
    try {
      if (terminalWs) {
        terminalWs.close();
        setTerminalWs(null);
      }
      const conn = await api.environment.getAgentServiceExecWsConnection(agentKey, serviceName, {
        project_id: projectId || undefined,
        container: container || undefined,
        shell: (shell || '/bin/bash').trim() || '/bin/bash',
        mode: nextMode,
      });
      setConnectionInfo(conn || null);
      const wsUrl = conn?.ws_url;
      if (!wsUrl) throw new Error('未获取到终端连接地址');

      if (/^ws:\/\/\d{1,3}(\.\d{1,3}){3}(:\d+)?\//.test(wsUrl)) {
        throw new Error('当前策略禁止浏览器直连Agent，请使用平台中转通道（Ingress WS/WSS）。');
      }

      const candidates = buildWsCandidates(wsUrl);
      let connectedWs: WebSocket | null = null;
      let lastCloseMessage = '';

      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        const ws = await new Promise<WebSocket>((resolve, reject) => {
          const sock = new WebSocket(candidate);
          let settled = false;

          const cleanup = () => {
            sock.onopen = null;
            sock.onerror = null;
            sock.onclose = null;
          };

          sock.onopen = () => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve(sock);
          };

          sock.onerror = () => {
            if (settled) return;
            settled = true;
            cleanup();
            try { sock.close(); } catch {}
            reject(new Error(`WebSocket握手失败: ${candidate}`));
          };

          sock.onclose = (evt) => {
            if (settled) return;
            settled = true;
            cleanup();
            const reason = evt?.reason ? `, reason=${evt.reason}` : '';
            reject(new Error(`WebSocket握手失败: ${candidate}, code=${evt?.code ?? 'unknown'}${reason}`));
          };
        }).catch((err) => {
          lastCloseMessage = err instanceof Error ? err.message : String(err || '');
          return null;
        });

        if (ws) {
          connectedWs = ws;
          if (candidate !== wsUrl) {
            setConnectionInfo((prev: any) => prev ? { ...prev, ws_url: candidate, ws_url_original: wsUrl } : prev);
          }
          break;
        }

        if (index < candidates.length - 1) {
          setError(`主终端地址握手失败，正在回退到安全通道: ${candidates[index + 1]}`);
        }
      }

      if (!connectedWs) {
        throw new Error(lastCloseMessage || '终端握手失败');
      }

      connectedWs.onopen = () => setConnected(true);
      connectedWs.onclose = (evt) => {
        setConnected(false);
        const reason = evt?.reason ? `, reason=${evt.reason}` : '';
        setError(
          `终端连接关闭: code=${evt?.code ?? 'unknown'}${reason}. ` +
          `可能原因: 1) agent/容器重启; 2) 浏览器/代理主动断开; 3) ingress/HTTPS与WS协议不一致。`
        );
      };
      connectedWs.onerror = () => {
        setConnected(false);
        setError('终端连接发生网络错误，请检查 ingress、HTTPS/WSS 与浏览器控制台错误信息。');
      };
      setConnected(true);
      setTerminalWs(connectedWs);
    } catch (err: any) {
      setError(err?.message || '终端连接失败');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/95 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <TerminalSquare size={16} className="text-blue-400" />
          <p className="text-sm font-black truncate">{serviceName || 'Service Terminal'}</p>
          <span className="text-[11px] text-slate-400 font-mono truncate">{agentKey}</span>
        </div>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value === 'attach' ? 'attach' : 'shell')}
          className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
        >
          <option value="attach">Attach 模式</option>
          <option value="shell">新建 Shell</option>
        </select>

        <input
          value={shell}
          onChange={(e) => setShell(e.target.value)}
          placeholder="/bin/bash 或 /bin/sh"
          disabled={mode === 'attach'}
          className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 w-52 disabled:opacity-50"
        />

        <button
          onClick={() => void connectTerminal(mode)}
          disabled={connecting}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-black hover:bg-blue-500 disabled:opacity-60 flex items-center gap-2"
        >
          {connecting ? <Loader2 size={13} className="animate-spin" /> : <Plug size={13} />}
          连接
        </button>

        <button
          onClick={() => {
            if (terminalWs) terminalWs.close();
            setTerminalWs(null);
            setConnected(false);
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-black hover:bg-slate-700 flex items-center gap-2"
        >
          <PlugZap size={13} />
          断开
        </button>

        <span className={`ml-auto text-[11px] font-bold ${connected ? 'text-emerald-400' : 'text-amber-400'}`}>
          {connected ? '已连接' : (connecting ? '连接中...' : '未连接')}
        </span>
      </div>

      {error ? (
        <div className="px-4 py-2 text-xs bg-rose-500/10 text-rose-300 border-b border-rose-500/20">{error}</div>
      ) : null}

      {connectionInfo ? (
        <div className="px-4 py-2 text-[11px] bg-slate-900 border-b border-slate-800 text-slate-300 space-y-1">
          <div>WS地址: <span className="font-mono break-all">{connectionInfo?.ws_url || '-'}</span></div>
          {connectionInfo?.ingress_ws_url ? <div>Ingress WS: <span className="font-mono break-all">{connectionInfo.ingress_ws_url}</span></div> : null}
          {connectionInfo?.direct_ws_url ? <div>直连 WS: <span className="font-mono break-all">{connectionInfo.direct_ws_url}</span></div> : null}
          {connectionInfo?.note ? <div className="text-amber-300">{connectionInfo.note}</div> : null}
        </div>
      ) : null}

      <div className="flex-1 min-h-0">
        <XTerminal
          ws={terminalWs}
          connected={connected}
          podName={`${serviceName}${container ? `:${container}` : ''}`}
          onClose={() => {
            if (terminalWs) terminalWs.close();
            setTerminalWs(null);
            setConnected(false);
            window.close();
          }}
          showHeader={false}
        />
      </div>
    </div>
  );
};
