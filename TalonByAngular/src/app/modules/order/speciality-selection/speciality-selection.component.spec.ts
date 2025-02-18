import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialitySelectionComponent } from './speciality-selection.component';

describe('SpecialitySelectionComponent', () => {
  let component: SpecialitySelectionComponent;
  let fixture: ComponentFixture<SpecialitySelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialitySelectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SpecialitySelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
