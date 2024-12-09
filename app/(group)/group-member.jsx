import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { router } from "expo-router";
import { View, Text, Alert, Image, TouchableOpacity, ScrollView, Modal, StyleSheet, BackHandler } from "react-native";
import { icons } from "../../constants";
import { CustomButton, FormField, Loader } from "../../components";
import { addGroupMember, addGroupTransaction, findUserByEmail, getGroup, deleteGroupCollection } from "../../lib/firebase";
import { Picker } from '@react-native-picker/picker';
import Checkbox from 'expo-checkbox';
import { cleanAmount } from "../../constants/clearAmount";

const GroupMember = () => {
    const item = useLocalSearchParams();
    const [groups, setGroups] = useState(item);
    const [loading, setLoading] = useState(true);
    const [userMember, setUserMember] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchEmail, setSearchEmail] = useState('');
    const [findUser, setFindUser] = useState('');
    const [selectedValues, setSelectedValues] = useState({});
    const [saving, setSaving] = useState(false);
    const [oldBudget, setOldBudget] = useState(0);
    const [isChecked, setIsChecked] = useState(true);

    const hasGroup = async () => {
        try {
            const groupId = item.groudId;
            const resGroup = await getGroup(groupId);

            setGroups({ ...resGroup });
            setUserMember((prevMembers) => {
              const newMembers = resGroup.users.filter(user => 
                  !prevMembers.some(member => member.userId === user.userId)
              );
              return [...prevMembers, ...newMembers];
            });

            setOldBudget(resGroup.budget);
            setLoading(false);
        } catch (error) {
            console.log("Group info error", error.message);
        }
    };
    
    useEffect(() => {
        hasGroup();
    }, []);

    const back = () => {
        router.push({ pathname: `/group-expenses`, params: groups });
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

    const closeModal = () => {
        setSearchEmail('');
        setFindUser('');
        setModalVisible(false);
    };

    const searchUser = async () => {
        if (searchEmail === '') {
            Alert.alert("Error", "Please fill up the email field");
            return;
        }
    
        try {
            const res = await findUserByEmail(searchEmail);
            setFindUser(res);
      
            if (res === 'User Not Found')
            {
              Alert.alert("Error", "User Not Found");
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

    const handleValueChange = (userId, newValue) => {
        setSelectedValues(prev => ({ ...prev, [userId]: newValue }));
  
        const updatedData = userMember.map(item =>
            item.userId === userId ? { ...item, accessType: newValue } : item
        );
        setUserMember(updatedData);
    };
    
    const addUserMember = () => {
        if (searchEmail === '' || findUser === 'User Not Found' || findUser === '') {
            Alert.alert("Error", "Search user first before you can add");
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
    };

    const updateGroup = async () => {
        setSaving(true);
        const amnt = cleanAmount(groups.budget);

        if (!groups.name)
        {
            Alert.alert("Error", "Group name is required");
            setSaving(false);
            return;
        }

        /*if (amnt <= 0)
        {
            Alert.alert("Error", "Budget limit cannot be 0");
            setSaving(false);
            return;
        }*/

        try {
            const newData = {
                name: groups.name, // Assuming you have a 'name' field in groups
                budget: amnt,
                users: userMember,
            };

            const isSave = await addGroupMember(groups.groudId, newData);

            if (isSave && (isChecked && oldBudget !== groups.budget))
            {
                const newTransaction = {
                  timestamp: formatDate(),
                  notes: 'Update budget limit',
                  amount: amnt - oldBudget,
                  category: 'Budget',
                  receiptPath: '',
                  createdBy: 'Owner',
                };
      
                await addGroupTransaction(groups.groudId, newTransaction);
            }

            if (isSave && !isChecked)
            {
                Alert.alert("Success", "Saved successfully! but your budget limit will apply next month.");
            } else {
                Alert.alert("Success", "Saved successfully!");
            }

            setSaving(false);
        } catch (error) {
            Alert.alert("Error", error.message);
            setSaving(false);
        }
    };

    const removeUserById = (userIdToRemove) => {
        setUserMember((prevMembers) =>
            prevMembers.filter(member => member.userId !== userIdToRemove)
        );
    };

    const toggleCheckbox = () => {
      setIsChecked(!isChecked);
    };

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

    const removeGroup = () => {
        Alert.alert(
            'Warning',
            'Are you sure you want to delete this group?',
            [
                {
                    text: 'No',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                {text: 'Yes', onPress: async () => await handleDelete()},
            ]
          );
        
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const isDeleted = await deleteGroupCollection(groups.groudId);

            if (isDeleted)
            {
                Alert.alert(
                    'Delete',
                    'Successfully deleted!',
                    [
                        {text: 'Ok', onPress: router.push('/home')},
                    ]
                  );
            }
        } catch (error)
        {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <View className="w-full h-full">
            <ScrollView className="p-5 mt-5">
                <TouchableOpacity onPress={back}>
                    <Image
                        source={icons.leftArrow}
                        resizeMode="contain"
                        className="w-6 h-6"
                    />
                </TouchableOpacity>
                
                <Text className="font-pmedium text-base mt-3" style={{color: '#5E62AC', opacity: 100}}>
                    Settings
                </Text>

                <View className="mt-5">
                    <FormField
                        title='Group name'
                        value={groups?.name}
                        handleChangeText={(e) => setGroups({ ...groups, name: e })}
                        type="text"/>

                    <FormField
                        title='Budget Limit (note. This is per month)'
                        value={groups?.budget}
                        otherStyles="mt-5"
                        handleChangeText={(e) => setGroups({ ...groups, budget: e })}
                        placeholder="ex. 6000"
                        type="numeric"/>
                      
                    <View className="flex-row mt-3 mb-5">
                      <Checkbox
                        value={isChecked}
                        onValueChange={toggleCheckbox}
                      />
                      <Text className="ml-3">Effective this month</Text>
                    </View>
                
                    <View className="space-y-2 mt-5">
                        <View style={{flexDirection: 'row'}}>
                            <Text className="text-base text-gray font-pmedium">Add members</Text>
                            <Text className="font-pmedium text-base text-right" 
                                style={{color: '#5E62AC', opacity: 100, flex: 1, textDecorationLine: 'underline'}}
                                onPress={() => setModalVisible(true)}>
                                add
                            </Text>
                        </View>
                        { userMember.length === 0 ? (
                            <Text className="font-pmedium text-base" style={{color: 'gray', opacity: 100}}>No Added Members</Text>
                        ) : (
                            <>
                                {userMember.map((item) => (
                                    <View key={item.userId} style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                        <Text className="font-pmedium text-base flex-1" style={{color: 'gray', opacity: 100}}>{item.email}</Text>
                                        <Picker
                                            selectedValue={selectedValues[item.userId] || item.accessType} 
                                            style={styles.picker}
                                            onValueChange={(itemValue) => handleValueChange(item.userId, itemValue)}>
                                            <Picker.Item label="viewer" value="viewer" />
                                            <Picker.Item label="writer" value="writer" />
                                        </Picker>
                                        <TouchableOpacity onPress={() => removeUserById(item.userId)}>
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
                
                <View className="flex flex-row justify-center items-center mt-20 mb-20">
                    <CustomButton 
                        title="SAVE"
                        containerStyles="w-[80%]"
                        handlePress={updateGroup}
                        isLoading={saving}
                    />
                    <TouchableOpacity
                        onPress={removeGroup}
                        >
                        <Image
                            source={icons.trash}
                            resizeMode="contain"
                            className="w-10 h-10 ml-5"
                        />
                    </TouchableOpacity>
                </View>
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

            <Loader isLoading={loading} />
        </View>
    );
};

const styles = StyleSheet.create({
    modalBackground: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
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
    picker: {
        height: 50,
        width: 150,
    },
});

export default GroupMember;
