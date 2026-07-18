import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import CountryCodeSelect from '../components/CountryCodeSelect';
import { supabase } from '../lib/supabase';
import { signUpWithEmail, signInWithPhone, verifyOtp, signInWithGoogle } from '../lib/auth';

export default function Register() {
  const navigate = useNavigate();
  const [isPhoneRegistration, setIsPhoneRegistration] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Registration functions are now implemented directly in the button onClick handlers

  // Phone registration functions are now implemented directly in the button onClick handlers

  const handleGoogleRegistration = async () => {
    try {
      const { error } = await signInWithGoogle();

      if (error) throw new Error(error);
    } catch (error: any) {
      toast.error(error.message || 'Failed to register with Google');
    }
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank you for your registration!</h2>
            <p className="text-gray-600 mb-6">
              We're glad you're here! Before you start exploring, we just sent you the email confirmation.
            </p>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
            
            <button
              onClick={() => setRegistrationComplete(false)}
              className="w-full mt-3 py-2 text-blue-600 hover:text-blue-700 transition"
            >
              Resend email confirmation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-center flex-1 pr-5">Create New Account</h1>
          </div>

          <div className="flex justify-center mb-6">
            <img 
              src="/images/register-illustration.svg" 
              alt="Register" 
              className="h-40 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://via.placeholder.com/150?text=Register';
              }}
            />
          </div>

          <div className="flex space-x-2 mb-6">
            <button
              className={`flex-1 py-2 px-4 rounded-lg transition ${
                !isPhoneRegistration ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setIsPhoneRegistration(false)}
            >
              Email
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg transition ${isPhoneRegistration ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => {
                setIsPhoneRegistration(true);
                toast('Note: Phone authentication requires additional Supabase configuration.', { icon: 'ℹ️' });
              }}
            >
              Phone
            </button>
          </div>

          {isPhoneRegistration ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex space-x-2">
                  <CountryCodeSelect 
                    selectedCode={countryCode} 
                    onSelect={setCountryCode} 
                    disabled={showOtpInput}
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="7025551234"
                    disabled={showOtpInput}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter your phone number without country code</p>
              </div>
              
              {!showOtpInput && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      placeholder="••••••••"
                    />
                  </div>
                </>
              )}
              
              {showOtpInput && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="Enter OTP"
                  />
                </div>
              )}
              
              <button
                type="button"
                onClick={() => {
                  console.log('Phone registration button clicked');
                  
                  // Combine country code with phone number
                  const fullPhoneNumber = phoneNumber.startsWith('+') 
                    ? phoneNumber 
                    : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
                  
                  if (!showOtpInput) {
                    if (password !== confirmPassword) {
                      toast.error('Passwords do not match');
                      return;
                    }
                    
                    if (password.length < 6) {
                      toast.error('Password must be at least 6 characters long');
                      return;
                    }

                    // Show loading toast
                    const loadingToast = toast.loading('Sending OTP...');
                    console.log('Sending OTP to:', fullPhoneNumber);

                    signInWithPhone(fullPhoneNumber)
                      .then(({ error }) => {
                        if (error) {
                          console.error('OTP send error:', error);
                          toast.dismiss(loadingToast);
                          toast.error(error);
                          return;
                        }
                        
                        toast.dismiss(loadingToast);
                        setShowOtpInput(true);
                        toast.success('OTP sent to your phone!');
                      })
                      .catch((err: any) => {
                        console.error('Unexpected error:', err);
                        toast.dismiss(loadingToast);
                        toast.error('An unexpected error occurred');
                      });
                  } else {
                    // Show loading toast
                    const loadingToast = toast.loading('Verifying OTP...');
                    console.log('Verifying OTP:', otp, 'for phone:', fullPhoneNumber);

                    verifyOtp(fullPhoneNumber, otp)
                      .then(({ data, error }) => {
                        if (error) {
                          console.error('OTP verification error:', error);
                          toast.dismiss(loadingToast);
                          toast.error(error);
                          return;
                        }

                        console.log('OTP verification successful:', data);

                        // Create a profile record in the users table
                        if (data?.user && data.user.id) {
                          const userData = {
                            name,
                            phone: fullPhoneNumber,
                          };
                          
                          // Using an immediately invoked async function to handle profile update
                          (async () => {
                            try {
                              // Update user profile
                              const { error: profileError } = await supabase
                                .from('users')
                                .upsert([
                                  { 
                                    id: data.user!.id,
                                    ...userData,
                                    created_at: new Date().toISOString(),
                                  },
                                ], { onConflict: 'id' });
                              
                              if (profileError) {
                                console.error('Profile update error:', profileError);
                                toast.dismiss(loadingToast);
                                toast.error('Failed to create user profile');
                                return;
                              }
                              
                              toast.dismiss(loadingToast);
                              toast.success('Registration successful!');
                              navigate('/');
                            } catch (err: any) {
                              console.error('Profile update unexpected error:', err);
                              toast.dismiss(loadingToast);
                              toast.error('An unexpected error occurred');
                            }
                          })();
                        } else {
                          toast.dismiss(loadingToast);
                          toast.success('Registration successful!');
                          navigate('/');
                        }
                      })
                      .catch((err: any) => {
                        console.error('Unexpected error:', err);
                        toast.dismiss(loadingToast);
                        toast.error('An unexpected error occurred');
                      });
                  }
                }}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {showOtpInput ? 'Verify OTP' : 'Send OTP'}
              </button>

              {showOtpInput && (
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpInput(false);
                    setOtp('');
                  }}
                  className="w-full py-2 text-blue-600 hover:text-blue-700 transition"
                >
                  Change Phone Number
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="••••••••"
                />
              </div>
              
              <button
                type="button"
                onClick={() => {
                  console.log('Register button clicked');
                  if (password !== confirmPassword) {
                    toast.error('Passwords do not match');
                    return;
                  }
                  
                  if (password.length < 6) {
                    toast.error('Password must be at least 6 characters long');
                    return;
                  }
                  
                  // Show loading toast
                  const loadingToast = toast.loading('Creating your account...');
                  console.log('Attempting to register with:', { email, password, name });
                  
                  // Create the user with email and password
                  const userData = {
                    name,
                    email
                  };
                  
                  signUpWithEmail(email, password, userData)
                    .then(({ error }) => {
                      if (error) {
                        console.error('Registration error:', error);
                        toast.dismiss(loadingToast);
                        toast.error(error);
                        return;
                      }
                      
                      toast.dismiss(loadingToast);
                      setRegistrationComplete(true);
                      toast.success('Registration successful! Please check your email for verification.');
                    })
                    .catch(err => {
                      console.error('Unexpected error:', err);
                      toast.dismiss(loadingToast);
                      toast.error('An unexpected error occurred');
                    });
                }}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Register
              </button>
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleRegistration}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
