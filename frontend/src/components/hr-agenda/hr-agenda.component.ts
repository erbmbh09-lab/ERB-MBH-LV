import { Component, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { DataHubService } from '../../services/data-hub.service';
import { AgendaEvent, Employee } from '../../services/hr.service';
import { NotificationService } from '../../services/notification.service';
import { GoogleCalendarService, GoogleCalendarEvent } from '../../services/google-calendar.service';

// Combined interface for display purposes
interface DisplayEvent {
  id: string | number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  location?: string;
  description?: string;
  color: AgendaEvent['color'] | 'gray';
  isGoogleEvent?: boolean;
  htmlLink?: string;
  isAllDay: boolean;
}

@Component({
  selector: 'app-hr-agenda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hr-agenda.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe] // Added DatePipe to providers
})
export class HrAgendaComponent {
  private dataHubService = inject(DataHubService);
  private notificationService = inject(NotificationService);
  googleCalendarService = inject(GoogleCalendarService);
  private fb: FormBuilder = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  isModalVisible = signal(false);
  editingEventId = signal<number | null>(null);
  currentDate = signal(new Date());

  eventForm = this.fb.group({
    title: ['', Validators.required],
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    attendees: this.fb.array([]),
    location: [''],
    description: [''],
    color: ['blue' as AgendaEvent['color'], Validators.required],
    syncToGoogle: [false]
  });

  allEmployees = this.dataHubService.hr.employees;
  
  colors: { value: AgendaEvent['color'], label: string, class: string }[] = [
    { value: 'blue', label: 'أزرق', class: 'bg-blue-500' },
    { value: 'green', label: 'أخضر', class: 'bg-green-500' },
    { value: 'indigo', label: 'بنفسجي', class: 'bg-indigo-500' },
    { value: 'rose', label: 'وردي', class: 'bg-rose-500' },
    { value: 'yellow', label: 'أصفر', class: 'bg-yellow-500' },
    { value: 'red', label: 'أحمر', class: 'bg-red-500' },
  ];

  weekDays = computed(() => {
    const startOfWeek = new Date(this.currentDate());
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      return date;
    });
  });

  eventsByDay = computed(() => {
    const eventsMap = new Map<string, DisplayEvent[]>();
    const week = this.weekDays();
    const weekStart = week[0];
    const weekEnd = new Date(week[6]);
    weekEnd.setHours(23, 59, 59, 999);

    // Initialize map for all days of the week
    for (const day of week) {
      const dateKey = this.datePipe.transform(day, 'yyyy-MM-dd');
      if (dateKey) {
        eventsMap.set(dateKey, []);
      }
    }

    // Process internal events
    const agendaEvents = this.dataHubService.hr.agendaEvents();
    if (agendaEvents) {
        for (const event of agendaEvents) {
            const eventDate = new Date(event.date);
            eventDate.setMinutes(eventDate.getMinutes() + eventDate.getTimezoneOffset());
            
            if (eventDate >= weekStart && eventDate <= weekEnd) {
                const dateKey = this.datePipe.transform(eventDate, 'yyyy-MM-dd');
                if (dateKey && eventsMap.has(dateKey)) {
                    const displayEvent: DisplayEvent = {
                        ...event,
                        isAllDay: false,
                    };
                    eventsMap.get(dateKey)?.push(displayEvent);
                }
            }
        }
    }

    // Process Google Calendar events
    const googleEvents = this.googleCalendarService.events();
    if (googleEvents) {
        for (const gEvent of googleEvents) {
            if (!gEvent || !gEvent.id || !gEvent.start || !gEvent.end || (!('dateTime' in gEvent.start) && !('date' in gEvent.start)) || (!('dateTime' in gEvent.end) && !('date' in gEvent.end))) {
                continue;
            }

            const start = 'dateTime' in gEvent.start ? new Date(gEvent.start.dateTime!) : new Date(gEvent.start.date!);
            const end = 'dateTime' in gEvent.end ? new Date(gEvent.end.dateTime!) : new Date(gEvent.end.date!);
            
            let currentDate = new Date(start);
            currentDate.setHours(0, 0, 0, 0);

            while (currentDate <= end) {
                if (currentDate >= weekStart && currentDate <= weekEnd) {
                    const dateKey = this.datePipe.transform(currentDate, 'yyyy-MM-dd');
                    if (dateKey && eventsMap.has(dateKey)) {
                        const isAllDay = 'date' in gEvent.start;
                        const displayEvent: DisplayEvent = {
                            id: gEvent.id,
                            title: gEvent.summary || '(بدون عنوان)',
                            date: dateKey,
                            startTime: isAllDay ? '' : this.datePipe.transform(start, 'HH:mm') || '',
                            endTime: isAllDay ? '' : this.datePipe.transform(end, 'HH:mm') || '',
                            attendees: gEvent.attendees?.map(a => a.email) || [],
                            location: gEvent.location,
                            description: gEvent.description,
                            color: 'gray',
                            isGoogleEvent: true,
                            htmlLink: gEvent.htmlLink,
                            isAllDay: isAllDay,
                        };
                        
                        if (!eventsMap.get(dateKey)?.some(e => e.id === gEvent.id)) {
                            eventsMap.get(dateKey)?.push(displayEvent);
                        }
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    }

    // Sort events within each day
    for (const key of eventsMap.keys()) {
      eventsMap.get(key)?.sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        return a.startTime.localeCompare(b.startTime);
      });
    }

    return eventsMap;
  });

  get attendeesFormArray() {
    return this.eventForm.get('attendees') as FormArray;
  }

  addAttendee() {
    this.attendeesFormArray.push(this.fb.control(''));
  }

  removeAttendee(index: number) {
    this.attendeesFormArray.removeAt(index);
  }

  previousWeek() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() - 7);
      return newDate;
    });
  }

  nextWeek() {
    this.currentDate.update(d => {
      const newDate = new Date(d);
      newDate.setDate(d.getDate() + 7);
      return newDate;
    });
  }

  goToToday() {
    this.currentDate.set(new Date());
  }

  getEventColorClass(color: AgendaEvent['color'] | 'gray'): string {
    const colorMap = {
      blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
      indigo: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
      rose: 'border-rose-500 bg-rose-50 dark:bg-rose-900/20',
      yellow: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      red: 'border-red-500 bg-red-50 dark:bg-red-900/20',
      gray: 'border-gray-500 bg-gray-50 dark:bg-gray-700/20',
    };
    return colorMap[color];
  }

  openModal(event: DisplayEvent | null = null, dateForNewEvent?: Date) {
    this.eventForm.reset();
    this.attendeesFormArray.clear();
    
    if (event && !event.isGoogleEvent) {
      this.editingEventId.set(event.id as number);
      const internalEvent = this.dataHubService.hr.agendaEvents().find(e => e.id === event.id);
      if (internalEvent) {
        this.eventForm.patchValue({
          ...internalEvent,
          syncToGoogle: false, // Default
        });
        internalEvent.attendees.forEach(attendeeName => {
            this.attendeesFormArray.push(this.fb.control(attendeeName));
        });
      }
    } else {
      this.editingEventId.set(null);
      this.eventForm.patchValue({
        date: this.datePipe.transform(dateForNewEvent || new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        color: 'blue',
        syncToGoogle: this.googleCalendarService.isSignedIn()
      });
      this.addAttendee();
    }
    this.isModalVisible.set(true);
  }

  closeModal() {
    this.isModalVisible.set(false);
    this.editingEventId.set(null);
  }

  async onSubmit() {
    if (this.eventForm.invalid) {
      this.notificationService.addNotification({ type: 'alert', title: 'بيانات غير مكتملة', message: 'يرجى ملء جميع الحقول الإلزامية.' });
      return;
    }

    const formValue = this.eventForm.getRawValue();
    const eventData: Omit<AgendaEvent, 'id'> = {
        title: formValue.title!,
        date: formValue.date!,
        startTime: formValue.startTime!,
        endTime: formValue.endTime!,
        attendees: (formValue.attendees! as string[]).filter(name => name && name.trim() !== ''),
        location: formValue.location || undefined,
        description: formValue.description || undefined,
        color: formValue.color!
    };

    if (this.editingEventId()) {
      this.dataHubService.hr.updateAgendaEvent({ ...eventData, id: this.editingEventId()! });
      this.notificationService.addNotification({ type: 'success', title: 'تم التحديث', message: `تم تحديث الحدث "${eventData.title}"` });
    } else {
      this.dataHubService.hr.addAgendaEvent(eventData);
      this.notificationService.addNotification({ type: 'success', title: 'تم الإنشاء', message: `تم إنشاء حدث "${eventData.title}"` });
    }
    
    if (formValue.syncToGoogle && this.googleCalendarService.isSignedIn()) {
        const startDateTime = new Date(`${formValue.date}T${formValue.startTime}`);
        const endDateTime = new Date(`${formValue.date}T${formValue.endTime}`);
        const attendeesEmails = (formValue.attendees! as string[])
            .map(name => {
              const employee = this.allEmployees().find(e => e.name === name);
              // Mocking email from phone for demo
              return employee?.mobilePhone ? { email: `${employee.mobilePhone}@example.com` } : null;
            })
            .filter((item): item is { email: string } => item !== null);

        const googleEvent: Partial<GoogleCalendarEvent> = {
            summary: formValue.title!,
            location: formValue.location || undefined,
            description: formValue.description || undefined,
            start: { dateTime: startDateTime.toISOString(), timeZone: 'Asia/Dubai' },
            end: { dateTime: endDateTime.toISOString(), timeZone: 'Asia/Dubai' },
            attendees: attendeesEmails
        };
        try {
            await this.googleCalendarService.createEvent(googleEvent);
            this.notificationService.addNotification({ type: 'success', title: 'تمت المزامنة', message: 'تمت مزامنة الحدث مع تقويم جوجل بنجاح.' });
        } catch (e) {
            console.error('Failed to sync event with Google Calendar:', e);
            this.notificationService.addNotification({ type: 'alert', title: 'خطأ في المزامنة', message: 'فشل مزامنة الحدث مع تقويم جوجل. يرجى التحقق من اتصالك أو صلاحيات الحساب.' });
        }
    }

    this.closeModal();
  }

  deleteEvent(eventId: number | string) {
    if (typeof eventId === 'number' && confirm('هل أنت متأكد من حذف هذا الحدث؟')) {
      this.dataHubService.hr.deleteAgendaEvent(eventId);
      this.notificationService.addNotification({ type: 'success', title: 'تم الحذف', message: 'تم حذف الحدث بنجاح.' });
    }
  }
}
