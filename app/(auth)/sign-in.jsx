import { View, Text, StyleSheet, Alert } from 'react-native';
import React, {useEffect, useState} from 'react';
import { router } from "expo-router";
import { SafeAreaView, SafeAreaProvider} from "react-native-safe-area-context";
import { CustomButton, FormField, Loader } from "../../components";
import { signIn } from '../../lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignIn = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const submit = async () => {
    setSubmitting(true);

    if (form.email === "" || form.password === "") {
      Alert.alert("Error", "Please fill in all fields");
      setSubmitting(false);
      return;
    }

    try {
      const userLoggedIn = await signIn(form);

      if (userLoggedIn){
        setSubmitting(false);
        router.push("/home");
      }
    } catch (error) {
      switch (error) {
        case 'auth/wrong-password':
            Alert.alert("Error", 'Incorrect password. Please try again.');
            break;
        case 'auth/user-not-found':
            Alert.alert("Error",'No user found with this email. Please sign up.');
            break;
        case 'auth/invalid-email':
            Alert.alert("Error",'The email address is not valid. Please enter a valid email.');
            break;
        default:
            Alert.alert("Error",'Username or Password are worng. Please try agian!');
            break;
      }
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="w-full h-full">
        <View className="w-full h-full bg-primary">
          <View style={styles.container}>
            <View style={[styles.card, { height: 'auto' }]}>
              <Text className="text-2xl font-semibold mt-10 font-psemibold">Welcome back!</Text>
    
              <FormField
                title='Email'
                value={form.email}
                handleChangeText={(e) => setForm({ ...form, email: e })}
                type="text"/>
    
              <FormField
                title="Password"
                otherStyles="mt-5"
                value={form.password}
                handleChangeText={(e) => setForm({ ...form, password: e })}
                type="text"/>

              <View style={{flexDirection: 'row'}} className="mt-2">
                <Text 
                  className="text-base" 
                  style={{color: '#5E62AC', opacity: 100, flex: 1, textDecorationLine: 'underline',}}
                  onPress={() => router.push('/forgot-password')}
                  >
                  Forgot Password
                </Text>  
              </View>
              
                
              <CustomButton 
                title="Log in"
                containerStyles="mt-10 mb-5 w-full"
                handlePress={submit}
                isLoading={isSubmitting}/>
    
              <View style={{flexDirection: 'row'}} className="mt-5 mb-10">
                <Text>Don't have an account? </Text>
                <Text  style={{fontWeight: 700, color: '#5E62AC', textDecorationLine: 'underline'}} onPress={() => router.push("/sign-up")}>sign up</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>    
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

export default SignIn;
