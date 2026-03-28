
import { API_BASE, handleResponse, getHeaders } from './base';
import { AdminDashboardStats } from '../types/types';

// Service names for health check
const SERVICES = [
  { name: 'secflow-platform-auth', endpoint: '/api/auth/health' },
  { name: 'secflow-platform-project', endpoint: '/api/project/health' },
  { name: 'secflow-platform-resource', endpoint: '/api/resource/health' },
  { name: 'secflow-platform-agent', endpoint: '/api/agent/health' },
  { name: 'secflow-platform-workflow', endpoint: '/api/workflow/health' },
  { name: 'secflow-platform-menu', endpoint: '/api/menu/health' },
];

// Check health of a single service
const checkServiceHealth = async (endpoint: string): Promise<'healthy' | 'unhealthy' | 'unknown'> => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    if (response.ok) {
      return 'healthy';
    }
    return 'unhealthy';
  } catch {
    return 'unhealthy';
  }
};

export const adminApi = {
  /**
   * Get aggregated statistics from all services for admin dashboard
   * Uses Promise.allSettled for graceful degradation
   */
  getStatistics: async (): Promise<AdminDashboardStats> => {
    const headers = getHeaders();

    // Fetch all statistics in parallel with graceful error handling
    const [
      usersResult,
      rolesResult,
      onlineSessionsResult,
      projectsResult,
      agentsResult,
      resourcesResult,
      workflowsResult,
    ] = await Promise.allSettled([
      // Users
      fetch(`${API_BASE}/api/auth/users/user_list`, { headers }).then(r => handleResponse(r)),
      // Roles
      fetch(`${API_BASE}/api/auth/role_list`, { headers }).then(r => handleResponse(r)),
      // Online sessions
      fetch(`${API_BASE}/api/auth/users/sessions/online`, { headers }).then(r => handleResponse(r)),
      // Projects
      fetch(`${API_BASE}/api/project`, { headers }).then(r => handleResponse(r)),
      // Agent stats (global - no project_id)
      fetch(`${API_BASE}/api/agent/agents/stats`, { headers }).then(r => handleResponse(r)),
      // Resource PVC statistics (global - no project_id)
      fetch(`${API_BASE}/api/resource/pvcs/statistics`, { headers }).then(r => handleResponse(r)),
      // Workflow statistics
      fetch(`${API_BASE}/api/workflow/statistics`, { headers }).then(r => handleResponse(r)),
    ]);

    // Process users
    const users = usersResult.status === 'fulfilled' ? usersResult.value : [];
    const totalUsers = Array.isArray(users) ? users.length : 0;
    const activeUsers = Array.isArray(users) ? users.filter((u: any) => u.is_active).length : 0;

    // Process roles
    const roles = rolesResult.status === 'fulfilled' ? rolesResult.value : [];
    const totalRoles = Array.isArray(roles) ? roles.length : 0;

    // Process online sessions
    const onlineSessions = onlineSessionsResult.status === 'fulfilled' ? onlineSessionsResult.value : [];
    const onlineUsers = Array.isArray(onlineSessions) ? onlineSessions.length : 0;

    // Process projects
    const projects = projectsResult.status === 'fulfilled' ? projectsResult.value : { total: 0, projects: [] };
    const totalProjects = projects.total || 0;

    // Process agent stats
    const agentStats = agentsResult.status === 'fulfilled' ? agentsResult.value : null;
    const agentData = {
      total: agentStats?.summary?.total_agents || 0,
      online: (agentStats?.summary?.total_agents || 0) - (agentStats?.summary?.offline_agents || 0),
      statusDistribution: agentStats?.summary?.status_distribution || { online: 0, offline: 0, error: 0, unknown: 0 },
    };

    // Process resource stats
    const resourceStats = resourcesResult.status === 'fulfilled' ? resourcesResult.value : null;
    const resourceData = {
      totalPvcs: resourceStats?.total_pvcs || 0,
      totalStorageGi: resourceStats?.total_storage_gi || 0,
      statusCounts: resourceStats?.status_counts || {},
    };

    // Process workflow stats
    const workflowStats = workflowsResult.status === 'fulfilled' ? workflowsResult.value : null;
    const workflowData = {
      totalInstances: workflowStats?.total_instances || 0,
      statusDistribution: workflowStats?.status_distribution || {},
      templates: {
        appTemplates: workflowStats?.templates?.app_templates || 0,
        jobTemplates: workflowStats?.templates?.job_templates || 0,
      },
    };

    // Check service health in parallel
    const serviceHealthPromises = SERVICES.map(async (service) => ({
      name: service.name,
      status: await checkServiceHealth(service.endpoint),
    }));
    const services = await Promise.all(serviceHealthPromises);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        online: onlineUsers,
      },
      roles: {
        total: totalRoles,
      },
      projects: {
        total: totalProjects,
      },
      agents: agentData,
      resources: resourceData,
      workflows: workflowData,
      services,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Refresh all service health statuses
   */
  getServiceHealth: async (): Promise<{ name: string; status: 'healthy' | 'unhealthy' | 'unknown' }[]> => {
    const healthPromises = SERVICES.map(async (service) => ({
      name: service.name,
      status: await checkServiceHealth(service.endpoint),
    }));
    return Promise.all(healthPromises);
  },
};
