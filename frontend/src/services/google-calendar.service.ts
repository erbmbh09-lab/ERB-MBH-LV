import { Injectable, signal, computed } from '@angular/core';

// This service is adapted for a Zoneless Angular environment where `gapi` and `google`
// from the CDN are loaded into the window scope.
declare const window: any;

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { date: string } | { dateTime: string, timeZone?: string };
  end: { date: string } | { dateTime: string, timeZone?: string };
  attendees?: { email: string }[];
  htmlLink?: string;
  colorId?: string;
  extendedProperties?: {
      private?: { [key: string]: string };
  };
}


@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {
  private gapiReady = signal(false);
  private gisReady = signal(false);
  private tokenClient: any = null;
  private clientId = '';

  isReady = computed(() => this.gapiReady() && this.gisReady());
  isSignedIn = signal(false);
  
  userProfile = signal<any | null>(null);
  events = signal<GoogleCalendarEvent[]>([]);

  constructor() {
    this.loadGapiScript();
    this.loadGisScript();
  }

  private loadGapiScript() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => window.gapi.load('client', () => this.gapiReady.set(true));
    document.body.appendChild(script);
  }

  private loadGisScript() {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.gisReady.set(true);
    document.body.appendChild(script);
  }

  async initClient(clientId: string) {
    this.clientId = clientId;
    await new Promise<void>(resolve => {
        const checkReady = () => {
            if(this.isReady()) {
                resolve();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    });

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error) {
            throw resp;
          }
          this.isSignedIn.set(true);
          this.fetchProfileAndEvents();
        },
      });
      await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
    } catch (err) {
      console.error('Error initializing Google client', err);
    }
  }

  signIn() {
    if (!this.tokenClient) {
        console.error("Google client not initialized. Cannot sign in.");
        return;
    }
    if (window.gapi.client.getToken() === null) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
  }

  signOut() {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        window.gapi.client.setToken(null);
        this.isSignedIn.set(false);
        this.userProfile.set(null);
        this.events.set([]);
      });
    }
  }

  private async fetchProfileAndEvents() {
    try {
        const profile = await window.gapi.client.oauth2.userinfo.get();
        this.userProfile.set(profile.result);
        this.listUpcomingEvents();
    } catch (err) {
        console.error(err);
    }
  }

  async listUpcomingEvents(maxResults: number = 50) {
    if (!this.isSignedIn()) return;
    try {
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': maxResults,
        'orderBy': 'startTime'
      });
      this.events.set(response.result.items);
    } catch (err) {
      console.error(err);
    }
  }

  async createEvent(event: Partial<GoogleCalendarEvent>) {
    if (!this.isSignedIn()) return;
    try {
      const response = await window.gapi.client.calendar.events.insert({
        'calendarId': 'primary',
        'resource': event
      });
      console.log('Event created: ', response.result);
      this.listUpcomingEvents(); 
      return response.result;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async createOrUpdateEvent(event: Partial<GoogleCalendarEvent>) {
    if (!this.isSignedIn()) return;

    const privateProps = event.extendedProperties?.private;
    let privateExtendedProperty: string | undefined;

    if (privateProps) {
        if (privateProps['appSessionId']) {
            privateExtendedProperty = `appSessionId=${privateProps['appSessionId']}`;
        } else if (privateProps['appTaskId']) {
            privateExtendedProperty = `appTaskId=${privateProps['appTaskId']}`;
        }
    }

    if (!privateExtendedProperty) {
      // If no unique ID is provided, just create a new event without checking for existence.
      return this.createEvent(event);
    }

    // Find existing event
    try {
        const response = await window.gapi.client.calendar.events.list({
            calendarId: 'primary',
            privateExtendedProperty: privateExtendedProperty,
            maxResults: 1
        });
        
        const existingEvent = response.result.items?.[0];

        if (existingEvent) {
            // Update
            const updateResponse = await window.gapi.client.calendar.events.update({
                calendarId: 'primary',
                eventId: existingEvent.id,
                resource: event
            });
            this.listUpcomingEvents();
            return updateResponse.result;
        } else {
            // Create
            return this.createEvent(event);
        }
    } catch (err) {
        console.error('Error in createOrUpdateEvent:', err);
        throw err;
    }
  }
}