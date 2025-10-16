import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create Supabase client for server-side operations (with service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Utility functions for future use

/**
 * Upload file to Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param file - File to upload
 * @returns Upload result
 */
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data;
};

/**
 * Get public URL for a file in Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Public URL
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

/**
 * Delete file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @returns Delete result
 */
export const deleteFile = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }

  return data;
};

/**
 * Subscribe to real-time changes in a table
 * @param table - Table name
 * @param callback - Callback function for changes
 * @returns Subscription
 */
export const subscribeToTable = (table: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table },
      callback
    )
    .subscribe();
};

/**
 * Unsubscribe from real-time changes
 * @param subscription - Subscription to unsubscribe from
 */
export const unsubscribe = (subscription: any) => {
  supabase.removeChannel(subscription);
};

// Storage bucket names (define these in Supabase dashboard)
export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  PORTFOLIO: 'portfolio',
  DOCUMENTS: 'documents',
  MESSAGES: 'messages'
} as const;

// Real-time channel names
export const REALTIME_CHANNELS = {
  MESSAGES: 'messages',
  JOBS: 'jobs',
  PROPOSALS: 'proposals',
  NOTIFICATIONS: 'notifications'
} as const;



