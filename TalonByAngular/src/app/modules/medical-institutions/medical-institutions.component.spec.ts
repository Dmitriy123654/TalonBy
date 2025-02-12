import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalInstitutionsComponent } from './medical-institutions.component';

describe('MedicalInstitutionsComponent', () => {
  let component: MedicalInstitutionsComponent;
  let fixture: ComponentFixture<MedicalInstitutionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalInstitutionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MedicalInstitutionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
