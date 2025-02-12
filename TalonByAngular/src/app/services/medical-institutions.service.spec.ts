import { TestBed } from '@angular/core/testing';

import { MedicalInstitutionsService } from './medical-institutions.service';

describe('MedicalInstitutionsService', () => {
  let service: MedicalInstitutionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicalInstitutionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
