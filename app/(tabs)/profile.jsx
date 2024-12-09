import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Image, StyleSheet, TouchableOpacity, Text, ScrollView, BackHandler, Alert } from "react-native";
import { icons } from "../../constants";
import { FormField, CustomButton, Loader } from "../../components";
import { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, updateUserInfo, signOut } from "../../lib/firebase";

const Profile = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const back = () => {
    router.push("/home");
  };

  useEffect(() => {
    const backAction = () => {
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove(); // Cleanup the listener on unmount
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      //await signOut();
      setUser(null); 
      router.push("/sign-in");
    } catch (error) {
      console.log('Error during logout:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');

        const userInfo = await getCurrentUser(userId);
        setUser(userInfo);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [setUser, setLoading]);

  const saveChanges = async () => {
    setSubmitting(true);
    try
    {
      const newUser = {
        fullName: user.fullName,
        mobileNo: user.mobileNo
      }
      const isSaved = await updateUserInfo(user.userId, newUser);

      if (isSaved)
        Alert.alert("Saved", "Save Successfully");
    } catch (error)
    {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const showAlert = () => {
    Alert.alert('Confirmation', 'Are you sure you want to proceed?', [
      {
        text: 'No',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {text: 'Yes', onPress: async () => await handleLogout()},
    ]);
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <Loader isLoading={loading}/>
      
      <ScrollView>
        <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
          <TouchableOpacity
            onPress={showAlert}
            className="flex w-full items-end mb-10"
          >
            <Image
              source={icons.logout}
              resizeMode="contain"
              className="w-6 h-6"
            />
          </TouchableOpacity>

          <Image
            source={icons.profile}
            resizeMode="contain"
            className="w-10 h-10 mb-5"/>

          <Text className="text-base text-black font-psemibold">{user?.email}</Text>

          <View className="w-full flex" style={{padding: 20}}>
            <View className="space-y-2">
                <Text className="text-base text-gray font-pmedium">Account Type</Text>
                <View className="w-full h-16 px-4 rounded-2xl border-2 border-black-200 focus:border-primary flex flex-row items-center">
                  <Text className="flex-1 text-black font-psemibold text-base">{user?.accountType}</Text>
                  {(user?.accountType === 'Free') && (
                    <Text 
                      className="font-pmedium text-sm bg-primary rounded pl-2 pr-2 text-end" 
                      style={{color: 'white', opacity: 100}}
                      onPress={() => router.push("/premium")}>
                      Subcribe to Premuim
                    </Text>
                  )}
                  {(user?.accountType === 'Basic Plan') && (
                    <Text 
                      className="font-pmedium text-sm bg-primary rounded pl-2 pr-2 text-end" 
                      style={{color: 'white', opacity: 100}}
                      onPress={() => router.push("/premium")}>
                      Upgrade Subcription
                    </Text>
                  )}
                </View>
              </View>

            <FormField
              title='Full Name'
              otherStyles="mt-5"
              value={user?.fullName}
              handleChangeText={(e) => setUser({ ...user, fullName: e })}
              type="text"/>

            <FormField
              title='Mobile No.'
              otherStyles="mt-5"
              value={user?.mobileNo}
              handleChangeText={(e) => setUser({ ...user, mobileNo: e })}
              type="numeric"/>

            <CustomButton 
              title="Save changes"
              containerStyles="mt-10 mb-5 w-full"
              handlePress={saveChanges}
              isLoading={isSubmitting}/>
            
            <View style={[styles.line, { borderBottomColor: "#eee", borderBottomWidth: 2 }]} />

            <View style={{flexDirection: 'row', padding: 10, alignItems: 'center',}}>
              <Image
                source={icons.eyeHide}
                resizeMode="contain"
                className="w-6 h-6 ml-3 mr-3"
              />
              <Text className="font-pmedium text-sm" style={{color: 'black', opacity: 100}} onPress={() => router.push("/change-password")}>
                Change Password
              </Text>
            </View>

            <View style={{flexDirection: 'row', padding: 10, alignItems: 'center',}}>
              <Image
                source={icons.about}
                resizeMode="contain"
                className="w-6 h-6 ml-3 mr-3"
              />
              <Text className="font-pmedium text-sm" style={{color: 'black', opacity: 100}} onPress={() => router.push("/about-us")}>
                About us
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  line: {
    width: '100%', // Full width of the parent container
    marginVertical: 10, // Optional: adds vertical spacing around the line
  }
});

export default Profile;
