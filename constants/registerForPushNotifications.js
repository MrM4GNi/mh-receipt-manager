import * as Notifications from 'expo-notifications';
import { requestPermissionsAsync } from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserTokenToDatabase } from '../lib/firebase';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

function handleRegistrationError(errorMessage) {
    alert(errorMessage);
    throw new Error(errorMessage);
}

export const registerForPushNotifications = async () => {
    if (Platform.OS === 'android') {
        try {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        } catch (error) {
            //Alert.alert("Error", 'Error setting notification channel:', error.message);
            throw new Error(error);
        }
    }

    if (!Device.isDevice) {
        //Alert.alert('Must use a physical device for push notifications');
        throw new Error('Must use a physical device for push notifications');
    }

    /*if (Device.isDevice) {
        
    } else {
        throw new Error('Must use physical device for push notifications');
    }*/

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        Alert.alert("Error", 'Permission not granted for push notifications');
        return;
    }

    const projectId = "9b99bf8f-5fd9-4332-9330-b073bc5f657c";
    if (!projectId) {
        throw new Error('Project ID not found');
    }
    /*if (finalStatus === 'granted') {
        Alert.alert("Final status", finalStatus);

        const pushTokenString = (await Notifications.getExpoPushTokenAsync()).data;
        Alert.alert("Push Notification Token:", pushTokenString);
        
        const isUserLoggedIn = await AsyncStorage.getItem('userId');

        if (isUserLoggedIn !== null && isUserLoggedIn !== '')
            try {
                await saveUserTokenToDatabase(isUserLoggedIn, pushTokenString);
            } catch (error) {
                throw new Error(error.message);
            }
    }*/

    const pushTokenString = await Notifications.getExpoPushTokenAsync({projectId: "9b99bf8f-5fd9-4332-9330-b073bc5f657c",});

    const isUserLoggedIn = await AsyncStorage.getItem('userId');

    if (isUserLoggedIn && pushTokenString.data)
    {
        try {
            //Alert.alert("User Id", isUserLoggedIn);
            await saveUserTokenToDatabase(isUserLoggedIn, pushTokenString.data);
        } catch (error) {
            //Alert.alert("Error", error.message);
            throw new Error(error.message);
        }
    }

    return pushTokenString.data;
};