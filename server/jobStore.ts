import type { VideoProject, GenerationJob, UserFairUseQuota } from '../src/types.js';

class JobStore {
  private projects: Map<string, VideoProject> = new Map();
  private jobs: Map<string, GenerationJob> = new Map();
  private userQuota: UserFairUseQuota = {
    dailyQuotaTotal: 5,
    dailyQuotaRemaining: 5,
    maxVideoDurationSec: 60,
    maxResolution: '1080p',
    activeConcurrentJobs: 0,
    maxConcurrentJobs: 2,
    resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  getQuota(): UserFairUseQuota {
    return { ...this.userQuota };
  }

  decrementQuota(): boolean {
    if (this.userQuota.dailyQuotaRemaining <= 0) {
      return false;
    }
    this.userQuota.dailyQuotaRemaining--;
    return true;
  }

  saveProject(project: VideoProject): void {
    this.projects.set(project.id, project);
  }

  getProject(id: string): VideoProject | undefined {
    return this.projects.get(id);
  }

  getAllProjects(): VideoProject[] {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }

  createJob(projectId: string): GenerationJob {
    const job: GenerationJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectId,
      state: 'QUEUED',
      progressPercent: 5,
      currentStepMessage: 'Job queued in background worker pipeline...',
      logs: [
        {
          timestamp: new Date().toISOString(),
          step: 'QUEUE',
          message: 'Video generation task assigned to worker queue',
          status: 'info',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  getJob(id: string): GenerationJob | undefined {
    return this.jobs.get(id);
  }

  updateJob(job: GenerationJob): void {
    job.updatedAt = new Date().toISOString();
    this.jobs.set(job.id, job);
  }
}

export const jobStore = new JobStore();
