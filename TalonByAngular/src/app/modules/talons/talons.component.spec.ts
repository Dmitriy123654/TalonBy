import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TalonsComponent } from './talons.component';

describe('TalonsComponent', () => {
  let component: TalonsComponent;
  let fixture: ComponentFixture<TalonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TalonsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TalonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
