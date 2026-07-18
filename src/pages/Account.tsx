import { useEffect, useState } from 'react';
import { User, Mail, Phone, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import CountryCodeSelect from '../components/CountryCodeSelect';

export default function Account() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    avatar_url: '',
  });
  
  // Store phone separately to avoid schema cache issues
  const [userPhone, setUserPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneWithoutCode, setPhoneWithoutCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Handle profile picture upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');
      
      // Check if the bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error checking buckets:', bucketsError);
        throw new Error('Could not access storage');
      }
      
      // Find or create a bucket
      const bucketName = 'avatars';
      const bucketExists = buckets.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log('Bucket does not exist, trying to create it...');
        // Note: Creating buckets requires admin privileges
        // We'll use a data URL approach instead for this demo
        
        // Convert file to data URL
        const reader = new FileReader();
        
        // Create a promise to handle the FileReader
        const dataUrlPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert file to data URL'));
            }
          };
          reader.onerror = () => reject(reader.error);
        });
        
        reader.readAsDataURL(file);
        const dataUrl = await dataUrlPromise;
        
        // Store the data URL in auth metadata
        await supabase.auth.updateUser({
          data: { 
            avatar_url: dataUrl 
          }
        });
        
        // Update local state
        setUser({ ...user, avatar_url: dataUrl });
        toast.success('Profile picture updated (stored in user metadata)');
        return;
      }
      
      // If we get here, the bucket exists, so proceed with normal upload
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${bucketName}/${fileName}`;
      
      // Upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
        
      // Update the user profile with the avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', authUser.id);
        
      if (updateError) {
        console.error('Error updating profile with avatar URL:', updateError);
      }
      
      // Update auth metadata (this is more reliable)
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      
      // Update local state
      setUser({ ...user, avatar_url: publicUrl });
      toast.success('Profile picture updated');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Error uploading avatar');
    } finally {
      setLoading(false);
    }
  };

  // Load user data on component mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        // Get the authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        console.log('Auth user:', authUser);
        
        if (!authUser) {
          console.log('No authenticated user found');
          return;
        }
        
        // Get user data from the users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('name, email, avatar_url')
          .eq('id', authUser.id)
          .single();
        
        console.log('Profile data from users table:', profile);
        console.log('Profile error:', profileError);
        
        // Get phone from auth metadata
        const phone = authUser.phone || authUser.user_metadata?.phone || '';
        setUserPhone(phone);
        
        if (profile) {
          // We have profile data from the users table
          setUser({
            name: profile.name || '',
            email: profile.email || '',
            avatar_url: profile.avatar_url || ''
          });
        } else {
          // If no profile in users table, use the auth user data
          console.log('Using auth user data instead');
          setUser({
            name: authUser.user_metadata?.name || '',
            email: authUser.email || '',
            avatar_url: authUser.user_metadata?.avatar_url || ''
          });
          
          // Try to create the user profile if it doesn't exist
          if (profileError && profileError.code === 'PGRST116') {
            console.log('Attempting to create user profile');
            const { error: createError } = await supabase
              .from('users')
              .insert([{
                id: authUser.id,
                name: authUser.user_metadata?.name || '',
                email: authUser.email || '',
                created_at: new Date().toISOString()
              }]);
              
            if (createError) {
              console.error('Error creating user profile:', createError);
            } else {
              console.log('User profile created successfully');
            }
          }
        }
        
        // Parse phone number to extract country code and number
        if (phone) {
          const phoneRegex = /^(\+\d+)(\d+)$/;
          const match = phone.match(phoneRegex);
          
          if (match) {
            setCountryCode(match[1]);
            setPhoneWithoutCode(match[2]);
          } else {
            setPhoneWithoutCode(phone);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('Not authenticated');
        return;
      }

      console.log('Updating profile for user:', authUser.id);

      // Combine country code with phone number
      const fullPhoneNumber = phoneWithoutCode.startsWith('+') 
        ? phoneWithoutCode 
        : `${countryCode}${phoneWithoutCode.startsWith('0') ? phoneWithoutCode.substring(1) : phoneWithoutCode}`;

      // Update auth metadata first (this is the source of truth for phone)
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { 
          name: user.name,
          phone: fullPhoneNumber 
        }
      });

      if (authUpdateError) {
        console.error('Error updating auth metadata:', authUpdateError);
        toast.error('Failed to update profile');
        return;
      }

      // Update user profile in the database
      const { error: profileUpdateError } = await supabase
        .from('users')
        .update({
          name: user.name,
          email: user.email,
        })
        .eq('id', authUser.id);

      if (profileUpdateError) {
        console.error('Error updating profile in database:', profileUpdateError);
        
        // If the profile doesn't exist yet, try to create it
        if (profileUpdateError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: authUser.id,
              name: user.name,
              email: user.email,
              created_at: new Date().toISOString()
            }]);
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            toast.error('Failed to create profile');
            return;
          }
        } else {
          toast.error('Failed to update profile');
          return;
        }
      }
      
      // Update local state
      setUserPhone(fullPhoneNumber);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Unexpected error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const form = e.currentTarget;
      const formData = new FormData(form);
      const newPassword = formData.get('newPassword') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        toast.error('Failed to update password');
      } else {
        toast.success('Password updated successfully');
        form.reset();
      }
    } catch (error: any) {
      console.error('Unexpected error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-light">Account Settings</h1>

      <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 text-gray-900 dark:text-light">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-light">Profile Information</h2>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-100 dark:border-dark-400 shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-dark-400 flex items-center justify-center border-2 border-gray-100 dark:border-dark-400 shadow-sm">
                  <User className="w-12 h-12 text-gray-400 dark:text-gray-300" />
                </div>
              )}
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition shadow-lg">
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Click to change profile picture</p>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Name</label>
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-dark-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="Your name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-dark-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Phone Number</label>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div className="flex flex-1 space-x-2">
                  <CountryCodeSelect 
                    selectedCode={countryCode} 
                    onSelect={setCountryCode} 
                  />
                  <input
                    type="tel"
                    value={phoneWithoutCode}
                    onChange={(e) => setPhoneWithoutCode(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-dark-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                    placeholder="7025551234"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter your phone number without country code</p>
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:bg-primary-400 disabled:cursor-not-allowed font-medium shadow-md shadow-primary-200 dark:shadow-none"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-600 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-dark-500 text-gray-900 dark:text-light">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-light">Security</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              className="w-full px-4 py-2 border border-gray-200 dark:border-dark-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              className="w-full px-4 py-2 border border-gray-200 dark:border-dark-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="w-full px-4 py-2 border border-gray-200 dark:border-dark-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:bg-primary-400 disabled:cursor-not-allowed font-medium shadow-md shadow-primary-200 dark:shadow-none"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}