import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { OrderService } from '../../../core/services/order.service';

describe('OrderConfirmationComponent', () => {
  let component: OrderConfirmationComponent;
  let fixture: ComponentFixture<OrderConfirmationComponent>;
  let routerSpy = { navigate: jasmine.createSpy('navigate') };
  let orderServiceSpy = jasmine.createSpyObj('OrderService', [
    'getSelectedHospital',
    'getSelectedDoctor',
    'getSelectedDateTime',
    'createAppointment'
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderConfirmationComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: OrderService, useValue: orderServiceSpy }
      ]
    }).compileComponents();

    orderServiceSpy.getSelectedHospital.and.returnValue({ hospitalId: 1, name: 'Test Hospital' });
    orderServiceSpy.getSelectedDoctor.and.returnValue({ doctorId: 1, fullName: 'Test Doctor' });
    orderServiceSpy.getSelectedDateTime.and.returnValue(new Date());
    orderServiceSpy.createAppointment.and.returnValue(of({}));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load order details on init', () => {
    component.ngOnInit();
    expect(orderServiceSpy.getSelectedHospital).toHaveBeenCalled();
    expect(orderServiceSpy.getSelectedDoctor).toHaveBeenCalled();
    expect(orderServiceSpy.getSelectedDateTime).toHaveBeenCalled();
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalled();
  });

  it('should mark order as confirmed on successful appointment creation', () => {
    component.canConfirm = true;
    component.hospital = { hospitalId: 1 } as any;
    component.doctor = { doctorId: 1 } as any;
    component.patient = { patientId: 1 } as any;
    component.timeSlot = { id: 1 } as any;
    
    component.confirmOrder();
    
    expect(orderServiceSpy.createAppointment).toHaveBeenCalled();
    expect(component.isConfirmed).toBeTrue();
  });
}); 