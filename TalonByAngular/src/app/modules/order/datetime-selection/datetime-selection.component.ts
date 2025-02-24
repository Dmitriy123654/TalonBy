import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Hospital, DoctorDetails } from '../../../interfaces/order.interface';
import { OrderService } from '../../../services/order.service';

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isToday: boolean;
  isWeekend: boolean;
  isDisabled: boolean;
  availableSlots: number;
}

@Component({
  selector: 'app-datetime-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './datetime-selection.component.html',
  styleUrl: './datetime-selection.component.scss'
})
export class DatetimeSelectionComponent implements OnInit {
  hospital: Hospital | null = null;
  doctor: DoctorDetails | null = null;
  currentMonth: Date = new Date();
  calendar: CalendarDay[][] = [];
  weekDays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  selectedDate: Date | null = null;
  availableTimeSlots: string[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private orderService: OrderService
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state) {
      this.hospital = state['hospital'];
      this.doctor = state['doctor'];
    }
  }

  ngOnInit() {
    if (!this.hospital || !this.doctor) {
      this.router.navigate(['/order']);
      return;
    }
    this.generateCalendar();
  }

  generateCalendar() {
    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
    
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    
    // Добавляем пустые дни в начале месяца
    let firstDayOfWeek = firstDay.getDay() || 7;
    for (let i = 1; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: 0,
        month: this.currentMonth.getMonth(),
        year: this.currentMonth.getFullYear(),
        isToday: false,
        isWeekend: false,
        isDisabled: true,
        availableSlots: 0
      });
    }

    // Заполняем дни месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      currentWeek.push({
        date: day,
        month: this.currentMonth.getMonth(),
        year: this.currentMonth.getFullYear(),
        isToday: this.isToday(date),
        isWeekend,
        isDisabled: date < new Date(),
        availableSlots: Math.floor(Math.random() * 12) + 1 // Временно для демонстрации
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Добавляем оставшиеся дни
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: 0,
          month: this.currentMonth.getMonth(),
          year: this.currentMonth.getFullYear(),
          isToday: false,
          isWeekend: false,
          isDisabled: true,
          availableSlots: 0
        });
      }
      weeks.push(currentWeek);
    }

    this.calendar = weeks;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    this.generateCalendar();
  }

  selectDate(day: CalendarDay) {
    if (day.isDisabled || day.date === 0) return;
    
    this.selectedDate = new Date(day.year, day.month, day.date);
    // TODO: Загрузка доступных временных слотов
  }

  goToSpeciality() {
    this.router.navigate(['/order/speciality'], {
      state: { hospital: this.hospital }
    });
  }

  goToDoctor() {
    this.router.navigate(['/order/doctor'], {
      state: { 
        hospital: this.hospital,
        speciality: this.doctor?.doctorsSpeciality
      }
    });
  }

  getPhones(): { isLabel: boolean; text: string }[] {
    if (!this.hospital?.phones) return [];
    
    const result: { isLabel: boolean; text: string }[] = [];
    const sections = this.hospital.phones.split(/(?=(?:Регистратура:|Женская консультация:|Стоматология:|Студенческая деревня:))/);
    
    sections.forEach(section => {
      if (!section.trim()) return;
      const [label, ...numbers] = section.split(/(?=\+)/);
      if (label.trim()) {
        result.push({ isLabel: true, text: label.trim() });
      }
      numbers.forEach(number => {
        if (number.trim()) {
          result.push({ isLabel: false, text: number.trim() });
        }
      });
    });
    
    return result;
  }

  getWorkingHours(day: string): string {
    if (!this.hospital?.workingHours) return '';
    
    const schedules = this.hospital.workingHours.split(',');
    const daySchedule = schedules.find(schedule => 
      schedule.trim().startsWith(day)
    );
    
    if (daySchedule) {
      const timeMatch = daySchedule.match(/(?:ПН-ПТ|СБ):\s*([\d:-]+)/);
      return timeMatch ? timeMatch[1].trim() : '';
    }
    return '';
  }

  getDomain(url: string | undefined): string {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '');
  }
}
