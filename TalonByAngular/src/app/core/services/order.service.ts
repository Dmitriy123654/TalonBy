import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { 
  Hospital, 
  Doctor, 
  TimeSlot, 
  Appointment, 
  Speciality, 
  DoctorDetails 
} from '../../shared/interfaces/order.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = environment.apiUrl;
  private selectedDoctor: DoctorDetails | null = null;
  private selectedHospital: Hospital | null = null;
  private selectedDateTime: Date | null = null;

  constructor(private http: HttpClient) {
    // Загружаем данные из localStorage при инициализации сервиса
    this.loadStateFromStorage();
  }

  // Сохранение всего состояния заказа в localStorage
  private saveStateToStorage(): void {
    try {
      // Сохраняем дату и время как строку
      const dateTimeString = this.selectedDateTime ? this.selectedDateTime.toISOString() : null;
      
      localStorage.setItem('orderState', JSON.stringify({
        selectedDoctor: this.selectedDoctor,
        selectedHospital: this.selectedHospital,
        selectedDateTime: dateTimeString
      }));
    } catch (error) {
      console.error('Ошибка при сохранении состояния заказа:', error);
    }
  }

  // Загрузка состояния заказа из localStorage
  private loadStateFromStorage(): void {
    try {
      const savedState = localStorage.getItem('orderState');
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        
        this.selectedDoctor = parsedState.selectedDoctor;
        this.selectedHospital = parsedState.selectedHospital;
        
        // Восстанавливаем дату из строки
        if (parsedState.selectedDateTime) {
          this.selectedDateTime = new Date(parsedState.selectedDateTime);
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке состояния заказа:', error);
    }
  }

  // Очистка состояния заказа
  clearOrderData(): void {
    this.selectedDoctor = null;
    this.selectedHospital = null;
    this.selectedDateTime = null;
    localStorage.removeItem('orderState');
  }

  getHospitals(): Observable<Hospital[]> {
    return this.http.get<any>(`${this.apiUrl}/Hospital/GetAllHospitals`).pipe(
      map(response => {
        console.log('Raw hospital response:', response); // Добавим для отладки

        // Если response уже является массивом, используем его напрямую
        const hospitals = Array.isArray(response) ? response : 
                        response.$values ? response.$values : 
                        [];

        console.log('Hospitals after extraction:', hospitals); // Для отладки

        return hospitals.map((hospital: any) => ({
          hospitalId: Number(hospital.hospitalId),
          name: hospital.name?.trim() || '',
          address: hospital.address || '',
          type: hospital.type || 0,
          workingHours: hospital.workingHours || '',
          phones: hospital.phones || '',
          email: hospital.email || '',
          description: hospital.description || ''
        }));
      })
    );
  }

  // Получение специальностей для больницы
  getSpecialities(hospitalId: number): Observable<Speciality[]> {
    return this.http.get<any>(`${this.apiUrl}/DoctorsSpeciality/GetByHospital/${hospitalId}`)
      .pipe(
        map(response => {
          console.log('Raw specialities response:', response);
          const specialities = Array.isArray(response) ? response :
                             response.$values ? response.$values :
                             [];
          return specialities.map((spec: any) => ({
            doctorsSpecialityId: spec.doctorsSpecialityId,
            name: spec.name || '',
            link: '',
            description: spec.description || ''
          }));
        })
      );
  }

  // Получение докторов по больнице
  getDoctorsByHospital(hospitalId: number): Observable<DoctorDetails[]> {
    return this.http.get<any>(`${this.apiUrl}/Doctor/GetByHospital/${hospitalId}`)
      .pipe(
        map(response => {
          const doctors = Array.isArray(response) ? response :
                        response.$values ? response.$values :
                        [];
          return doctors;
        })
      );
  }

  // Получение докторов по специальности
  getDoctorsBySpeciality(specialityId: number): Observable<DoctorDetails[]> {
    return this.http.get<DoctorDetails[]>(`${this.apiUrl}/Doctor/GetBySpeciality/${specialityId}`);
  }

  // Получение докторов по специальности и больнице
  getDoctorsBySpecialityAndHospital(hospitalId: number, specialityId: number): Observable<DoctorDetails[]> {
    return this.http.get<any>(`${this.apiUrl}/Doctor/GetBySpecialtyAndHospital/${hospitalId}/${specialityId}`)
      .pipe(
        map(response => {
          console.log('Raw doctors response:', response);
          const doctors = Array.isArray(response) ? response :
                        response.$values ? response.$values :
                        [];
          return doctors;
        })
      );
  }

  getTimeSlots(doctorId: number, date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/doctors/${doctorId}/timeslots`, {
      params: { date }
    });
  }

  // Получение временных слотов для доктора на указанную дату
  getDoctorTimeSlots(doctorId: number, startDate: string, endDate: string): Observable<TimeSlot[]> {
    return this.http.get<any>(`${this.apiUrl}/Schedule/slots/${doctorId}?startDate=${startDate}&endDate=${endDate}`)
      .pipe(
        map(response => {
          console.log('Raw time slots response:', response);
          const slots = Array.isArray(response) ? response :
                      response.$values ? response.$values :
                      [];
          
          return slots.map((slot: any) => ({
            id: slot.id,
            startTime: slot.time,
            isAvailable: slot.isAvailable,
            date: slot.date,
            duration: slot.duration,
            doctorId: slot.doctorId
          }));
        })
      );
  }

  // Получение информации о доступности временных слотов врача по дням (сколько слотов доступно в каждый день)
  getDoctorScheduleWithSlots(doctorId: number, startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/Schedule/${doctorId}?startDate=${startDate}&endDate=${endDate}`)
      .pipe(
        map(response => {
          console.log('Raw doctor schedule response:', response);
          return response;
        })
      );
  }

  createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Observable<Appointment> {
    // Упрощаем запрос - параметр receptionStatusId не нужен, так как в бэкенде жестко задан ID=4
    return this.http.post<Appointment>(`${this.apiUrl}/MedicalAppointment/CreateFromTimeSlot?timeSlotId=${appointment.timeSlotId}&patientId=${appointment.patientId}`, {});
  }

  // Methods for storing selected data
  saveSelectedDoctor(doctor: DoctorDetails | null): void {
    this.selectedDoctor = doctor;
    this.saveStateToStorage();
  }

  getSelectedDoctor(): DoctorDetails | null {
    return this.selectedDoctor;
  }

  saveSelectedHospital(hospital: Hospital | null): void {
    this.selectedHospital = hospital;
    this.saveStateToStorage();
  }

  getSelectedHospital(): Hospital | null {
    return this.selectedHospital;
  }

  saveSelectedDateTime(dateTime: Date | null): void {
    this.selectedDateTime = dateTime;
    this.saveStateToStorage();
  }

  getSelectedDateTime(): Date | null {
    return this.selectedDateTime;
  }
  
  // Обновление статуса слота (делаем недоступным после создания записи)
  updateTimeSlotStatus(slotId: number, isAvailable: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/Schedule/slots/${slotId}`, { isAvailable });
  }
} 