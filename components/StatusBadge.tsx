
import React from 'react';

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status?.toLowerCase();
  const isActive = ['active', 'valid', 'running', 'bound', 'owner', 'healthy', 'success'].includes(s);
  const isInvalid = ['invalid', 'failed', 'offline', 'error'].includes(s);
  const isPending = ['pending', 'checking', 'admin'].includes(s);
  
  let colorClass = 'bg-slate-100 text-slate-500 border-slate-200';
  if (isActive) colorClass = 'bg-green-100 text-green-700 border-green-200';
  if (isInvalid) colorClass = 'bg-red-100 text-red-700 border-red-200';
  if (isPending) colorClass = 'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider shrink-0 ${colorClass}`}>
      {status || 'Unknown'}
    </span>
  );
};
