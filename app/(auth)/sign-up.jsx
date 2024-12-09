import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Image, BackHandler } from 'react-native';
import React from 'react';
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomButton, FormField } from "../../components";
import { icons } from "../../constants";
import { signUp } from '../../lib/firebase';

const SignUp = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const currentYear = new Date().getFullYear();

  const formatDate = () => {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };

    return new Date().toLocaleString('en-US', options);
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleString('default', { month: 'long' });
  };
  
  const [form, setForm] = useState({
    fullName: "",
    mobileNo: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: "Free",
    budget: '0',
    storage: 500,
    scanReceipt: 0,
    scanReceiptLeft: 5,
    canCreateGroupForSharing: 1,
    transaction: [{
      timestamp: formatDate(),
      notes: getCurrentMonth().toString() + ' 1, ' + currentYear.toString() + ' refreshed budget limit',
      amount: '0',
      category: 'Budget',
      receiptPath: '',
      createdBy: 'System'
    }]
  });

  const submit = async () => {
    const { email, password, confirmPassword } = form;

    setSubmitting(true);

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      setSubmitting(false);
      return;
    }

    if (email === "" || password === "") {
      Alert.alert("Error", "Please fill in all fields");
      setSubmitting(false);
      return;
    }

    try {
      const userId = await signUp(form);
      setSubmitting(false);

      if (userId)
        Alert.alert("Sign up",
          "Successfully sign up. Please check your email for verification.",
          [
            {
              Text: 'Ok',
              onPress: () => {router.push("/sign-in")}
            }
          ]
        );
    } catch (error) {
      Alert.alert("Error", error.message);
      setSubmitting(false);
    }
  };

  const back = async () => {
    router.push("/sign-in");
  };

  useEffect(() => {
    const backAction = () => {
      router.back(); // Go back to the previous screen
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove(); // Cleanup the listener on unmount
  }, []);

  return (
    <SafeAreaView className="h-full">
      <ScrollView className="p-5">
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
        
        <Text className="text-2xl font-semibold mt-5 mb-5">Get started!</Text>

          <FormField
            title='Full Name'
            value={form.fullName}
            handleChangeText={(e) => setForm({ ...form, fullName: e })}
            type="text"/>

          <FormField
            title='Mobile No.'
            otherStyles="mt-5"
            value={form.mobileNo}
            handleChangeText={(e) => setForm({ ...form, mobileNo: e })}
            type="numeric"/>
          
          <FormField
            title='Email'
            otherStyles="mt-5"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            type="text"/>

          <FormField
            title="Password"
            otherStyles="mt-5"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            type="text"/>

          <FormField
            title="Confirm Password"
            otherStyles="mt-5"
            value={form.confirmPassword}
            handleChangeText={(e) => setForm({ ...form, confirmPassword: e })}
            type="text"/>
            
            <CustomButton 
              title="Sign up"
              containerStyles="mt-10 mb-5 w-full"
              handlePress={submit}
              isLoading={isSubmitting}
            />

          <View style={{flexDirection: 'row'}} className="mt-5 mb-20 justify-center">
            <Text>Already have an account? </Text>
            <Text  style={{fontWeight: 700, color: '#5E62AC', textDecorationLine: 'underline'}} onPress={back}>sign in</Text>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end', // Aligns child component at the bottom
  },
  card: {
    backgroundColor: 'white',
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: '100%', // Full width of the screen
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  line: {
    width: '100%', // Full width of the parent container
    marginVertical: 10, // Optional: adds vertical spacing around the line
  }
});

export default SignUp;