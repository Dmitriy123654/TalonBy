import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  AppointmentMedicalDetails, 
  AppointmentMedicalDetailsCreateModel, 
  AppointmentMedicalDetailsUpdateModel 
} from '../../shared/interfaces/appointment-medical-details.interface';

@Injectable({
  providedIn: 'root'
})
export class MedicalDetailsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Получить медицинские детали по ID
   */
  getById(id: number): Observable<AppointmentMedicalDetails> {
    return this.http.get<AppointmentMedicalDetails>(`${this.apiUrl}/AppointmentMedicalDetails/${id}`);
  }

  /**
   * Получить медицинские детали по ID талона
   */
  getByAppointmentId(appointmentId: number): Observable<AppointmentMedicalDetails> {
    return this.http.get<AppointmentMedicalDetails>(`${this.apiUrl}/AppointmentMedicalDetails/appointment/${appointmentId}`)
      .pipe(
        catchError(error => {
          // Если сервер вернул 404, просто возвращаем null - это нормальная ситуация
          if (error.status === 404) {
            return of(null as any);
          }
          // Если сервер вернул 403, значит недостаточно прав - возвращаем пустой объект
          if (error.status === 403) {
            console.warn('Недостаточно прав для просмотра медицинских деталей');
            return of(null as any);
          }
          // Иначе пробрасываем ошибку дальше
          return throwError(() => error);
        })
      );
  }

  /**
   * Создать медицинские детали для талона
   */
  create(model: AppointmentMedicalDetailsCreateModel): Observable<AppointmentMedicalDetails> {
    // Подготавливаем модель для отправки на сервер (форматируем дату)
    const preparedModel = this.prepareModelForServer(model);
    
    return this.http.post<AppointmentMedicalDetails>(`${this.apiUrl}/AppointmentMedicalDetails`, preparedModel)
      .pipe(
        catchError(error => {
          // Если сервер вернул 403, возвращаем ошибку, но не прерываем поток выполнения
          if (error.status === 403) {
            console.warn('Недостаточно прав для создания медицинских деталей');
            // Используем не throwError, а return of с ошибкой и признаком isError
            return of({
              status: 403,
              message: 'Недостаточно прав для создания медицинских деталей. Необходима роль Врача.',
              isError: true
            } as any);
          }
          // Иначе пробрасываем ошибку дальше
          return throwError(() => error);
        })
      );
  }

  /**
   * Обновить медицинские детали для талона
   */
  update(id: number, model: AppointmentMedicalDetailsUpdateModel): Observable<AppointmentMedicalDetails> {
    // Подготавливаем модель для отправки на сервер (форматируем дату)
    const preparedModel = this.prepareModelForServer(model);
    
    return this.http.put<AppointmentMedicalDetails>(`${this.apiUrl}/AppointmentMedicalDetails/${id}`, preparedModel)
      .pipe(
        catchError(error => {
          // Если сервер вернул 403, возвращаем ошибку, но не прерываем поток выполнения
          if (error.status === 403) {
            console.warn('Недостаточно прав для обновления медицинских деталей');
            // Используем не throwError, а return of с ошибкой и признаком isError
            return of({
              status: 403,
              message: 'Недостаточно прав для обновления медицинских деталей. Необходима роль Врача.',
              isError: true
            } as any);
          }
          // Иначе пробрасываем ошибку дальше
          return throwError(() => error);
        })
      );
  }

  /**
   * Подготовка модели для отправки на сервер
   */
  private prepareModelForServer(model: any): any {
    // Создаем копию модели, чтобы не изменять исходную
    const preparedModel = { ...model };
    
    // Преобразуем строку даты в формат, который понимает сервер
    if (preparedModel.nextAppointmentDate) {
      // Если дата - строка, преобразуем её в объект Date
      try {
        if (typeof preparedModel.nextAppointmentDate === 'string') {
          const dateObj = new Date(preparedModel.nextAppointmentDate);
          // Если дата валидна, преобразуем её в ISO формат
          if (!isNaN(dateObj.getTime())) {
            preparedModel.nextAppointmentDate = dateObj.toISOString();
          } else {
            // Если дата невалидна, установим null
            preparedModel.nextAppointmentDate = null;
          }
        }
      } catch (error) {
        console.error('Ошибка преобразования даты:', error);
        preparedModel.nextAppointmentDate = null;
      }
    } else {
      // Если дата не указана, установим null
      preparedModel.nextAppointmentDate = null;
    }
    
    return preparedModel;
  }

  /**
   * Удалить медицинские детали
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/AppointmentMedicalDetails/${id}`);
  }
} 