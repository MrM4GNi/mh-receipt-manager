import { View, Text, TouchableOpacity, ScrollView, Image, Alert, StyleSheet, ImageBackground, TextInput, BackHandler } from 'react-native'
import React, { useState, useEffect } from 'react'
import { icons } from "../../constants";
import { router, useLocalSearchParams } from "expo-router";
import { CustomButton, FormField, Loader } from "../../components";
import { modifiedGroupTransaction, uploadReciept, removeGroupTransaction } from '../../lib/firebase';
import categories from '../../constants/categories';
import { Modal } from "react-native-paper";
import { cleanAmount } from '../../constants/clearAmount';
import * as ImagePicker from "expo-image-picker";

const dummyData = `
ZUCHINNI GREEN
$4.66
0.778kg NET $5.99/kg
BANANA CAVENDISH
$1.32
0.442kg NET # $2.99/kg
SPECIAL
$0.99
SPECIAL
$1.50
POTATOES BRUSHED
$3.97
1.328kg NET $2.99/kg
BROCCOLI
$4.84
0.808kg NET $5.99/kg
BRUSSEL SPROUTS
$5.15
0.322kg NET # $15.99/kg
SPECIAL
$0.99
GRAPES GREEN
$7.03
1.174kg NET # $5.99/kg
PEAS SNOW
$3.27
0.218kg NET # $14.99/kg
TOMATOES GRAPE
$2.99
LETTUCE ICEBERG
$2.49
SUBTOTAL
$39.20
LOYALTY
-15.00
SUBTOTAL
$24.20
SUBTOTAL
$24.20
SUBTOTAL
$24.20
TOTAL AMOUNT SEND
$44500.20
CASH
$50.00
CHANGE
$25.80`;

const categorizeExpense = (input) => {
  const lowerCasedInput = input.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowerCasedInput.includes(keyword))) {
      return category;
    }
  }
  return 'Other';
};

