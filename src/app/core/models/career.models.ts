export type ApplicationStatus = 'not_applied' | 'applied' | 'interviewing' | 'rejected' | 'offer';
export type NotificationCadence = 'instant' | 'daily' | 'weekly' | 'off';
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote';

export interface UserProfile {
  fieldKeywords: string[];
  targetLocations: string[];
  notificationEmails: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  profile: UserProfile;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface JobFilters {
  keyword: string;
  location: string;
  jobType: string;
  company: string;
  dateFrom: string;
  dateTo: string;
  newSinceLastVisit: boolean;
  profileDefault: boolean;
}

export interface Job {
  id: string;
  title: string;
  companyId: string;
  company: string;
  companyLogoUrl: string;
  location: string;
  jobType: JobType;
  postedDate: string;
  applyUrl: string;
  status: ApplicationStatus;
  tags: string[];
  isNew: boolean;
  whyThisFits?: string;
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  careersUrl: string;
  atsType: 'Greenhouse' | 'Lever' | 'Workday' | 'Ashby' | 'Custom';
  priority: 'High' | 'Medium' | 'Low';
  tags: string[];
  lastScrapedAt: string;
  lastScrapeStatus: 'success' | 'failed' | 'running' | 'queued';
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  title: string;
  company: string;
  status: ApplicationStatus;
  appliedDate?: string;
  resumeVersion?: string;
  notes?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: JobFilters;
  notificationCadence: NotificationCadence;
  lastNotifiedAt?: string;
}

export const statusLabels: Record<ApplicationStatus, string> = {
  not_applied: 'Not Applied',
  applied: 'Applied',
  interviewing: 'Interviewing',
  rejected: 'Rejected',
  offer: 'Offer',
};
