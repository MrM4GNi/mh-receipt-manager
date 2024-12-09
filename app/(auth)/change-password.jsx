import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CustomButton, FormField } from "../../components";
import { changedPassword } from '../../lib/firebase';
import { icons } from "../../constants";

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const back = async () => {
        router.push("/profile");
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
    
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New password and confirm password do not match');
            return;
        }
    
        setLoading(true);
    
        try 
        {
            const isChanged = await changedPassword(currentPassword, newPassword);

            console.log(isChanged);
            if (isChanged) {
                Alert.alert('Confirmation', 'Password Successfullty changed.',
                    [
                        {
                          text: 'Ok',
                          onPress: () => {
                            back();
                          },
                        },
                    ]
                );
            }
        } catch (error)
        {
            Alert.alert('Error', error);
        }
    };

    return (
        <SafeAreaView className="w-full h-full">
            <View style={{ padding: 20 }}>
                <TouchableOpacity
                onPress={back}
                className="flex"
                >
                <Image
                    source={icons.leftArrow}
                    resizeMode="contain"
                    className="w-6 h-6"
                />
                </TouchableOpacity>
                
                <Text className="text-2xl font-semibold mt-5 mb-5">Change Password</Text>

                <FormField
                    title="Current Password"
                    otherStyles="mt-5"
                    value={currentPassword}
                    handleChangeText={(e) => setCurrentPassword(e)}
                    type="text"/>

                <FormField
                    title="New Password"
                    otherStyles="mt-5"
                    value={newPassword}
                    handleChangeText={(e) => setNewPassword(e)}
                    type="text"/>

                <FormField
                    title="Confirm Password"
                    otherStyles="mt-5"
                    value={confirmPassword}
                    handleChangeText={(e) => setConfirmPassword(e)}
                    type="text"/>

                <CustomButton 
                    title={loading ? 'Changing...' : 'Change Password'}
                    containerStyles="mt-10 mb-5 w-full"
                    handlePress={handleChangePassword}
                    isLoading={loading}/>
            </View>
        </SafeAreaView>
    )
}

export default ChangePassword