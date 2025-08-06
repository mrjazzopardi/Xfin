import { supabase } from '../lib/supabase';

export const authService = {
  // Sign in with email and password
  async signInWithPassword(email, password) {
    try {
      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, user: data?.user, session: data?.session };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to authentication service. Your Supabase project may be paused.' 
        }
      }
      
      console.error('Auth service error:', error)
      return { success: false, error: 'An unexpected error occurred during sign in.' }
    }
  },

  // Sign up with email and password
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.fullName || '',
            role: userData?.role || 'staff'
          }
        }
      })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, user: data?.user, session: data?.session };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to authentication service. Your Supabase project may be paused.' 
        }
      }
      
      console.error('Auth service error:', error)
      return { success: false, error: 'An unexpected error occurred during sign up.' }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase?.auth?.signOut()
      
      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to authentication service to sign out.' 
        }
      }
      
      console.error('Auth service error:', error)
      return { success: false, error: 'An unexpected error occurred during sign out.' }
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data, error } = await supabase?.auth?.getSession()
      
      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, session: data?.session };
    } catch (error) {
      console.error('Auth service error:', error)
      return { success: false, error: 'Failed to get current session.' }
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()

      if (error) {
        if (error?.code === 'PGRST116') {
          return { success: false, error: 'User profile not found.' }
        }
        return { success: false, error: error?.message };
      }

      return { success: true, profile: data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database. Please check your connection.' 
        }
      }
      
      console.error('Auth service error:', error)
      return { success: false, error: 'Failed to fetch user profile.' }
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', userId)?.select()?.single()

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true, profile: data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to database to update profile.' 
        }
      }
      
      console.error('Auth service error:', error)
      return { success: false, error: 'Failed to update user profile.' }
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase?.auth?.resetPasswordForEmail(email, {
        redirectTo: `${window.location?.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error?.message };
      }

      return { success: true }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to authentication service to reset password.' 
        }
      }
      
      console.error('Auth service error:', error)
      return { success: false, error: 'Failed to send password reset email.' }
    }
  }
}