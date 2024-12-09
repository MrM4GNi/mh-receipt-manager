import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Alert, Image, TouchableOpacity, ScrollView, Modal, StyleSheet, BackHandler } from "react-native";
import { icons } from "../../constants";
import { CustomButton, FormField } from "../../components";
import { useState, useEffect } from "react";
import { createGroup, findUserByEmail, getCurrentUser } from "../../lib/firebase";
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cleanAmount } from "../../constants/clearAmount";

const Create = () => {
  const [groupName, setGroupName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [findUser, setFindUser] = useState('');
  const [userMember, setUserMember] = useState([]);
  const [selectedValues, setSelectedValues] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState('');
  const [budget, setBudget] = useState(0);

  const hasGroup = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');

      const userInfo = await getCurrentUser(userId);
      setUser(userInfo);
      setLoading(false);
    } catch (error) {
      console.log("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    hasGroup();
  }, []);

  const back = async () => {
    router.push("/home");
  };

  useEffect(() => {
    const backAction = () => {
      router.back(); // Go back to the previous screen
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove(); // Cleanup the listener on unmount
  }, []);

  const saveGroup =  async () => {
    setIsCreating(true);

    if (!groupName)
    {
      Alert.alert("Error","Group name is required");
      setIsCreating(false);
      return;
    }

    if (budget <= 0 || budget === '')
    {
      Alert.alert("Error","Set your budget limit per month it should not lessthan or equal to 0.");
      setIsCreating(false);
      return;
    }

    const currentYear = new Date().getFullYear();

    const newGroup = {
      timestamp: formatDate(),
      name: groupName,
      ownerId: user.userId,
      ownerEmail: user.email,
      users: userMember,
      budget: cleanAmount(budget),
      scanReceipt: 0,
      scanReceiptLeft: 3,
      transaction: [{
        timestamp: formatDate(),
        notes: getCurrentMonth().toString() + ' 1, ' + currentYear.toString() + ' refreshed budget limit',
        amount: budget,
        category: 'Budget',
        receiptPath: '',
        createdBy: 'System'
      }]
    };

    try {
      const isCreated = await createGroup(user.userId, newGroup);

      if (isCreated)
      {
        Alert.alert('Confirmation', 'Created Successfully.', [
          {text: 'Ok', onPress: () => router.push("/home")},
        ]);
      }
    } catch (error) {
      Alert.alert("Error",error.message);
      return;
    }
  };

  const searchUser =  async () => {
    if (searchEmail === '') {
      Alert.alert("Error", "Please Fill up email field");
      return;
    }

    if (searchEmail === user.email) {
      Alert.alert("Error", "You cannot add yourself.");
      return;
    }

    try {
      const res = await findUserByEmail(searchEmail);
      setFindUser(res);

      if (res === 'User Not Found')
      {
        Alert.alert("Error", searchEmail);
        return;
      }

      const newUserMember = { userId: findUser, email: searchEmail, accessType: "viewer" };

      setUserMember((prevMembers) => {
          const userExists = prevMembers.some(member => member.userId === newUserMember.userId);

          if (!userExists) {
              return [...prevMembers, newUserMember];
          }
    
          Alert.alert("Error", "User is already added");
          return prevMembers;
      });
      closeModal();
    } catch (error) {
      Alert.alert("Error", error.message);
      return;
    }
  };

  const addUserMember = () => {
    if (searchEmail === '' || findUser === 'User Not Found' || findUser === '') {
        Alert.alert("Not Found", "Search user first before you can add");
        return;
    }

    const newUserMember = { userId: findUser, email: searchEmail, accessType: "viewer" };

    setUserMember((prevMembers) => [...prevMembers, newUserMember]);
    closeModal();
  };

  const handleValueChange = (userId, newValue) => {
    setSelectedValues(prev => ({ ...prev, [userId]: newValue }));

    const updatedData = userMember.map(item =>
      item.userId === userId ? { ...item, accessType: newValue } : item
    );
    setUserMember(updatedData);
  };

  const closeModal = () => {
    setSearchEmail('');
    setFindUser('');
    setModalVisible(false);
  }

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

  return (
    <SafeAreaView className="w-full h-full">
      <ScrollView className="p-5">
        <TouchableOpacity
          onPress={back}
        >
          <Image
            source={icons.leftArrow}
            resizeMode="contain"
            className="w-6 h-6"
          />
        </TouchableOpacity>
        
        <Text className="font-pmedium text-base mt-3" style={{color: '#5E62AC', opacity: 100}}>
          Create Group
        </Text>

        <View className="mt-5">
          <FormField
            title='Group name'
            value={groupName}
            handleChangeText={(e) => setGroupName(e)}
            type="text"/>

          <FormField
            title='Budget Limit (note. This is per month)'
            value={budget}
            otherStyles="mt-5"
            handleChangeText={(e) => setBudget(e)}
            placeholder="ex. 6000"
            type="numeric"/>
          
          <View className="space-y-2 mt-5">
            <View style={{flexDirection: 'row'}}>
              <Text className="text-base text-gray font-pmedium">Add members</Text>
              <Text className="font-pmedium text-base text-right" 
                style={{color: '#5E62AC', opacity: 100, flex: 1, textDecorationLine: 'underline',}}
                onPress={() => setModalVisible(true)}>
                add
              </Text>
            </View>
            { userMember.length === 0 ? (
              <Text className="font-pmedium text-base" style={{color: 'gray', opacity: 100}}>No Added Members</Text>
            ) : (
              <>
                {userMember.map((item) => (
                  <View key={item.userId} style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center',}}>
                    <Text className="font-pmedium text-base flex-1" style={{color: 'gray', opacity: 100}}>{item.email}</Text>
                    <Picker
                      selectedValue={selectedValues[item.userId] || item.accessType} 
                      style={styles.picker}
                      onValueChange={(itemValue) => handleValueChange(item.userId, itemValue )}>
                      <Picker.Item label="viewer" value="viewer" />
                      <Picker.Item label="writer" value="writer" />
                    </Picker>
                    <TouchableOpacity>
                      <Image
                        source={icons.trash}
                        resizeMode="contain"
                        className="w-6 h-6"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        <CustomButton 
            title="CREATE"
            containerStyles="mt-20 mb-5"
            handlePress={saveGroup}
            isLoading={isCreating}/>
      </ScrollView>

      <Modal transparent={true} animationType="fade" visible={modalVisible}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity className="w-full" style={{alignItems: 'flex-end'}} onPress={closeModal}>
              <Image
                source={icons.close}
                resizeMode="contain"
                className="w-6 h-6"
              />
            </TouchableOpacity>

            <FormField
              title='Search user by email'
              value={searchEmail}
              handleChangeText={(e) => setSearchEmail(e)}
              //searchSubmit={searchUser}
              type="text"/>

            {(findUser !== '') && (
              <View className="mt-10 mb-5">
                <Text className="font-pmedium text-base">{findUser === 'User Not Found' ? findUser : searchEmail}</Text>
              </View>
            )}
            
            <CustomButton 
              title="ADD"
              containerStyles="w-full mt-5"
              handlePress={searchUser}/>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Full width of the screen
    height: '100%',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: 150,
  },
  selectedText: {
    marginTop: 20,
    fontSize: 16,
  },
});

export default Create;
