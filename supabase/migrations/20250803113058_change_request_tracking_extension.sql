-- Location: supabase/migrations/20250803113058_change_request_tracking_extension.sql
-- Schema Analysis: Extends existing activity_logs table for change request tracking
-- Integration Type: Extension - building upon existing activity logging system
-- Dependencies: activity_logs, user_profiles, log_activity function

-- Create enum for change request status
CREATE TYPE public.change_request_status AS ENUM (
    'submitted',
    'in_progress', 
    'completed',
    'cancelled',
    'on_hold'
);

-- Create enum for change request priority
CREATE TYPE public.change_request_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

-- Create change_requests table to track user requests
CREATE TABLE public.change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    priority public.change_request_priority DEFAULT 'medium'::public.change_request_priority,
    status public.change_request_status DEFAULT 'submitted'::public.change_request_status,
    assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]'::jsonb,
    shareable_link_id TEXT UNIQUE,
    shareable_link_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- Create change_request_actions table to track implementation actions
CREATE TABLE public.change_request_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    change_request_id UUID REFERENCES public.change_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'status_change', 'comment', 'assignment', 'implementation', 'file_upload'
    action_description TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    implementation_details TEXT,
    files_affected TEXT[],
    code_changes_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Essential indexes for performance
CREATE INDEX idx_change_requests_user_id ON public.change_requests(user_id);
CREATE INDEX idx_change_requests_status ON public.change_requests(status);
CREATE INDEX idx_change_requests_priority ON public.change_requests(priority);
CREATE INDEX idx_change_requests_assigned_to ON public.change_requests(assigned_to);
CREATE INDEX idx_change_requests_created_at ON public.change_requests(created_at);
CREATE INDEX idx_change_requests_shareable_link_id ON public.change_requests(shareable_link_id);

CREATE INDEX idx_change_request_actions_request_id ON public.change_request_actions(change_request_id);
CREATE INDEX idx_change_request_actions_user_id ON public.change_request_actions(user_id);
CREATE INDEX idx_change_request_actions_created_at ON public.change_request_actions(created_at);

-- Enable RLS
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_request_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for change_requests
CREATE POLICY "users_can_view_all_change_requests"
ON public.change_requests
FOR SELECT
TO authenticated
USING (true); -- All authenticated users can view all requests

CREATE POLICY "users_can_create_own_change_requests"
ON public.change_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_change_requests"
ON public.change_requests
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR assigned_to = auth.uid())
WITH CHECK (user_id = auth.uid() OR assigned_to = auth.uid());

-- RLS policies for change_request_actions
CREATE POLICY "users_can_view_all_change_request_actions"
ON public.change_request_actions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "users_can_create_change_request_actions"
ON public.change_request_actions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Function to generate shareable links
CREATE OR REPLACE FUNCTION public.generate_shareable_link()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    link_id TEXT;
BEGIN
    link_id := encode(gen_random_bytes(16), 'base64');
    link_id := replace(replace(replace(link_id, '/', '_'), '+', '-'), '=', '');
    RETURN link_id;
END;
$$;

