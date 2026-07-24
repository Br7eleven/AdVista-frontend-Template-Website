import { supabase } from './supabase';

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('Calling supabase.auth.signInWithPassword with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Supabase auth response:', { data: !!data, error });
    
    if (error) {
      console.error('Supabase auth error:', error);
      throw error;
    }
    return { data, error: null };
  } catch (error: any) {
    console.error('Exception in signInWithEmail:', error);
    return { 
      data: null, 
      error: error.message || error.toString() || 'Failed to sign in' 
    };
  }
};

/**
 * Sign in with phone number (step 1: send OTP)
 */
export const signInWithPhone = async (phone: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to send OTP' };
  }
};

/**
 * Verify OTP for phone sign in (step 2)
 */
export const verifyOtp = async (phone: string, token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Invalid OTP' };
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string, userData: any) => {
  try {
    console.log('Starting signUpWithEmail with:', { email, userData });
    
    // Create the user with email and password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      console.error('Error during signUp:', error);
      throw error;
    }

    console.log('SignUp successful, user data:', data);

    // Create or update the user profile
    if (data.user) {
      console.log('Creating user profile for:', data.user.id);
      
      try {
        // First attempt - try to insert directly
        const { error: profileError } = await supabase
          .from('users')
          .upsert([
            { 
              id: data.user.id,
              ...userData,
              created_at: new Date().toISOString(),
            },
          ], { onConflict: 'id' });

        if (profileError) {
            console.error('Error creating user profile:', profileError);
            throw profileError;
        } else {
          console.log('User profile created successfully');
        }
      } catch (profileErr) {
        console.error('Error in profile creation:', profileErr);
        // We don't throw the error here to allow registration to complete
        // The user can update their profile later when logged in
      }
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Registration failed:', error);
    return { data: null, error: error.message || 'Failed to sign up' };
  }
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || 'Failed to sign in with Google' };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    console.info('Signing out current Supabase session');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    const { data } = await supabase.auth.getSession();
    console.info('Supabase session after sign out:', !!data.session);

    return { error: null };
  } catch (error: any) {
    console.error('Supabase sign out failed:', error);
    return { error: error.message || 'Failed to sign out' };
  }
};

/**
 * Resend confirmation email
 */
export const resendConfirmationEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Failed to resend confirmation email' };
  }
};

/**
 * Reset password with email
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Failed to send reset password link' };
  }
};

/**
 * Update user password
 */
export const updatePassword = async (password: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Failed to update password' };
  }
};

/**
 * Get the current user
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to get user' };
  }
};

/**
 * Get the current user's profile
 */
export const getUserProfile = async () => {
  try {
    const { user, error: userError } = await getCurrentUser();
    if (userError || !user) throw new Error(userError || 'User not found');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // Distinguish "no rows" from actual errors
      if (error.code === 'PGRST116') {
        return { profile: null, error: 'Profile not found', notFound: true };
      }
      throw error;
    }
    return { profile: data, error: null, notFound: false };
  } catch (error: any) {
    return { profile: null, error: error.message || 'Failed to get user profile' };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profile: any) => {
  try {
    const { user, error: userError } = await getCurrentUser();
    if (userError || !user) throw new Error(userError || 'User not found');

    const { error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', user.id);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message || 'Failed to update profile' };
  }
};

/**
 * Upload avatar image
 */
export const uploadAvatar = async (file: File) => {
  try {
    const { user, error: userError } = await getCurrentUser();
    if (userError || !user) throw new Error(userError || 'User not found');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Upload the file to storage
    const { error: uploadError } = await supabase.storage
      .from('user-content')
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-content')
      .getPublicUrl(filePath);
      
    // Update the user profile with the avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
      
    if (updateError) throw updateError;
    
    return { publicUrl, error: null };
  } catch (error: any) {
    return { publicUrl: null, error: error.message || 'Failed to upload avatar' };
  }
};
