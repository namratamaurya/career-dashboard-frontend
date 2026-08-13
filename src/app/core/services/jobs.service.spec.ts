import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(JobsService);
  });

  it('serializes only active filter values', () => {
    service.setFilters({ keyword: 'angular', newSinceLastVisit: true, location: '' });
    expect(service.queryParams().get('keyword')).toBe('angular');
    expect(service.queryParams().get('newSinceLastVisit')).toBe('true');
    expect(service.queryParams().has('location')).toBeFalse();
  });

  it('optimistically updates application status', (done) => {
    service.updateStatus('j-1', 'offer').subscribe(() => {
      expect(service.jobs().find((job) => job.id === 'j-1')?.status).toBe('offer');
      done();
    });
  });
});