const GroupEditTransaction = () => {
    const item = useLocalSearchParams();
    const transaction =  JSON.parse(item.transaction);
    const group = JSON.parse(item.groups);
    const [groups, setGroups] = useState(group);
  const [ loading, setLoading ] = useState(false);
  const [isSubmitting, setIsSubmitting ] = useState(false);
  const [notes, setNotes] = useState(transaction.notes);
  const [category, setCategory] = useState(transaction.category);
  const [amount, setAmount] = useState(transaction.amount);
  const [modalVisible, setModalVisible] = useState(false);
  const [modelReceipt, setModelReceipt] = useState(false);
  const categoryTypes = Object.keys(categories);
  const [image, setImage] = useState(transaction.receiptPath !== '' ? transaction.receiptPath : null);
  const [hasNewImage, setHasNewImage] = useState(false);
  let receiptPath = "";

  console.log("groups", transaction);
  const back = async () => {
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

  const handleCategorize = () => {
    const result = categorizeExpense(notes);
    
    setCategory(result);  
  };

  const handleAddTransaction = async () => {
    setIsSubmitting(true);

    if (image !== null && hasNewImage) {
      try {
        receiptPath = await uploadReciept(image);
      } catch (error) {
        setIsSubmitting(false);
        Alert.alert("Error", error.message);
        return;
      }
    }

    const newTransaction = {
        newTimeStamp: formatDate(),
        timestamp: transaction.timestamp,
        notes: notes,
        amount: cleanAmount(amount),
        category: category,
        receiptPath: receiptPath
    };

    try {
      await modifiedGroupTransaction(group.groupId, newTransaction);

      router.push({ pathname: `/group-expenses`, params: groups });
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert("Error", error.message);
      return;
    }

    setIsSubmitting(false);
  };

  const pickImageGallery = async () => {
    setModelReceipt(false);
    let result =
      await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
              ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          base64: true,
          allowsMultipleSelection: false,
      });

    if (!result.canceled) {
      performOCR(result.assets[0]);
      //parseData(dummyData);
      setImage(result.assets[0].uri);
      setHasNewImage(true);
    }
  };

  const pickImageCamera = async () => {
    setModelReceipt(false);
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      allowsMultipleSelection: false,
    });

    if (!result.canceled) {
      performOCR(result.assets[0]); 
      setImage(result.assets[0].uri);
      setHasNewImage(true);
    }
  };

  const performOCR = (file) => {
    let myHeaders = new Headers();
    myHeaders.append(
        "apikey",
        
        // ADDD YOUR API KEY HERE 
        "H0F8p6v3eLpRbzbH5GPUOgE0ySF6u29t"  
    );
    myHeaders.append(
        "Content-Type",
        "multipart/form-data"
    );

    let raw = file;
    let requestOptions = {
        method: "POST",
        redirect: "follow",
        headers: myHeaders,
        body: raw,
    };

    // Send a POST request to the OCR API
    fetch(
        "https://api.apilayer.com/image_to_text/upload",
        requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        parseData(result["all_text"]);
      })
      .catch((error) => console.log("error", error));
  };

  const parseData = (data) => {
    const parts = data.trim().split('\n');
    const items = [];

    console.log("parts",parts);
    for (let i = 0; i < parts.length; i++) {
        const hasKg = parts[i].includes('/kg') ? ' (contains /kg)' : '';

        if (parts[i].toLowerCase() === 'total amount sent' ||
            parts[i].toLowerCase() === 'total amount send' ||
            parts[i].toLowerCase() === 'total amount due' ||
            parts[i].toLowerCase() === 'total due' ||
            parts[i].toLowerCase() === 'total amount:' ||
            parts[i].toLowerCase() === 'total invoice' ||
            parts[i].toLowerCase() === 'total sale:' ||
            parts[i].toLowerCase() === 'total sale' ||
            parts[i].toLowerCase() === 'total') {

            if (parts[i + 1]) {
                setAmount(cleanAmount(parts[i + 1]));
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

  const removeTransac = async () => {
    try {
      setLoading(true);
      const res = await removeGroupTransaction(group.groupId, transaction.timestamp);

      if (res)
        router.push({ pathname: `/group-expenses`, params: groups });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  return (
    <View className="w-full h-full">
      <Loader isLoading={loading}/>

      <ScrollView className="p-5">
        <TouchableOpacity
          onPress={back}
          className="flex mt-5"
        >
          <Image
            source={icons.leftArrow}
            resizeMode="contain"
            className="w-6 h-6"
          />
        </TouchableOpacity>
        
        <Text className="font-pmedium text-lg mt-3 mb-5" style={{color: '#5E62AC', opacity: 100}}>
          Modified Receipt
        </Text>

        <TouchableOpacity 
          className="w-full"
          onPress={() => setModelReceipt(true)}>
          <View>
            <View className="mb-2" style={{flexDirection: 'row'}}>
              <Text className="text-base font-pmedium">
                  Upload Reciept
              </Text>
            </View>
            
            <ImageBackground
              className="rounded-2xl flex"
              source={{ uri: image }}
              style={{
                width: '100%',
                height: 170,
                objectFit: "cover",
                backgroundColor: "black"
              }}
              resizeMode="cover">
                <View style={styles.overlay} className="h-full w-full flex justify-center items-center text-center">
                  <View className="w-14 h-14 border border-dashed border-secondary-100 flex justify-center items-center">
                    <Image
                        source={icons.upload}
                        resizeMode="contain"
                        alt="upload"
                        className="w-1/2 h-1/2"
                    />
                  </View>
                </View>
            </ImageBackground>
          </View>
        </TouchableOpacity>

        <View className="mt-5">
          { image === null ? (
            <FormField
              title='Note (Optional)'
              value={notes}
              handleChangeText={(e) => setNotes(e)}
              handleSubmit={handleCategorize}
              type="text"/>
          ) : (
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
          )}

          <FormField
            title="Amount"
            otherStyles="mt-5"
            value={amount}
            handleChangeText={(e) => setAmount(e)}
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

          <View className="flex flex-row justify-center items-center mt-20 mb-20">
            <CustomButton 
              title="SAVE"
              containerStyles="w-[80%]"
              handlePress={handleAddTransaction}
              isLoading={isSubmitting}
            />
            <TouchableOpacity
              onPress={removeTransac}
            >
              <Image
                source={icons.trash}
                resizeMode="contain"
                className="w-10 h-10 ml-5"
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal transparent={true} animationType="fade" visible={modalVisible}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity className="w-full" style={{alignItems: 'flex-end'}} onPress={() => setModalVisible(false)}>
              <Image
                source={icons.close}
                resizeMode="contain"
                className="w-6 h-6"
              />
            </TouchableOpacity>
            <View style={{width: '100%', borderBottomColor: "#eee", borderBottomWidth: 1}} />
            {categoryTypes.map((item, index) => (
              <View className="w-full" key={index}>
                <TouchableOpacity className="p-3 w-full text-center" onPress={() => {setCategory(item); setModalVisible(false);}}>
                  <Text className="font-pmedium text-base" style={{color: 'black'}}>{item}</Text>
                </TouchableOpacity>
                <View style={{width: '100%', borderBottomColor: "#eee", borderBottomWidth: 1}} />
              </View>
            ))}
          </View>
        </View>
      </Modal>

      <Modal transparent={true} animationType="fade" visible={modelReceipt}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity className="w-full" style={{alignItems: 'flex-end'}} onPress={() => setModelReceipt(false)}>
              <Image
                source={icons.close}
                resizeMode="contain"
                className="w-6 h-6"
              />
            </TouchableOpacity>
            <View>
              <Text>Notes:</Text>
            </View>
            <CustomButton title="Scan Receipt" handlePress={pickImageGallery} containerStyles="mt-5 w-full" />
            <CustomButton title="Take Photo" handlePress={pickImageCamera} containerStyles="mt-5 w-full" />
          </View>
        </View>
      </Modal>
    </View>
  )
}

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
});

export default GroupEditTransaction;