
import React from 'react';
import { BaseResourcePage } from './BaseResourcePage';

export const ReleasePackagePage: React.FC<{ projectId: string }> = ({ projectId }) => {
  return (
    <BaseResourcePage 
      type="software"
      title="发布包资产管理"
      subtitle="管理待测软件发布包、Artifact 及分布式二进制分发资产"
      projectId={projectId}
    />
  );
};