-- Function to create change request with auto-logging
CREATE OR REPLACE FUNCTION public.create_change_request(
    p_title TEXT,
    p_description TEXT,
    p_category TEXT DEFAULT 'general',
    p_priority public.change_request_priority DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_request_id UUID;
    shareable_link TEXT;
BEGIN
    -- Generate shareable link
    shareable_link := public.generate_shareable_link();
    
    -- Create the change request
    INSERT INTO public.change_requests (
        user_id, title, description, category, priority, 
        shareable_link_id, shareable_link_expires_at
    )
    VALUES (
        auth.uid(), p_title, p_description, p_category, p_priority,
        shareable_link, NOW() + INTERVAL '30 days'
    )
    RETURNING id INTO new_request_id;
    
    -- Log the activity using existing function
    PERFORM public.log_activity(
        'change_request_created',
        'change_request',
        new_request_id,
        jsonb_build_object(
            'title', p_title,
            'category', p_category,
            'priority', p_priority::TEXT,
            'shareable_link', shareable_link
        )
    );
    
    -- Create initial action record
    INSERT INTO public.change_request_actions (
        change_request_id, user_id, action_type, action_description, new_value
    )
    VALUES (
        new_request_id, auth.uid(), 'creation', 
        'Change request created: ' || p_title,
        jsonb_build_object('status', 'submitted', 'priority', p_priority::TEXT)
    );
    
    RETURN new_request_id;
END;
$$;

-- Function to update change request status with auto-logging
CREATE OR REPLACE FUNCTION public.update_change_request_status(
    p_request_id UUID,
    p_new_status public.change_request_status,
    p_implementation_details TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_status public.change_request_status;
    request_title TEXT;
BEGIN
    -- Get current status and title
    SELECT status, title INTO old_status, request_title
    FROM public.change_requests
    WHERE id = p_request_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update the request
    UPDATE public.change_requests 
    SET 
        status = p_new_status,
        updated_at = NOW(),
        completed_at = CASE WHEN p_new_status = 'completed' THEN NOW() ELSE completed_at END
    WHERE id = p_request_id;
    
    -- Log the activity
    PERFORM public.log_activity(
        'change_request_status_updated',
        'change_request',
        p_request_id,
        jsonb_build_object(
            'title', request_title,
            'old_status', old_status::TEXT,
            'new_status', p_new_status::TEXT,
            'implementation_details', p_implementation_details
        )
    );
    
    -- Create action record
    INSERT INTO public.change_request_actions (
        change_request_id, user_id, action_type, action_description, 
        old_value, new_value, implementation_details
    )
    VALUES (
        p_request_id, auth.uid(), 'status_change',
        'Status changed from ' || old_status::TEXT || ' to ' || p_new_status::TEXT,
        jsonb_build_object('status', old_status::TEXT),
        jsonb_build_object('status', p_new_status::TEXT),
        p_implementation_details
    );
    
    RETURN TRUE;
END;
$$;

-- Function to add implementation action
CREATE OR REPLACE FUNCTION public.add_implementation_action(
    p_request_id UUID,
    p_description TEXT,
    p_implementation_details TEXT DEFAULT NULL,
    p_files_affected TEXT[] DEFAULT '{}',
    p_code_summary TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    action_id UUID;
    request_title TEXT;
BEGIN
    -- Get request title
    SELECT title INTO request_title
    FROM public.change_requests
    WHERE id = p_request_id;
    
    -- Create action record
    INSERT INTO public.change_request_actions (
        change_request_id, user_id, action_type, action_description,
        implementation_details, files_affected, code_changes_summary
    )
    VALUES (
        p_request_id, auth.uid(), 'implementation', p_description,
        p_implementation_details, p_files_affected, p_code_summary
    )
    RETURNING id INTO action_id;
    
    -- Log the activity
    PERFORM public.log_activity(
        'change_request_implementation',
        'change_request',
        p_request_id,
        jsonb_build_object(
            'title', request_title,
            'implementation_description', p_description,
            'files_affected', p_files_affected,
            'action_id', action_id
        )
    );
    
    RETURN action_id;
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_change_request_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_change_request_updated_at
    BEFORE UPDATE ON public.change_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_change_request_timestamp();

-- Mock data for demonstration
DO $$
DECLARE
    existing_user_id UUID;
    partner_user_id UUID;
    request1_id UUID;
    request2_id UUID;
    request3_id UUID;
BEGIN
    -- Get existing users
    SELECT id INTO existing_user_id FROM public.user_profiles WHERE role = 'staff' LIMIT 1;
    SELECT id INTO partner_user_id FROM public.user_profiles WHERE role = 'partner' LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        -- Create sample change requests using function
        SELECT public.create_change_request(
            'Add Dark Mode Toggle',
            'Users have requested a dark mode option in the application settings. This should include a toggle switch in the header and persist user preference.',
            'ui_enhancement',
            'medium'::public.change_request_priority
        ) INTO request1_id;
        
        SELECT public.create_change_request(
            'Export to Excel Feature',
            'Add ability to export financial reports to Excel format with proper formatting and charts.',
            'feature_request',
            'high'::public.change_request_priority
        ) INTO request2_id;
        
        SELECT public.create_change_request(
            'Fix Login Page Responsiveness',
            'Login page does not display correctly on mobile devices. Form elements overlap and submit button is cut off.',
            'bug_fix',
            'urgent'::public.change_request_priority
        ) INTO request3_id;
        
        -- Update some statuses and add implementation actions
        PERFORM public.update_change_request_status(
            request1_id, 
            'in_progress'::public.change_request_status,
            'Started implementing dark mode styles using CSS variables'
        );
        
        PERFORM public.add_implementation_action(
            request1_id,
            'Added dark mode CSS variables and toggle component',
            'Implemented CSS custom properties for light/dark themes. Created ToggleSwitch component in components/ui/. Updated global styles to support theme switching.',
            ARRAY['src/styles/globals.css', 'src/components/ui/ToggleSwitch.jsx', 'src/contexts/ThemeContext.jsx'],
            'Added theme context, CSS variables, and toggle component with persistence'
        );
        
        PERFORM public.update_change_request_status(
            request3_id,
            'completed'::public.change_request_status,
            'Fixed responsive issues by updating CSS grid and form validation styles'
        );
        
        -- Assign request to partner
        IF partner_user_id IS NOT NULL THEN
            UPDATE public.change_requests 
            SET assigned_to = partner_user_id 
            WHERE id = request2_id;
        END IF;
        
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data creation failed: %', SQLERRM;
END $$;