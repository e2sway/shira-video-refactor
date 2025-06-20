import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../styles';
import { useOnboarding } from '../hooks/useOnboardingState';
import OnboardingBackButton from '../components/OnboardingBackButton';
import OnboardingNextButton from '../components/OnboardingNextButton';
import { supabase } from '../../../supabase/supabaseClient';
import { registerWithEmail } from '../../../supabase/services';
import { signInWithGoogle, signInWithApple, isAppleSignInAvailable } from '../../../supabase/socialAuthServices';
import { createProfile } from '../../../supabase/services';
import { identifyUser } from '../../../supabase/revenueCatClient';
import { useRouter } from 'expo-router';
import Superwall, { PaywallPresentationHandler } from '@superwall/react-native-superwall';
import { initializeSuperwall } from '../../../superwall/superwallClient';

const { width } = Dimensions.get('window');

// SVG icons for social login buttons
const googleSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M22.501 12.2332C22.501 11.3699 22.4296 10.7399 22.2748 10.0865H12.2153V13.9832H18.12C18.001 14.9515 17.3582 16.4099 15.9296 17.3898L15.9096 17.5203L19.0902 19.935L19.3106 19.9565C21.3343 18.1249 22.501 15.4298 22.501 12.2332Z" fill="#4285F4"/>
<path d="M12.214 22.5C15.1068 22.5 17.5353 21.5666 19.3092 19.9567L15.9282 17.3899C15.0235 18.0083 13.8092 18.4399 12.214 18.4399C9.38069 18.4399 6.97596 16.6083 6.11874 14.0766L5.99309 14.0871L2.68583 16.5954L2.64258 16.7132C4.40446 20.1433 8.0235 22.5 12.214 22.5Z" fill="#34A853"/>
<path d="M6.12046 14.0767C5.89428 13.4234 5.77337 12.7233 5.77337 12C5.77337 11.2767 5.89428 10.5767 6.10856 9.92337L6.10257 9.78423L2.75386 7.2356L2.64429 7.28667C1.91814 8.71002 1.50146 10.3084 1.50146 12C1.50146 13.6917 1.91814 15.29 2.64429 16.7133L6.12046 14.0767Z" fill="#FBBC05"/>
<path d="M12.214 5.55997C14.2259 5.55997 15.583 6.41163 16.3569 7.12335L19.3807 4.23C17.5236 2.53834 15.1069 1.5 12.214 1.5C8.02353 1.5 4.40447 3.85665 2.64258 7.28662L6.10686 9.92332C6.97598 7.39166 9.38073 5.55997 12.214 5.55997Z" fill="#EB4335"/>
</svg>`;

const appleSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17.543 12.0271C17.5552 10.5373 18.2363 9.12754 19.4338 8.22586C18.4921 6.93965 17.0152 6.14889 15.4338 6.07765C13.7524 5.90557 12.1338 7.05765 11.2795 7.05765C10.4252 7.05765 9.08662 6.09644 7.67807 6.12557C5.81945 6.18431 4.13662 7.22586 3.28662 8.85765C1.45738 12.1444 2.80662 17.0271 4.56662 19.7156C5.45738 21.0271 6.48662 22.4853 7.84662 22.4271C9.17807 22.3689 9.67807 21.5727 11.2795 21.5727C12.881 21.5727 13.3524 22.4271 14.7338 22.3979C16.1524 22.3689 17.0431 21.0853 17.9048 19.7737C18.5859 18.8138 19.0921 17.7444 19.4048 16.6169C17.9338 15.9649 17.0431 14.0853 17.543 12.0271Z" fill="white"/>
<path d="M14.7919 4.58431C15.5626 3.67181 15.9626 2.49931 15.9044 1.29932C14.7044 1.38681 13.5919 1.93431 12.7919 2.82181C12.0044 3.68431 11.5919 4.85681 11.6626 5.99931C12.8626 6.02844 14.0044 5.51681 14.7919 4.58431Z" fill="white"/>
</svg>`;

