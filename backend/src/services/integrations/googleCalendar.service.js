const { google } = require('googleapis');
const { logger } = require('../../config/logger');

const googleCalendarService = {
  getAuthClient(credentials) {
    const auth = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri
    );
    
    auth.setCredentials({
      refresh_token: credentials.refresh_token
    });
    
    return auth;
  },

  async checkAvailability(credentials, date, duration = 60) {
    try {
      const auth = this.getAuthClient(credentials);
      const calendar = google.calendar({ version: 'v3', auth });
      
      const startTime = new Date(date);
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startTime.toISOString(),
          timeMax: endTime.toISOString(),
          items: [{ id: credentials.calendar_id || 'primary' }]
        }
      });
      
      const busy = response.data.calendars[credentials.calendar_id || 'primary'].busy;
      const isAvailable = busy.length === 0;
      
      return {
        available: isAvailable,
        suggestedTimes: isAvailable ? [] : this.getSuggestedTimes(busy, startTime)
      };
    } catch (error) {
      logger.error('Error checking calendar availability:', error);
      throw error;
    }
  },

  async createEvent(credentials, eventData) {
    try {
      const auth = this.getAuthClient(credentials);
      const calendar = google.calendar({ version: 'v3', auth });
      
      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'America/Sao_Paulo'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'America/Sao_Paulo'
        },
        attendees: eventData.attendees || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      };
      
      const response = await calendar.events.insert({
        calendarId: credentials.calendar_id || 'primary',
        requestBody: event,
        sendUpdates: 'all'
      });
      
      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      logger.error('Error creating calendar event:', error);
      throw error;
    }
  },

  async listEvents(credentials, date) {
    try {
      const auth = this.getAuthClient(credentials);
      const calendar = google.calendar({ version: 'v3', auth });
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const response = await calendar.events.list({
        calendarId: credentials.calendar_id || 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      return response.data.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date
      }));
    } catch (error) {
      logger.error('Error listing calendar events:', error);
      throw error;
    }
  },

  getSuggestedTimes(busySlots, requestedTime) {
    // Simple algorithm to suggest alternative times
    const suggestions = [];
    const dayStart = new Date(requestedTime);
    dayStart.setHours(8, 0, 0, 0);
    
    const dayEnd = new Date(requestedTime);
    dayEnd.setHours(18, 0, 0, 0);
    
    // Find free slots during business hours
    // This is a simplified implementation
    return suggestions;
  }
};

module.exports = { googleCalendarService };