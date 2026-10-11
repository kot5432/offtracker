const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class SupabaseClient {
  constructor() {
    this.url = process.env.SUPABASE_URL;
    this.anonKey = process.env.SUPABASE_ANON_KEY;
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.url || !this.anonKey) {
      console.warn('Supabase credentials not found. Using local storage only.');
      this.client = null;
    } else {
      // Use anon key for client-side operations
      this.client = createClient(this.url, this.anonKey);
      
      // Service role client for server-side operations
      this.serviceClient = this.serviceRoleKey 
        ? createClient(this.url, this.serviceRoleKey)
        : null;
    }
  }

  // Session operations
  async createSession(sessionData) {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return null;
    }
    
    return data;
  }

  async updateSession(sessionId, updateData) {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating session:', error);
      return null;
    }
    
    return data;
  }

  async getSession(sessionId) {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return data;
  }

  async getCurrentSession() {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('sessions')
      .select('*')
      .eq('status', 'active')
      .order('start_time', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error getting current session:', error);
      return null;
    }
    
    return data;
  }

  // Raw Event operations
  async createRawEvent(eventData) {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('raw_events')
      .insert(eventData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating raw event:', error);
      return null;
    }
    
    return data;
  }

  async getRawEventsBySession(sessionId) {
    if (!this.client) return [];
    
    const { data, error } = await this.client
      .from('raw_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Error getting raw events:', error);
      return [];
    }
    
    return data || [];
  }

  // Activity operations
  async createActivity(activityData) {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('activities')
      .insert(activityData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating activity:', error);
      return null;
    }
    
    return data;
  }

  async getActivitiesBySession(sessionId) {
    if (!this.client) return [];
    
    const { data, error } = await this.client
      .from('activities')
      .select('*')
      .eq('session_id', sessionId)
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error('Error getting activities:', error);
      return [];
    }
    
    return data || [];
  }

  // Result operations
  async createResult(resultData) {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('results')
      .insert(resultData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating result:', error);
      return null;
    }
    
    return data;
  }

  // Reflection operations
  async createReflection(reflectionData) {
    if (!this.client) return null;
    
    const { data, error } = await this.client
      .from('reflections')
      .insert(reflectionData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating reflection:', error);
      return null;
    }
    
    return data;
  }

  // Check if Supabase is available
  isAvailable() {
    return this.client !== null;
  }
}

module.exports = new SupabaseClient();
