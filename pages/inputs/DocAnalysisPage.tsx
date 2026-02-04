
import React from 'react';
import { BaseResourcePage } from './BaseResourcePage';

export const DocAnalysisPage: React.FC<{ projectId: string }> = ({ projectId }) => {
  return (
    <BaseResourcePage 
      type="document"
      title="需求文档分析"
      subtitle="导入业务接口设计、需求文档及安全规范，提取潜在攻击面"
      projectId={projectId}
    />
  );
};