// Define our custom colors
const PURPLE_COLOR = colors.primary;
const PINK_COLOR = '#e15190';

// Validation functions
const validateEmail = (email: string): boolean => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

const AccountCreationScreen: React.FC = () => {
    const { goToNextStep, goToPreviousStep, state } = useOnboarding();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
    const router = useRouter();
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const inputSlideAnim1 = useRef(new Animated.Value(50)).current;
    const inputSlideAnim2 = useRef(new Animated.Value(50)).current;
    const socialSlideAnim1 = useRef(new Animated.Value(50)).current;
    const socialSlideAnim2 = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        // Initialize Superwall when component mounts
        const setupSuperwall = async () => {
            try {
                await initializeSuperwall();
                console.log('[AccountCreation] Superwall initialized successfully');
            } catch (error) {
                console.error('[AccountCreation] Error initializing Superwall:', error);
                // Continue anyway since we'll retry initialization before showing the paywall
            }
        };
        
        setupSuperwall();
        
        // Main content animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
        
        // Staggered animations for inputs and social buttons
        Animated.stagger(100, [
            Animated.timing(socialSlideAnim1, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(socialSlideAnim2, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(inputSlideAnim1, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(inputSlideAnim2, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();

        // Check if Apple Sign-In is available
        async function checkAppleSignIn() {
            const available = await isAppleSignInAvailable();
            setAppleSignInAvailable(available);
        }
        
        checkAppleSignIn();
        
        // Check if user is already authenticated (coming from login screen)
        async function checkAuthStatus() {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                console.log('User is already authenticated:', session.user.id);
                
                // Check if user already has a profile
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (existingProfile) {
                    console.log('User already has a profile, redirecting to learn page');
                    router.replace('/learn');
                    return;
                }
                
                // If we're here, user is authenticated but doesn't have a profile
                // We'll let them continue with the onboarding process
                console.log('User is authenticated but needs to complete profile setup');
                
                // Pre-fill email if available
                if (session.user.email) {
                    setEmail(session.user.email);
                }
                
                // Pre-fill name if available in user metadata
                if (session.user.user_metadata?.name) {
                    setName(session.user.user_metadata.name);
                } else if (session.user.user_metadata?.full_name) {
                    setName(session.user.user_metadata.full_name);
                }
            }
        }
        
        checkAuthStatus();
    }, []);

    // Updated showOnboardingPaywall function using PaywallPresentationHandler
    const showOnboardingPaywall = async (userId: string) => {
        console.log('[AccountCreation] Showing onboarding complete paywall');
        
        // Make sure Superwall is initialized
        try {
            const success = await initializeSuperwall();
            if (!success) {
                console.error('[AccountCreation] Failed to initialize Superwall');
                setLoading(false);
                router.replace('/learn');
                return;
            }
        } catch (error) {
            console.error('[AccountCreation] Error initializing Superwall:', error);
            setLoading(false);
            router.replace('/learn');
            return;
        }
        
        // Prepare user attributes
        const userAttributes = {
            userId: userId,
            email: email,
            displayName: name || email.split('@')[0],
            targetLanguage: state.selectedLanguage || 'Spanish',
            fromOnboarding: true,
        };
        
        // Set user attributes first
        try {
            await Superwall.shared.setUserAttributes(userAttributes);
            console.log('[AccountCreation] User attributes set in Superwall');
            
            // Create a handler object as per documentation
            const handler = new PaywallPresentationHandler();
            
            // Add handlers to it
            handler.onPresent((paywallInfo) => {
                console.log('[AccountCreation] Paywall presented:', paywallInfo?.name);
                setLoading(false); // Stop loading state
            });
            
            handler.onDismiss((paywallInfo, paywallResult) => {
                console.log('[AccountCreation] Paywall dismissed:', paywallInfo?.name);
                console.log('[AccountCreation] Navigating to learn screen after dismiss');
                // Still navigate to the learn screen even if user dismisses
                router.replace('/learn');
            });
            
            handler.onError((error) => {
                console.error('[AccountCreation] Error presenting paywall:', error);
                setLoading(false);
                Alert.alert('Error', 'Could not load subscription options. Continuing to app.');
                router.replace('/learn');
            });
            
            handler.onSkip((skipReason) => {
                console.log(`[AccountCreation] Paywall skipped, reason: ${String(skipReason)}`);
                router.replace('/learn');
            });
            
            // Register with the handler object
            console.log('[AccountCreation] Registering paywall placement with handler');
            Superwall.shared.register({
                placement: 'onboarding_complete',
                params: {
                    source: 'onboarding',
                    context: 'account_creation_complete'
                },
                handler: handler, // Pass the handler object
                feature: async () => {
                    // This function is called when:
                    // 1. The user completes a purchase
                    // 2. The user already has access to the feature
                    // 3. The paywall is set to non-gated and user dismisses it
                    console.log('[AccountCreation] Feature callback executed - purchase successful or user already has access');
                    
                    // Navigate to the learn screen
                    console.log('[AccountCreation] Navigating to learn screen from feature callback');
                    router.replace('/learn');
                }
            });
            
            console.log('[AccountCreation] Paywall registration completed');
        } catch (error) {
            console.error('[AccountCreation] Error setting user attributes or registering paywall:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to prepare subscription options. Continuing to app.');
            router.replace('/learn');
        }
    };

    const handleEmailSignUp = async () => {
        if (!validateEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        if (!validatePassword(password)) {
            Alert.alert('Weak Password', 'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.');
            return;
        }

        try {
            setLoading(true);
            
            // First check if user is already authenticated
            const { data: { session } } = await supabase.auth.getSession();
            let userId = session?.user?.id;
            
            // If not already authenticated, register with email
            if (!userId) {
                try {
                    const { user, session } = await registerWithEmail(email, password);
                    
                    if (!user) {
                        Alert.alert('Registration Error', 'Failed to register user. Please try again.');
                        setLoading(false);
                        return;
                    }

                    userId = user.id;
                    console.log(`New user registered with ID: ${userId}`);
                } catch (registerError) {
                    console.error('Registration error:', registerError);
                    Alert.alert('Registration Error', registerError instanceof Error ? registerError.message : 'An unexpected error occurred. Please try again.');
                    setLoading(false);
                    return;
                }
            } else {
                console.log(`User already authenticated with ID: ${userId}`);
            }
            
            // Create user profile
            try {
                const { selectedLanguage } = state;
                
                await createProfile(userId, {
                    display_name: name || email.split('@')[0],
                    target_lang: selectedLanguage || 'Spanish',
                    daily_goal: 5
                });
                
                // Save onboarding completion status
                await AsyncStorage.setItem('onboardingInProgress', 'true');
                console.log('Profile created successfully');
                
                // FIXED: Mark that we're creating a new account for RevenueCat
                await AsyncStorage.setItem('isCreatingNewAccount', 'true');
                console.log('Marked as new account for RevenueCat identification');
                
                // Identify user with RevenueCat
                try {
                    await identifyUser(userId);
                    console.log(`User identified with RevenueCat: ${userId}`);
                } catch (rcError) {
                    console.error('Error identifying user with RevenueCat:', rcError);
                    // Continue even if RevenueCat identification fails
                }
                
                // Show onboarding paywall directly
                await showOnboardingPaywall(userId);
                
            } catch (profileError) {
                console.error('Error creating profile:', profileError);
                Alert.alert('Profile Error', 'Failed to create user profile. Please try again.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Registration Error', 'An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleSocialSignUp = async (provider: 'google' | 'apple') => {
        try {
            setLoading(true);
            
            // First check if user is already authenticated
            const { data: { session } } = await supabase.auth.getSession();
            let userId = session?.user?.id;
            let userEmail = session?.user?.email;
            let userName = session?.user?.user_metadata?.name || 
                          session?.user?.user_metadata?.full_name || 
                          session?.user?.email?.split('@')[0] || 
                          'User';
            
            // If not already authenticated, perform social sign-in
            if (!userId) {
                let result;
                if (provider === 'google') {
                    result = await signInWithGoogle();
                } else if (provider === 'apple') {
                    result = await signInWithApple();
                }
                
                if (!result?.user) {
                    // User cancelled or sign-in failed
                    if (result === null) {
                        console.log(`${provider} sign-up cancelled by user`);
                    } else {
                        console.error(`Error signing up with ${provider}:`, result);
                        Alert.alert('Error', `Failed to sign up with ${provider}. Please try again.`);
                    }
                    setLoading(false);
                    return;
                }
                
                // Set user info from the result
                userId = result.user.id;
                userEmail = result.user.email;
                userName = result.user.user_metadata?.full_name || 
                          result.user.user_metadata?.name || 
                          result.user.email?.split('@')[0] || 
                          'User';
                
                console.log(`Successfully signed up with ${provider}:`, result.user);
            } else {
                console.log(`User already authenticated with ID: ${userId}`);
            }
            
            // Check if the user already has a profile
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (!existingProfile) {
                // This is a new user - create a profile
                console.log('Creating new profile for user:', userId);
                try {
                    const { selectedLanguage } = state;
                    
                    await createProfile(userId, {
                        display_name: userName,
                        target_lang: selectedLanguage || 'Spanish',
                        daily_goal: 5
                    });
                    
                    // Save onboarding in progress status
                    await AsyncStorage.setItem('onboardingInProgress', 'true');
                    console.log('Profile created successfully');
                    
                    // FIXED: Mark that we're creating a new account for RevenueCat
                    await AsyncStorage.setItem('isCreatingNewAccount', 'true');
                    console.log('Marked as new account for RevenueCat identification');
                    
                    // Identify user with RevenueCat
                    try {
                        await identifyUser(userId);
                        console.log(`User identified with RevenueCat: ${userId}`);
                    } catch (rcError) {
                        console.error('Error identifying user with RevenueCat:', rcError);
                        // Continue even if RevenueCat identification fails
                    }
                } catch (profileError) {
                    console.error('Error creating profile:', profileError);
                    Alert.alert('Profile Error', 'Failed to create user profile. Please try again.');
                    setLoading(false);
                    return;
                }
            } else {
                console.log('User already has a profile, proceeding to paywall');
                
                // Ensure user is identified with RevenueCat even if they already have a profile
                try {
                    await identifyUser(userId);
                    console.log(`User identified with RevenueCat: ${userId}`);
                } catch (rcError) {
                    console.error('Error identifying user with RevenueCat:', rcError);
                    // Continue even if RevenueCat identification fails
                }
            }
            
            // Show onboarding paywall directly
            await showOnboardingPaywall(userId);
            
        } catch (error) {
            console.error(`Error signing up with ${provider}:`, error);
            
            // If the error indicates the user already exists but doesn't have a profile
            if (error instanceof Error && error.message.includes('User already registered')) {
                Alert.alert(
                    'Account Already Exists', 
                    `An account with this ${provider} login already exists. Please use the login screen instead.`,
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => setLoading(false)
                        },
                        {
                            text: 'Go to Login',
                            onPress: () => {
                                setLoading(false);
                                router.replace('/login');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', `Failed to sign up with ${provider}. Please try again.`);
                setLoading(false);
            }
        }
    };

    return (
        <View style={styles.container}>
            {/* Back button */}
            <View style={styles.topBlock}>
                <OnboardingBackButton onPress={goToPreviousStep} />
            </View>

            <KeyboardAvoidingView 
                style={styles.keyboardView} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <ScrollView 
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View 
                        style={[
                            styles.mainContent,
                            { 
                                opacity: fadeAnim, 
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <Text style={styles.headerText}>Join Our Community!</Text>
                        <Text style={styles.subHeaderText}>
                            Create an account to start your language learning journey
                        </Text>

                        <View style={styles.socialButtonsContainer}>
                            {appleSignInAvailable && (
                                <Animated.View
                                    style={{ 
                                        opacity: fadeAnim, 
                                        transform: [{ translateY: socialSlideAnim1 }],
                                        width: '100%'
                                    }}
                                >
                                    <TouchableOpacity
                                        style={[styles.socialButton, styles.appleButton]}
                                        onPress={() => handleSocialSignUp('apple')}
                                        disabled={loading}
                                    >
                                        <SvgXml xml={appleSvg} width={24} height={24} />
                                        <Text style={styles.socialButtonText}>Continue with Apple</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                            
                            <Animated.View
                                style={{ 
                                    opacity: fadeAnim, 
                                    transform: [{ translateY: socialSlideAnim2 }],
                                    width: '100%'
                                }}
                            >
                                <TouchableOpacity 
                                    style={[styles.socialButton, styles.googleButton]} 
                                    onPress={() => handleSocialSignUp('google')}
                                    disabled={loading}
                                >
                                    <SvgXml xml={googleSvg} width={24} height={24} />
                                    <Text style={[styles.socialButtonText, styles.googleButtonText]}>Continue with Google</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>

                        <View style={styles.orContainer}>
                            <View style={styles.orLine} />
                            <Text style={styles.orText}>or</Text>
                            <View style={styles.orLine} />
                        </View>

                        <View style={styles.emailHeaderContainer}>
                            <View style={styles.emailHeaderAccent} />
                            <Text style={styles.emailHeader}>Sign up with Email</Text>
                        </View>
                        
                        <View style={styles.inputsContainer}>
                            <Animated.View 
                                style={{ 
                                    opacity: fadeAnim, 
                                    transform: [{ translateY: inputSlideAnim1 }],
                                    width: '100%'
                                }}
                            >
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color={colors.subText} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor={colors.subText}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </Animated.View>

                            <Animated.View 
                                style={{ 
                                    opacity: fadeAnim, 
                                    transform: [{ translateY: inputSlideAnim2 }],
                                    width: '100%'
                                }}
                            >
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color={colors.subText} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Create a password"
                                        placeholderTextColor={colors.subText}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity 
                                        onPress={() => setShowPassword(!showPassword)} 
                                        style={styles.eyeButton}
                                    >
                                        <Ionicons 
                                            name={showPassword ? "eye-outline" : "eye-off-outline"} 
                                            size={20} 
                                            color={colors.subText} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
            
            {/* Continue button at bottom */}
            <View style={styles.buttonSection}>
                <OnboardingNextButton
                    title="Create Account"
                    onPress={handleEmailSignUp}
                    loading={loading}
                    gradientColors={[PURPLE_COLOR, PINK_COLOR]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 20,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    topBlock: {
        paddingTop: 50,
        marginBottom: 20,
    },
    mainContent: {
        flex: 1,
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    subHeaderText: {
        fontSize: 16,
        color: colors.subText,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    socialButtonsContainer: {
        width: '100%',
        marginTop: 20,
        marginBottom: 20,
        gap: 12,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 12,
    },
    appleButton: {
        backgroundColor: '#000',
    },
    googleButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginLeft: 12,
    },
    googleButtonText: {
        color: '#000',
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    orText: {
        color: colors.subText,
        marginHorizontal: 16,
        fontSize: 14,
    },
    emailHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    emailHeaderAccent: {
        width: 4,
        height: 24,
        backgroundColor: PINK_COLOR,
        borderRadius: 2,
        marginRight: 8,
    },
    emailHeader: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    inputsContainer: {
        width: '100%',
        gap: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputIcon: {
        marginRight: 12,
        opacity: 0.7,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        height: '100%',
        paddingVertical: 8,
        fontWeight: '400',
    },
    eyeButton: {
        padding: 10,
        opacity: 0.7,
    },
    buttonSection: {
        marginVertical: 30,
        paddingHorizontal: 0,
    },
});

export default AccountCreationScreen; 