import { ApplicationRecord, Company, Job, SavedSearch, User } from '../models/career.models';

export const mockUsers: User[] = [
  {
    id: 'u-1',
    name: 'Namrata Maurya',
    email: 'namrata@example.com',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Namrata%20Maurya',
    profile: {
      fieldKeywords: ['frontend', 'angular', 'design systems'],
      targetLocations: ['Remote', 'New York', 'Bengaluru'],
      notificationEmails: ['namrata@example.com'],
    },
  },
  {
    id: 'u-2',
    name: 'Demo Recruiter',
    email: 'recruiter@example.com',
    avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Demo%20Recruiter',
    profile: {
      fieldKeywords: ['product', 'analytics'],
      targetLocations: ['Remote', 'San Francisco'],
      notificationEmails: ['recruiter@example.com'],
    },
  },
];

export const mockCompanies: Company[] = [
  {
    id: 'c-1',
    name: 'Northstar Labs',
    logoUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=Northstar',
    careersUrl: 'https://example.com/northstar/careers',
    atsType: 'Greenhouse',
    priority: 'High',
    tags: ['AI', 'remote-friendly'],
    lastScrapedAt: '2026-08-12T08:30:00.000Z',
    lastScrapeStatus: 'success',
  },
  {
    id: 'c-2',
    name: 'Orbit Finance',
    logoUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=Orbit',
    careersUrl: 'https://example.com/orbit/jobs',
    atsType: 'Lever',
    priority: 'Medium',
    tags: ['fintech', 'design systems'],
    lastScrapedAt: '2026-08-11T16:45:00.000Z',
    lastScrapeStatus: 'success',
  },
  {
    id: 'c-3',
    name: 'Greenbyte Health',
    logoUrl: 'https://api.dicebear.com/9.x/shapes/svg?seed=Greenbyte',
    careersUrl: 'https://example.com/greenbyte/careers',
    atsType: 'Unknown',
    priority: 'High',
    tags: ['healthtech', 'frontend'],
    lastScrapedAt: '2026-08-13T06:10:00.000Z',
    lastScrapeStatus: 'queued',
  },
];

export const mockJobs: Job[] = [
  {
    id: 'j-1',
    title: 'Senior Angular Engineer',
    companyId: 'c-1',
    company: 'Northstar Labs',
    companyLogoUrl: mockCompanies[0].logoUrl,
    location: 'Remote',
    jobType: 'Remote',
    postedDate: '2026-08-12',
    applyUrl: 'https://example.com/jobs/senior-angular',
    status: 'applied',
    tags: ['Angular', 'Signals', 'AI'],
    isNew: true,
    whyThisFits: 'Strong match for Angular, Signals, and product-polished frontend work.',
  },
  {
    id: 'j-2',
    title: 'Design Systems Frontend Developer',
    companyId: 'c-2',
    company: 'Orbit Finance',
    companyLogoUrl: mockCompanies[1].logoUrl,
    location: 'New York',
    jobType: 'Hybrid',
    postedDate: '2026-08-09',
    applyUrl: 'https://example.com/jobs/design-systems',
    status: 'interviewing',
    tags: ['Design Systems', 'Accessibility'],
    isNew: false,
    whyThisFits: 'Matches your interest in reusable UI, accessibility, and polished product surfaces.',
  },
  {
    id: 'j-3',
    title: 'Frontend Platform Engineer',
    companyId: 'c-3',
    company: 'Greenbyte Health',
    companyLogoUrl: mockCompanies[2].logoUrl,
    location: 'Bengaluru',
    jobType: 'Remote',
    postedDate: '2026-08-13',
    applyUrl: 'https://example.com/jobs/platform',
    status: 'not_applied',
    tags: ['Frontend', 'Testing', 'Performance'],
    isNew: true,
  },
  {
    id: 'j-4',
    title: 'Product Analytics UI Engineer',
    companyId: 'c-2',
    company: 'Orbit Finance',
    companyLogoUrl: mockCompanies[1].logoUrl,
    location: 'San Francisco',
    jobType: 'Onsite',
    postedDate: '2026-08-05',
    applyUrl: 'https://example.com/jobs/analytics-ui',
    status: 'rejected',
    tags: ['Charts', 'Dashboards'],
    isNew: false,
  },
];

export const mockApplications: ApplicationRecord[] = mockJobs.map((job, index) => ({
  id: `a-${index + 1}`,
  jobId: job.id,
  title: job.title,
  company: job.company,
  status: job.status,
  appliedDate: job.status === 'not_applied' ? undefined : `2026-08-${String(6 + index).padStart(2, '0')}`,
  resumeVersion: job.status === 'not_applied' ? undefined : 'frontend-platform-v3.pdf',
  notes: job.status === 'interviewing' ? 'Prep design systems examples and dashboard performance work.' : '',
}));

export const defaultFilters = {
  keyword: '',
  location: '',
  jobType: '',
  company: '',
  dateFrom: '',
  dateTo: '',
  newSinceLastVisit: false,
  profileDefault: true,
};

export const mockSavedSearches: SavedSearch[] = [
  {
    id: 's-1',
    name: 'Angular + Remote',
    filters: { ...defaultFilters, keyword: 'angular', location: 'Remote', profileDefault: false },
    notificationCadence: 'daily',
    lastNotifiedAt: '2026-08-12T10:00:00.000Z',
  },
  {
    id: 's-2',
    name: 'Design systems',
    filters: { ...defaultFilters, keyword: 'design systems', profileDefault: false },
    notificationCadence: 'weekly',
  },
];
