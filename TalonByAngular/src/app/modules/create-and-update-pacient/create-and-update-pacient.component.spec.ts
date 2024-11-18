import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAndUpdatePacientComponent } from './create-and-update-pacient.component';

describe('CreateAndUpdatePacientComponent', () => {
  let component: CreateAndUpdatePacientComponent;
  let fixture: ComponentFixture<CreateAndUpdatePacientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAndUpdatePacientComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateAndUpdatePacientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
