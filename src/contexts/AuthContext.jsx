import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Get initial session - Use Promise chain
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)
        }
        setLoading(false)
      })?.catch(error => {
        console.error('Error getting session:', error)
        setLoading(false)
      })

    // Listen for auth changes - NEVER ASYNC callback
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session?.user)
          fetchUserProfile(session?.user?.id)  // Fire-and-forget, NO AWAIT
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
        setAuthError(null) // Clear auth errors on state change
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single()

      if (error) {
        if (error?.code === 'PGRST116') {
          // Profile doesn't exist, user might be newly created
          setUserProfile(null)
          return
        }
        console.error('Error fetching user profile:', error)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error)
    }
  }

  const signIn = async (email, password) => {
    try {
      setAuthError(null)
      setLoading(true)

      const { data, error } = await supabase?.auth?.signInWithPassword({
        email,
        password
      })

      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }

      return { success: true, user: data?.user };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        const message = 'Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.'
        setAuthError(message)
        return { success: false, error: message }
      }
      
      const message = 'Something went wrong during sign in. Please try again.'
      setAuthError(message)
      console.error('JavaScript error in signIn:', error)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    try {
      setAuthError(null)
      setLoading(true)

      const { data, error } = await supabase?.auth?.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata?.fullName || '',
            role: metadata?.role || 'staff'
          }
        }
      })

      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }

      return { success: true, user: data?.user };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        const message = 'Cannot connect to authentication service. Your Supabase project may be paused or inactive. Please check your Supabase dashboard and resume your project if needed.'
        setAuthError(message)
        return { success: false, error: message }
      }
      
      const message = 'Something went wrong during sign up. Please try again.'
      setAuthError(message)
      console.error('JavaScript error in signUp:', error)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setAuthError(null)
      const { error } = await supabase?.auth?.signOut()
      
      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }

      setUser(null)
      setUserProfile(null)
      return { success: true }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        const message = 'Cannot connect to authentication service. You may be offline or the service is temporarily unavailable.'
        setAuthError(message)
        return { success: false, error: message }
      }
      
      const message = 'Something went wrong during sign out. Please try again.'
      setAuthError(message)
      console.error('JavaScript error in signOut:', error)
      return { success: false, error: message }
    }
  }

  const updateProfile = async (updates) => {
    try {
      setAuthError(null)

      if (!user?.id) {
        const message = 'No authenticated user found'
        setAuthError(message)
        return { success: false, error: message }
      }

      const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', user?.id)?.select()?.single()

      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }

      setUserProfile(data)
      return { success: true, profile: data }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('NetworkError')) {
        const message = 'Cannot connect to database. Your Supabase project may be paused or deleted. Please visit your Supabase dashboard to check project status.'
        setAuthError(message)
        return { success: false, error: message }
      }
      
      const message = 'Failed to update profile'
      setAuthError(message)
      console.error('JavaScript error in updateProfile:', error)
      return { success: false, error: message }
    }
  }

  const resetPassword = async (email) => {
    try {
      setAuthError(null)

      const { error } = await supabase?.auth?.resetPasswordForEmail(email, {
        redirectTo: `${window.location?.origin}/reset-password`
      })

      if (error) {
        setAuthError(error?.message)
        return { success: false, error: error?.message };
      }

      return { success: true }
    } catch (error) {
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('AuthRetryableFetchError')) {
        const message = 'Cannot connect to authentication service. Your Supabase project may be paused or inactive.'
        setAuthError(message)
        return { success: false, error: message }
      }
      
      const message = 'Something went wrong sending password reset email. Please try again.'
      setAuthError(message)
      console.error('JavaScript error in resetPassword:', error)
      return { success: false, error: message }
    }
  }

  const clearAuthError = () => {
    setAuthError(null)
  }

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    clearAuthError,
    // Helper properties
    isAuthenticated: !!user,
    isPartner: userProfile?.role === 'partner',
    isStaff: userProfile?.role === 'staff',
    isFreelancer: userProfile?.role === 'freelancer',
    isClient: userProfile?.role === 'client'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}