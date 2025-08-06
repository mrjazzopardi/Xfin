import { supabase } from '../lib/supabase';

class ChangeRequestService {
  // Create a new change request
  async createChangeRequest({ title, description, category = 'general', priority = 'medium' }) {
    try {
      const { data, error } = await supabase?.rpc('create_change_request', {
        p_title: title,
        p_description: description,
        p_category: category,
        p_priority: priority
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, requestId: data };
    } catch (error) {
      console.error('Error creating change request:', error);
      return { success: false, error: error?.message };
    }
  }

  // Get all change requests with optional filtering
  async getChangeRequests(filters = {}) {
    try {
      let query = supabase?.from('change_requests')?.select(`
          *,
          user:user_profiles!change_requests_user_id_fkey(id, full_name, email, role),
          assigned_user:user_profiles!change_requests_assigned_to_fkey(id, full_name, email, role)
        `)?.order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query?.eq('status', filters?.status);
      }
      if (filters?.priority) {
        query = query?.eq('priority', filters?.priority);
      }
      if (filters?.category) {
        query = query?.eq('category', filters?.category);
      }
      if (filters?.assignedTo) {
        query = query?.eq('assigned_to', filters?.assignedTo);
      }
      if (filters?.userId) {
        query = query?.eq('user_id', filters?.userId);
      }
      if (filters?.dateRange?.from) {
        query = query?.gte('created_at', filters?.dateRange?.from);
      }
      if (filters?.dateRange?.to) {
        query = query?.lte('created_at', filters?.dateRange?.to);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching change requests:', error);
      return { success: false, error: error?.message, data: [] };
    }
  }

  // Get single change request with actions
  async getChangeRequestDetails(requestId) {
    try {
      const { data: request, error: requestError } = await supabase?.from('change_requests')?.select(`
          *,
          user:user_profiles!change_requests_user_id_fkey(id, full_name, email, role),
          assigned_user:user_profiles!change_requests_assigned_to_fkey(id, full_name, email, role)
        `)?.eq('id', requestId)?.single();

      if (requestError) {
        throw new Error(requestError.message);
      }

      const { data: actions, error: actionsError } = await supabase?.from('change_request_actions')?.select(`
          *,
          user:user_profiles(id, full_name, email, role)
        `)?.eq('change_request_id', requestId)?.order('created_at', { ascending: true });

      if (actionsError) {
        throw new Error(actionsError.message);
      }

      return { 
        success: true, 
        data: { 
          ...request, 
          actions: actions || [] 
        } 
      };
    } catch (error) {
      console.error('Error fetching change request details:', error);
      return { success: false, error: error?.message };
    }
  }

  // Update change request status
  async updateStatus(requestId, newStatus, implementationDetails = null) {
    try {
      const { data, error } = await supabase?.rpc('update_change_request_status', {
        p_request_id: requestId,
        p_new_status: newStatus,
        p_implementation_details: implementationDetails
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating change request status:', error);
      return { success: false, error: error?.message };
    }
  }

  // Add implementation action
  async addImplementationAction(requestId, description, details = {}) {
    try {
      const { data, error } = await supabase?.rpc('add_implementation_action', {
        p_request_id: requestId,
        p_description: description,
        p_implementation_details: details?.implementationDetails || null,
        p_files_affected: details?.filesAffected || [],
        p_code_summary: details?.codeSummary || null
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, actionId: data };
    } catch (error) {
      console.error('Error adding implementation action:', error);
      return { success: false, error: error?.message };
    }
  }

  // Update change request basic details
  async updateChangeRequest(requestId, updates) {
    try {
      const { data, error } = await supabase?.from('change_requests')?.update({
          ...updates,
          updated_at: new Date()?.toISOString()
        })?.eq('id', requestId)?.select()?.single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating change request:', error);
      return { success: false, error: error?.message };
    }
  }

  // Get shareable link
  async getShareableLink(requestId) {
    try {
      const { data, error } = await supabase?.from('change_requests')?.select('shareable_link_id, shareable_link_expires_at, title')?.eq('id', requestId)?.single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.shareable_link_id) {
        return { success: false, error: 'No shareable link found' };
      }

      const baseUrl = window?.location?.origin || '';
      const shareableUrl = `${baseUrl}/change-request-and-actions-log/shared/${data?.shareable_link_id}`;

      return { 
        success: true, 
        data: {
          url: shareableUrl,
          linkId: data?.shareable_link_id,
          expiresAt: data?.shareable_link_expires_at,
          title: data?.title
        }
      };
    } catch (error) {
      console.error('Error getting shareable link:', error);
      return { success: false, error: error?.message };
    }
  }

  // Get change request by shareable link
  async getChangeRequestByLink(linkId) {
    try {
      const { data, error } = await supabase?.from('change_requests')?.select(`
          *,
          user:user_profiles!change_requests_user_id_fkey(id, full_name, email),
          assigned_user:user_profiles!change_requests_assigned_to_fkey(id, full_name, email)
        `)?.eq('shareable_link_id', linkId)?.gte('shareable_link_expires_at', new Date()?.toISOString())?.single();

      if (error) {
        throw new Error(error.message);
      }

      // Get actions for this request
      const { data: actions, error: actionsError } = await supabase?.from('change_request_actions')?.select(`
          *,
          user:user_profiles(id, full_name, email)
        `)?.eq('change_request_id', data?.id)?.order('created_at', { ascending: true });

      if (actionsError) {
        console.error('Error fetching actions:', actionsError);
      }

      return { 
        success: true, 
        data: { 
          ...data, 
          actions: actions || [] 
        } 
      };
    } catch (error) {
      console.error('Error fetching change request by link:', error);
      return { success: false, error: error?.message };
    }
  }

  // Get activity logs for change requests
  async getActivityLogs(filters = {}) {
    try {
      let query = supabase?.from('activity_logs')?.select(`
          *,
          user:user_profiles(id, full_name, email, role)
        `)?.in('action', [
          'change_request_created',
          'change_request_status_updated', 
          'change_request_implementation'
        ])?.order('created_at', { ascending: false });

      if (filters?.entityId) {
        query = query?.eq('entity_id', filters?.entityId);
      }
      if (filters?.userId) {
        query = query?.eq('user_id', filters?.userId);
      }
      if (filters?.dateRange?.from) {
        query = query?.gte('created_at', filters?.dateRange?.from);
      }
      if (filters?.dateRange?.to) {
        query = query?.lte('created_at', filters?.dateRange?.to);
      }

      const { data, error } = await query?.limit(100);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return { success: false, error: error?.message, data: [] };
    }
  }

  // Export change requests data
  async exportChangeRequests(format = 'json', filters = {}) {
    try {
      const { data: requests } = await this.getChangeRequests(filters);
      
      if (format === 'csv') {
        return this.exportToCSV(requests);
      }
      
      return { 
        success: true, 
        data: requests,
        filename: `change-requests-${new Date()?.toISOString()?.split('T')?.[0]}.json`
      };
    } catch (error) {
      console.error('Error exporting change requests:', error);
      return { success: false, error: error?.message };
    }
  }

  // Helper method to convert to CSV
  exportToCSV(data) {
    try {
      if (!data?.length) {
        return { success: false, error: 'No data to export' };
      }

      const headers = [
        'ID', 'Title', 'Description', 'Category', 'Priority', 'Status',
        'Created By', 'Assigned To', 'Created At', 'Updated At', 'Completed At'
      ];

      const csvContent = [
        headers?.join(','),
        ...data?.map(row => [
          row?.id || '',
          `"${(row?.title || '')?.replace(/"/g, '""')}"`,
          `"${(row?.description || '')?.replace(/"/g, '""')}"`, 
          row?.category || '',
          row?.priority || '',
          row?.status || '',
          row?.user?.full_name || '',
          row?.assigned_user?.full_name || '',
          row?.created_at || '',
          row?.updated_at || '',
          row?.completed_at || ''
        ]?.join(','))
      ]?.join('\n');

      return { 
        success: true, 
        data: csvContent,
        filename: `change-requests-${new Date()?.toISOString()?.split('T')?.[0]}.csv`
      };
    } catch (error) {
      console.error('Error converting to CSV:', error);
      return { success: false, error: error?.message };
    }
  }
}

export const changeRequestService = new ChangeRequestService();