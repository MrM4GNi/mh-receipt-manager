import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CustomButton, FormField } from "../../components";
import { forgotPasswordRequest } from '../../lib/firebase';
import { icons } from "../../constants";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const back = async () => {
    router.push("/sign-in");
  };

  const handleForgotPassword = async () => {
    if (email.trim() === '') {
      Alert.alert("Error", 'Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      var isEmailSent = await forgotPasswordRequest(email);

      if (!isEmailSent)
      {
        Alert.alert("Not Found", "Email is not found or something went wrong. Please try again!");
        return;
      }

      Alert.alert(
        'Password Reset',
        'Please check your inbox for a link to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/sign-in');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="h-full">
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
        
        <Text className="text-2xl font-semibold mt-5 mb-5">Forgot Password</Text>

        <FormField
          title='Email'
          value={email}
          type="text"
          handleChangeText={(e) => setEmail(e)}/>

<       CustomButton 
          title={loading ? 'Sending...' : 'Send Password Reset Email'}
          containerStyles="mt-10 mb-5 w-full"
          handlePress={handleForgotPassword}
          isLoading={loading}/>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPassword;
