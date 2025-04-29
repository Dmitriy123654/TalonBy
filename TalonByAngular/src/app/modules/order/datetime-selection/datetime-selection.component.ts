import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Hospital, DoctorDetails, TimeSlot } from '../../../shared/interfaces/order.interface';
import { OrderService } from '../../../core/services/order.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { formatDate } from '@angular/common';

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
  speciality: any = null;
  currentMonth: Date = new Date();
  calendar: CalendarDay[][] = [];
  weekDays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  selectedDate: Date | null = null;
  availableTimeSlots: TimeSlot[] = [];
  loading = false;
  error: string | null = null;
  isMobile = false;
  isDetailsOpen = false;
  availableSlotsMap: { [key: string]: number } = {}; // Храним количество доступных слотов по датам
  dataLoaded = false; // Флаг для отслеживания загрузки данных
  selectedTimeSlot: TimeSlot | null = null;
  selectedDateTime: Date | null = null;

  constructor(
    private router: Router,
    private orderService: OrderService
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state) {
      this.hospital = state['hospital'];
      this.doctor = state['doctor'];
      this.speciality = state['speciality'] || this.doctor?.doctorsSpeciality;
    }
    this.checkScreenSize();
  }

  ngOnInit() {
    if (!this.hospital || !this.doctor) {
      this.router.navigate(['/order']);
      return;
    }
    this.loadDoctorSchedule();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  // Загружаем расписание доктора для текущего месяца
  loadDoctorSchedule() {
    // Если данные уже загружены, просто обновляем календарь без нового запроса
    if (this.dataLoaded) {
      this.generateCalendar();
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    // Получаем текущую дату (с обнуленным временем)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Устанавливаем конечную дату на 3 месяца вперед от текущей даты
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 3);
    
    // Форматируем даты для API
    const startDateStr = this.formatDateForApi(today);
    const endDateStr = this.formatDateForApi(endDate);
    
    if (this.doctor) {
      this.orderService.getDoctorScheduleWithSlots(this.doctor.doctorId, startDateStr, endDateStr)
        .subscribe({
          next: (response) => {
            // Сохраняем количество доступных слотов по датам
            if (response && response.schedule) {
              this.availableSlotsMap = {};
              
              // Итерируем по ключам объекта schedule (даты в формате YYYY-MM-DD)
              Object.keys(response.schedule).forEach(dateKey => {
                const slots = response.schedule[dateKey];
                // Подсчитываем только доступные слоты
                const availableCount = slots.filter((slot: any) => slot.isAvailable).length;
                this.availableSlotsMap[dateKey] = availableCount;
              });
              
              // Отмечаем, что данные успешно загружены
              this.dataLoaded = true;
            }
            
            this.generateCalendar();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading doctor schedule:', err);
            this.error = 'Не удалось загрузить расписание врача';
            this.loading = false;
            this.generateCalendar(); // Все равно генерируем календарь, но с пустыми слотами
          }
        });
    } else {
      this.loading = false;
      this.generateCalendar();
    }
  }

  // Форматирование даты для API (YYYY-MM-DD)
  formatDateForApi(date: Date): string {
    return formatDate(date, 'yyyy-MM-dd', 'en-US');
  }

  // Загружаем доступные временные слоты для выбранной даты
  loadTimeSlotsForDate(date: Date) {
    if (!this.doctor) return;
    
    const dateStr = this.formatDateForApi(date);
    
    // Используем существующий метод для получения слотов
    this.loading = true;
    this.orderService.getDoctorTimeSlots(this.doctor.doctorId, dateStr, dateStr)
      .subscribe({
        next: (slots: TimeSlot[]) => {
          this.availableTimeSlots = slots.filter(slot => slot.isAvailable);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading time slots:', err);
          this.error = 'Не удалось загрузить доступные временные слоты';
          this.loading = false;
          this.availableTimeSlots = [];
        }
      });
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
      const dateKey = this.formatDateForApi(date);
      
      currentWeek.push({
        date: day,
        month: this.currentMonth.getMonth(),
        year: this.currentMonth.getFullYear(),
        isToday: this.isToday(date),
        isWeekend,
        isDisabled: date < new Date(new Date().setHours(0, 0, 0, 0)), // Отключаем прошедшие дни
        availableSlots: this.availableSlotsMap[dateKey] || 0 // Используем данные из API
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
    today.setHours(0, 0, 0, 0); // Reset time
    
    // Create date for previous month
    let prevMonth;
    if (this.currentMonth.getMonth() === 0) {
      // If current month is January, previous month is December of last year
      prevMonth = new Date(this.currentMonth.getFullYear() - 1, 11, 1);
    } else {
      prevMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    }
    
    // Determine the first day of the current month (today's month)
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Only navigate if previous month is not before current month
    if (prevMonth >= currentMonthStart) {
      this.currentMonth = prevMonth;
      this.generateCalendar(); // Update calendar without loading new data
    }
  }

  nextMonth() {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    const nextMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    
    if (nextMonth <= maxDate) {
      this.currentMonth = nextMonth;
      this.generateCalendar(); // Просто обновляем календарь без загрузки новых данных
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
      this.availableTimeSlots = [];
    } else {
      this.selectedDate = new Date(day.year, day.month, day.date);
      
      // Загружаем доступные временные слоты для выбранной даты
      this.loadTimeSlotsForDate(this.selectedDate);
      
      // Добавляем прокрутку к слотам времени после небольшой задержки,
      // чтобы дать время для отображения слотов
      setTimeout(() => {
        const timeSlotsRow = document.querySelector('.time-slots-row');
        if (timeSlotsRow) {
          timeSlotsRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
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
        speciality: this.speciality
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
    
    const regex = new RegExp(`${day}:\\s*([^,;]+)`);
    const match = this.hospital.workingHours.match(regex);
    return match ? match[1].trim() : '';
  }

  getDomain(url: string | undefined): string {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch (e) {
      return url;
    }
  }

  canGoToNextMonth(): boolean {
    const nextMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    // Allow navigation to next month as long as it's within the 3-month window
    return nextMonth <= maxDate;
  }

  canGoToPrevMonth(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Determine the first day of the previous month
    let prevMonth;
    if (this.currentMonth.getMonth() === 0) {
      // If current month is January, previous month is December of last year
      prevMonth = new Date(this.currentMonth.getFullYear() - 1, 11, 1);
    } else {
      prevMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    }
    
    // Determine the first day of the current month (today's month)
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Allow navigation if the previous month is not before the current month
    return prevMonth >= currentMonthStart;
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  toggleDetails() {
    this.isDetailsOpen = !this.isDetailsOpen;
  }

  getDayOfWeek(date: Date): string {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[date.getDay()];
  }

  getAvailableSlotsCount(): number {
    return this.availableTimeSlots.length;
  }

  // При выборе времени, переходим на страницу выбора пациента
  selectTimeSlot(timeSlot: TimeSlot) {
    if (!this.selectedDate || !timeSlot.isAvailable) return;
    
    this.loading = true;
    this.selectedTimeSlot = timeSlot;
    this.selectedDateTime = new Date(this.selectedDate);
    
    // Parse the time from timeSlot.startTime (format: "HH:MM")
    const [hours, minutes] = timeSlot.startTime.split(':').map(part => parseInt(part, 10));
    this.selectedDateTime.setHours(hours, minutes, 0, 0);
    
    // Save selected info to order service
    this.orderService.saveSelectedDateTime(this.selectedDateTime);
    this.orderService.saveSelectedDoctor(this.doctor);
    this.orderService.saveSelectedHospital(this.hospital);
    
    // Navigate to patient selection - include the data in router state as well
    this.router.navigate(['/order/patient-selection'], {
      state: {
        hospital: this.hospital,
        doctor: this.doctor,
        speciality: this.speciality,
        selectedDate: this.selectedDateTime,
        selectedTimeSlot: timeSlot
      }
    });
    
    this.loading = false;
  }

  isTimeSlotAvailable(timeSlot: TimeSlot): boolean {
    return timeSlot.isAvailable;
  }
}
