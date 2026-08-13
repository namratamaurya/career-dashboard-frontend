export type ApplicationStatus = 'not_applied' | 'applied' | 'interviewing' | 'rejected' | 'offer';
export type NotificationCadence = 'instant' | 'daily' | 'weekly' | 'off';
export type JobType = 'Remote' | 'Hybrid' | 'Onsite' | 'Unknown';

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

export interface BackendUserProfile {
  id: string;
  email: string;
  displayName: string;
  fieldKeywords: string[];
  targetLocations: string[];
}

export interface BackendLoginResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: BackendUserProfile;
  profile?: BackendUserProfile;
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

export interface PaginatedJobs {
  items: BackendJobPosting[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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
  atsType: 'Greenhouse' | 'Lever' | 'Workday' | 'Custom' | 'Unknown';
  priority: 'High' | 'Medium' | 'Low';
  tags: string[];
  lastScrapedAt: string;
  lastScrapeStatus: 'never' | 'success' | 'failed' | 'skipped' | 'running' | 'queued';
}

export interface BackendCompany {
  id: string;
  name: string;
  portalUrl: string;
  atsType: 'GREENHOUSE' | 'LEVER' | 'WORKDAY' | 'CUSTOM' | 'UNKNOWN';
  logoUrl: string | null;
  notes?: string | null;
  tags: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  scrapeIntervalMinutes?: number;
  lastScrapedAt: string | null;
  lastScrapeStatus: 'NEVER' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  lastScrapeError?: string | null;
}

export interface BackendJobPosting {
  id: string;
  title: string;
  location: string | null;
  department: string | null;
  jobType: 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';
  url: string;
  description: string | null;
  postedAt: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  isActive: boolean;
  company: BackendCompany;
  applicationStatus?: 'NOT_APPLIED' | 'APPLIED' | 'INTERVIEWING' | 'REJECTED' | 'OFFER';
  status?: 'NOT_APPLIED' | 'APPLIED' | 'INTERVIEWING' | 'REJECTED' | 'OFFER';
  whyThisFits?: string;
}

export interface BackendSavedSearch {
  id: string;
  name: string;
  filters?: Record<string, unknown>;
  notificationFrequency?: 'INSTANT' | 'DAILY' | 'WEEKLY' | 'NONE';
  lastNotifiedAt?: string;
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
