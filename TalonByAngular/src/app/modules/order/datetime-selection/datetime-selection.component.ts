import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Hospital, DoctorDetails } from '../../../shared/interfaces/order.interface';
import { OrderService } from '../../../core/services/order.service';
import { trigger, transition, style, animate } from '@angular/animations';

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
  templateUrl: './datetime-selection.component.html',
  styleUrls: ['./datetime-selection.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ 
          transform: 'translateY(-20px)',
          opacity: 0
        }),
        animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ 
          transform: 'translateY(0)',
          opacity: 1
        }))
      ]),
      transition(':leave', [
        style({ 
          transform: 'translateY(0)',
          opacity: 1
        }),
        animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ 
          transform: 'translateY(20px)',
          opacity: 0
        }))
      ])
    ])
  ]
})
export class DatetimeSelectionComponent implements OnInit, OnDestroy {
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
  isMobile = false;
  isDetailsOpen = false;

  firstShiftSlots: string[] = [
    '09:00', '09:20', '09:40', '10:00', '10:20', 
    '12:40', '13:00', '13:20', '13:40', '14:00',
    '14:20', '14:40', '18:20', '19:00', '19:20'
  ];

  constructor(
    private router: Router,
    private orderService: OrderService
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state) {
      this.hospital = state['hospital'];
      this.doctor = state['doctor'];
    }
    this.checkScreenSize();
  }

  ngOnInit() {
    if (!this.hospital || !this.doctor) {
      this.router.navigate(['/order']);
      return;
    }
    this.generateCalendar();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
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
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Сбрасываем время
    
    const prevMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    if (prevMonth >= today || this.currentMonth.getMonth() > today.getMonth()) {
      this.currentMonth = prevMonth;
      this.generateCalendar();
    }
  }

  nextMonth() {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    const nextMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    
    if (nextMonth <= maxDate) {
      this.currentMonth = nextMonth;
      this.generateCalendar();
    }
  }

  selectDate(day: CalendarDay) {
    if (day.isDisabled || day.date === 0) return;
    
    // Если нажали на уже выбранную дату - скрываем слоты
    if (this.selectedDate && 
        this.selectedDate.getDate() === day.date && 
        this.selectedDate.getMonth() === day.month && 
        this.selectedDate.getFullYear() === day.year) {
      this.selectedDate = null;
    } else {
      this.selectedDate = new Date(day.year, day.month, day.date);
    }
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
    
    sections.forEach((section: string) => {
      if (!section.trim()) return;
      
      const [label, ...numbers] = section.split(/(?=\+)/);
      if (label.trim()) {
        result.push({ isLabel: true, text: label.trim() });
      }
      
      // Перемещаем обработку numbers внутрь текущего section
      numbers.forEach((number: string) => {
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
    const daySchedule = schedules.find((schedule: string) => 
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

  // Добавим метод для проверки, можно ли переключиться на следующий месяц
  canGoToNextMonth(): boolean {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    const nextMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    return nextMonth <= maxDate;
  }

  // Добавим метод для проверки, можно ли переключиться на предыдущий месяц
  canGoToPrevMonth(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Сбрасываем время
    
    const firstDayOfCurrentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    return firstDayOfCurrentMonth > today;
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleDetails() {
    this.isDetailsOpen = !this.isDetailsOpen;
  }

  getDayOfWeek(date: Date): string {
    const days = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    return days[date.getDay()];
  }

  getAvailableSlotsCount(): number {
    return this.firstShiftSlots.length;
  }
}
