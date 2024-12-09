import { Image, StyleSheet, Dimensions, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Onboarding from 'react-native-onboarding-swiper';
import { router } from "expo-router";
import { boardingScreenHide } from '../lib/firebase';
import { Loader } from '../components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../constants/registerForPushNotifications';

const { width } = Dimensions.get('window');

const Index = () => {
    const pages=[
        {
            backgroundColor: '#5E62AC',
            image: <Image source={require('../assets/splash.png')} style={styles.image}/>,
            title: 'Welcome to R-Scanner',
            subtitle: 'Easily track your household expenses with automated receipt scanning and smart categorization.',
        },
        {
            backgroundColor: '#5E62AC',
            image: <Image source={require('../assets/splash.png')} style={styles.image}/>,
            title: 'Scan Receipts Effortlessly',
            subtitle: 'Use your phone’s camera to scan receipts quickly. Our app will automatically extract and organize the details for you.',
        },
        {
            backgroundColor: '#5E62AC',
            image: <Image source={require('../assets/splash.png')} style={styles.image}/>,
            title: 'Smart Categorization',
            subtitle: 'Our powerful NLP technology automatically categorizes your expenses, making it easier to track where your money goes.',
        },
        {
            backgroundColor: '#5E62AC',
            image: <Image source={require('../assets/splash.png')} style={styles.image}/>,
            title: 'Household Sharing',
            subtitle: 'Share the app with your household members and keep everyone on the same page. Collaborate and manage your finances together.',
        },
        {
            backgroundColor: '#5E62AC',
            image: <Image source={require('../assets/splash.png')} style={styles.image}/>,
            title: 'Cloud and Local Backups',
            subtitle: 'Secure your data with automatic cloud backups. Schedule local backups to keep your information safe and accessible.',
        },
        {
            backgroundColor: '#5E62AC',
            image: <Image source={require('../assets/splash.png')} style={styles.image}/>,
            title: 'Powerful Analytics',
            subtitle: 'Gain insights into your spending habits with detailed analytics and reports. Make informed financial decisions for your household.',
        }
    ];
    const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(null);
    const [isLoading, setLoading] = useState(true);

    useEffect(() => {
        const notif = async () => {
            try {
                const token = await registerForPushNotifications();
                //Alert.alert("Notification", token);
            } catch (error) {
                Alert.alert("Error", error.message);
                console.log("Error", error.message);
            }
        };
        
        notif();

        const subscription = Notifications.addNotificationReceivedListener(notification => {
          console.log("Notification received!", notification);
        });
    
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        const checkOnboardingStatus = async () => {
          const status = await AsyncStorage.getItem('onboardingCompleted');
          const isUserLoggedIn = await AsyncStorage.getItem('userId');
          const onboardingCompleted = status === 'true';

          setIsOnboardingCompleted(onboardingCompleted);
          if ((isUserLoggedIn !== '' && isUserLoggedIn !== null && isUserLoggedIn !== 'logout') && onboardingCompleted)
            router.push("/home");
          else if (status === false || status === null)
            setLoading(false);
          else
            router.push("/sign-in");
        };
    
        checkOnboardingStatus();
    }, []);
    
    const done = async () => {
        try {
            await boardingScreenHide();
    
            router.push("/sign-in");
        } catch (error) {
            Alert.alert("Error", error);
        }
    }

    return (
        <SafeAreaView className="w-full h-full">
            {(isOnboardingCompleted === null || isOnboardingCompleted === false) && (
                <>
                    {(isOnboardingCompleted === false) && (
                        <Onboarding
                            pages={pages}
                            onDone={done}
                            showSkip={false}
                            showDone={true}
                        />
                    )}
                </>
            )}
            
            <Loader isLoading={isLoading}/>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    bgColor: {
        backgroundColor: '#5E62AC',
    },
    image: {
        display: 'none'
    },
});

export default Index