import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatetimeSelectionComponent } from './datetime-selection.component';

describe('DatetimeSelectionComponent', () => {
  let component: DatetimeSelectionComponent;
  let fixture: ComponentFixture<DatetimeSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatetimeSelectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DatetimeSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
