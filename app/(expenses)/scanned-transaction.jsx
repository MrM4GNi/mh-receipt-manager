import { useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, StyleSheet, TextInput, BackHandler } from 'react-native'
import React, { useEffect, useState } from 'react'
import { icons } from "../../constants";
import { router } from "expo-router";
import { CustomButton, FormField } from "../../components";
import { addTransaction } from '../../lib/firebase';
import categories from '../../constants/categories';
import { Modal } from "react-native-paper";
import { cleanAmount } from '../../constants/clearAmount';
import * as ImagePicker from "expo-image-picker";

const categorizeExpense = (input) => {
    const lowerCasedInput = input.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerCasedInput.includes(keyword))) {
        return category;
      }
    }
    return 'Other';
};

const ScannedTransaction = () => {
    const data = useLocalSearchParams();
    const [isSubmitting, setIsSubmitting ] = useState(false);
    const [user, setUser] = useState(null);
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
          setLoading(true);
          try {
            const userId = await AsyncStorage.getItem('userId');
    
            if (userId) {
              const userDocRef = doc(db, 'Users', userId);
              const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                  setUser(doc.data());
                } else {
                  handleLogout(); // Call logout if user data does not exist
                }
                setLoading(false);
              });
    
              return () => unsubscribe();
            } else {
              handleLogout();
            }
          } catch (error) {
            console.log(error);
            setLoading(false);
          }
        };
    
        fetchUserData();
      }, [setUser, setLoading]);

    const back = async () => {
        router.push("/view-expenses");
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

    const [category, setCategory] = useState('');
    const [notes, setNotes ] = useState('');
    const [ total, setTotal ] = useState('0');
    const [modalVisible, setModalVisible] = useState(false);
    const [value, setValue] = useState(null);
    const categoryTypes = Object.keys(categories);


    const parseData = (data) => {
        const parts = data.trim().split('\n');
        const items = [];

        for (let i = 0; i < parts.length; i++) {
            const hasKg = parts[i].includes('/kg') ? ' (contains /kg)' : '';

            if (parts[i].toLowerCase() === 'total') {
                if (parts[i + 1]) {
                    setTotal(cleanAmount(parts[i + 1]));
                }
            }

            if (hasKg === '') {
                items.push(parts[i]);
            }
        }

        setNotes(items.join('\n\n'));
        const result = categorizeExpense(notes);
        
        setCategory(result);
        return items;
    };

    useEffect(() => {
        setValue(data.image);
        parseData(data.all_text);
    }, []);

    const handleAddTransaction = async () => {
        setIsSubmitting(true);
    
        const newTransaction = {
            timestamp: new Date().toLocaleString(),
            notes: notes,
            amount: cleanAmount(total),
            category: category
        };
    
        try {
          await addTransaction(user.userId, newTransaction);
        } catch (error) {
          Alert.alert("Error",error.message);
        }
    
        setIsSubmitting(false);
    };

    const pickImageGallery = async () => {
        let result =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                    ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                base64: true,
                allowsMultipleSelection: false,
            });
        if (!result.canceled) {
        
            // Perform OCR on the selected image
            //performOCR(result.assets[0]); 
            
            // Set the selected image in state
            setValue(result.assets[0].uri); 
        }
    };

    console.log("Data:", value);
    return (
        <View className="w-full h-full">
            <ScrollView className="p-5">
                <TouchableOpacity
                    onPress={back}
                    className="flex mt-5">
                    <Image
                        source={icons.leftArrow}
                        resizeMode="contain"
                        className="w-6 h-6"
                    />
                </TouchableOpacity>
                
                <Text className="font-pmedium text-lg mt-3" style={{color: '#5E62AC', opacity: 100}}>New Transaction</Text>

                {value === null ? (
                    <TouchableOpacity 
                        className="w-full"
                        onPress={pickImageGallery}>
                        <View>
                        <Text className="text-base text-gray-100 font-pmedium">
                            Upload Reciept
                        </Text>

                        <View className="w-full h-40 px-4 bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center">
                            <View className="w-14 h-14 border border-dashed border-secondary-100 flex justify-center items-center">
                            <Image
                                source={icons.upload}
                                resizeMode="contain"
                                alt="upload"
                                className="w-1/2 h-1/2"
                            />
                            </View>
                        </View>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <></>
                )}

                <View className="space-y-2">
                    <Text className="text-base text-gray">Notes</Text>
                    
                    <View className="w-full px-4 rounded-2xl border-2 border-black-200 focus:border-primary flex flex-row items-center">
                        <TextInput
                            style={styles.textarea}
                            value={notes}
                            onChangeText={(e) => setNotes(e)}
                            multiline
                            numberOfLines={4}
                            />
                    </View>
                </View>

                <FormField
                    title="Amount"
                    otherStyles="mt-5"
                    value={total}
                    handleChangeText={(e) => setTotal(e)}
                    type="numeric"/>

                <View className="space-y-2 mt-5">
                    <Text className="text-base text-gray font-pmedium">Categories</Text>
                    <View style={{flexDirection: 'row'}}>
                    <Text className="font-pmedium text-base" style={{color: 'gray', opacity: 100}}>
                        {category === '' ? 'No selected category' : category}
                    </Text>
                    <Text className="font-pmedium text-base text-right" 
                        style={{color: '#5E62AC', opacity: 100, flex: 1, textDecorationLine: 'underline',}}
                        onPress={() => setModalVisible(true)}>
                        select
                    </Text>
                    </View>
                </View>

                <CustomButton 
                    title="SAVE"
                    containerStyles="mt-20 mb-20"
                    handlePress={pickImageGallery}
                    isLoading={isSubmitting}
                />
            </ScrollView>

            <Modal
                transparent={true}
                animationType="fade"
                visible={modalVisible}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                    <TouchableOpacity
                        className="w-full"
                        style={{padding: 10, alignItems: 'right',}}
                        onPress={() => setModalVisible(false)}>
                        <Text className="font-pmedium text-sm" style={{color: 'black', opacity: 100, textAlign: 'right'}}>
                        close
                        </Text>
                    </TouchableOpacity>
                    
                    <View style={{width: '100%', borderBottomColor: "#eee", borderBottomWidth: 1}}></View>
                    {categoryTypes.map((item, index) => (
                        <View className="w-full">
                        <View key={index} className="p-3 w-full text-center">
                            <Text 
                            className="font-pmedium text-base" 
                            style={{color: 'black', opacity: 100}}
                            onPress={() => {setCategory(item); setModalVisible(false)}}>
                            {item}
                            </Text>
                        </View>
                        <View style={{width: '100%', borderBottomColor: "#eee", borderBottomWidth: 1}}></View>
                        </View>
                    ))}
                    </View>
                </View>
                </TouchableOpacity>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textareaContainer: {
      height: 180,
      padding: 5,
      backgroundColor: 'white',
    },
    textarea: {
      textAlignVertical: 'top',  // hack android
      height: 170,
      fontSize: 14,
      color: 'black',
    },
    modalBackground: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%', // Full width of the screen
        height: '100%',
        padding: 20,
    },
        modalContainer: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
        modalText: {
        fontSize: 18,
        marginBottom: 20,
    },
  });

export default ScannedTransaction