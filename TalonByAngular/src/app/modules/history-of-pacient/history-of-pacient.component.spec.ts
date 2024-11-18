import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryOfPacientComponent } from './history-of-pacient.component';

describe('HistoryOfPacientComponent', () => {
  let component: HistoryOfPacientComponent;
  let fixture: ComponentFixture<HistoryOfPacientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryOfPacientComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoryOfPacientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
