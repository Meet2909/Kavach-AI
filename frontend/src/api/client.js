/**
 * KAVACH-AI Centralized API Client
 * Architectural Decision 2: Isolated API integration abstraction.
 * All HTTP communication to the FastAPI gateway is channeled through this client.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...options.headers,
  };

  // If body is NOT FormData, set JSON content type
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let detail = null;
      try {
        detail = await response.json();
      } catch {
        detail = await response.text();
      }
      throw new ApiError(
        (detail && detail.detail && typeof detail.detail === 'string') 
          ? detail.detail 
          : `HTTP ${response.status} on ${endpoint}`,
        response.status,
        detail
      );
    }

    // Check if JSON response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.blob();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      `Network error connecting to KAVACH-AI backend at ${API_BASE}. Ensure the FastAPI orchestrator is running.`,
      0,
      err.message
    );
  }
}

export const api = {
  baseUrl: API_BASE,

  // 1. Health Check
  async checkHealth() {
    return await request('/health');
  },

  // 2. Upload Document(s) & Initialize Job
  async uploadFiles(fileList) {
    const formData = new FormData();
    const filesArray = Array.isArray(fileList) ? fileList : Array.from(fileList);
    filesArray.forEach((file) => {
      formData.append('files', file);
    });

    return await request('/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // 3. Start Agent State Machine
  async startTask(jobId, taskType = 'summary', prompt = '') {
    return await request(`/task/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({
        task_type: taskType,
        prompt: prompt,
      }),
    });
  },

  // 4. Poll Active Job State & Trace Log
  async pollJobStatus(jobId) {
    return await request(`/job/${jobId}`);
  },

  // 5. Download Artifact URL helper
  getArtifactUrl(jobId, taskType = 'report') {
    return `${API_BASE}/artifact/${jobId}?task_type=${encodeURIComponent(taskType)}`;
  },

  // 6. Validate Artifact Manually
  async validateArtifact(jobId, taskType = 'report') {
    return await request('/validate_artifact', {
      method: 'POST',
      body: JSON.stringify({
        job_id: jobId,
        task_type: taskType,
      }),
    });
  },

  // 7. Audit Log
  async getAuditLog(jobId) {
    return await request(`/audit/${jobId}`);
  },

  // 8. Tool Permission Gate Check
  async checkPermission(taskType, toolName) {
    return await request('/check_permission', {
      method: 'POST',
      body: JSON.stringify({
        task_type: taskType,
        tool_name: toolName,
      }),
    });
  },

  // 9. List Allowed Tools for Task Type
  async listAllowedTools(taskType) {
    return await request(`/tools/${encodeURIComponent(taskType)}`);
  },

  // 10. Execute Code in Docker Offline Sandbox
  async runCode(code, jobId = 'sandbox-exec') {
    return await request('/run_code', {
      method: 'POST',
      body: JSON.stringify({
        code,
        job_id: jobId,
      }),
    });
  },

  // 11. Sovereignty Monitor Status
  async getSovereigntyStatus() {
    return await request('/sovereignty/status');
  },

  // 12. Sovereignty Baseline Snapshot Start
  async startSovereigntySnapshot() {
    return await request('/sovereignty/snapshot/start', {
      method: 'POST',
    });
  },

  // 13. Sovereignty Snapshot End & Delta Calculation
  async endSovereigntySnapshot() {
    return await request('/sovereignty/snapshot/end', {
      method: 'POST',
    });
  },

  // 14. Sovereignty Process Network Inspection
  async getSovereigntyProcesses() {
    return await request('/sovereignty/processes');
  },

  // 15. List Recent Jobs
  async listJobs() {
    return await request('/jobs');
  },

  // 16. CSV Structured Query Tool
  async queryCsv(filePath = null, filters = null, columns = null, maxRows = 50) {
    return await request('/query_csv', {
      method: 'POST',
      body: JSON.stringify({
        file_path: filePath,
        filters,
        columns,
        max_rows: maxRows,
      }),
    });
  },

  // 17. CSV Schema Inspection
  async getCsvSchema(filePath = null) {
    const query = filePath ? `?file_path=${encodeURIComponent(filePath)}` : '';
    return await request(`/csv_schema${query}`);
  },

  // 18. Router Simulation Test
  async testRoute(taskType, fileType = '') {
    return await request('/route', {
      method: 'POST',
      body: JSON.stringify({
        task_type: taskType,
        file_type: fileType,
      }),
    });
  },
};

export default api;
