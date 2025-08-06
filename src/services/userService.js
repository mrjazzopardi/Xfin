import { supabase } from '../lib/supabase';

export const userService = {
  // Get all users (with role-based filtering)
  async getUsers(filters = {}) {
    try {
      let query = supabase?.from('user_profiles')?.select(`
          id,
          email,
          full_name,
          role,
          department,
          phone,
          avatar_url,
          is_active,
          permissions,
          created_at,
          updated_at
        `)?.order('created_at', { ascending: false })

      // Apply filters
      if (filters?.role && filters?.role !== 'all') {
        query = query?.eq('role', filters?.role)
      }

      if (filters?.status && filters?.status !== 'all') {
        const isActive = filters?.status === 'active'
        query = query?.eq('is_active', isActive)
      }

      if (filters?.search) {
        query = query?.or(`full_name.ilike.%${filters?.search}%,email.ilike.%${filters?.search}%`)
      }

      const { data, error } = await query

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, users: data || [] }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Your Supabase project may be paused or deleted.' 
        }
      }
      
      console.error('User service error:', error)
      return { success: false, error: 'Failed to load users.' }
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()

      if (error) {
        if (error?.code === 'PGRST116') {
          return { success: false, error: 'User not found.' }
        }
        return { success: false, error: error?.message };
      }

      return { success: true, user: data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch user details.' 
        }
      }
      
      console.error('User service error:', error)
      return { success: false, error: 'Failed to load user details.' }
    }
  },

  // Update user
  async updateUser(userId, updates) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.eq('id', userId)?.select()?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, user: data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to update user.' 
        }
      }
      
      console.error('User service error:', error)
      return { success: false, error: 'Failed to update user.' }
    }
  },

  // Bulk update users
  async bulkUpdateUsers(userIds, updates) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.in('id', userIds)?.select()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, users: data || [] }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database for bulk update.' 
        }
      }
      
      console.error('User service error:', error)
      return { success: false, error: 'Failed to update users.' }
    }
  },

  // Get user activity logs
  async getUserActivityLogs(userId, limit = 50) {
    try {
      const { data, error } = await supabase?.from('activity_logs')?.select('*')?.eq('user_id', userId)?.order('created_at', { ascending: false })?.limit(limit)

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, logs: data || [] }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to fetch activity logs.' 
        }
      }
      
      console.error('User service error:', error)
      return { success: false, error: 'Failed to load activity logs.' }
    }
  },

  // Log user activity
  async logActivity(action, entityType = null, entityId = null, details = null) {
    try {
      const { data, error } = await supabase?.from('activity_logs')?.insert({
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          created_at: new Date()?.toISOString()
        })?.select()?.single()

      if (error) {
        // Don't fail the main operation if logging fails
        console.error('Failed to log activity:', error)
        return { success: false, error: error?.message };
      }

      return { success: true, log: data }
    } catch (error) {
      console.error('User service error:', error)
      return { success: false, error: 'Failed to log activity.' }
    }
  }
}