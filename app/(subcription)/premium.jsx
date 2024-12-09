import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Alert, BackHandler } from 'react-native'
import React, {useState, useEffect} from 'react'
import { icons } from "../../constants";
import { router } from "expo-router";
import { TextInput, Button, Card, Title, Paragraph, Modal } from 'react-native-paper';
import { CustomButton, FormField } from "../../components";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { db, getCurrentUser, upgradeSubcription } from "../../lib/firebase";

const planOffered = [
  {
    plan: "Basic Plan",
    price: "150 Php/Month",
    offered: ["1GB Cloud Storage", "1 Group for Sharing",, "50 receipt scan"],
    amount: 150,
    level: 1,
    storage: 1500,
    canReceiptScan: 50,
    canCreateGroup: 1
  },
  {
    plan: "Premium Plan",
    price: "700 Php/Month",
    offered: ["10GB Cloud Storage", "3 Group for Sharing", , "250 receipt scan"],
    amount: 700,
    level: 2,
    storage: 10000,
    canReceiptScan: 250,
    canCreateGroup: 3
  },
  {
    plan: "Master Plan",
    price: "999 Php/Month",
    offered: ["25GB Cloud Storage", "10 Group for Sharing", "500 receipt scan"],
    amount: 999,
    level: 3,
    storage: 25000,
    canReceiptScan: 500,
    canCreateGroup: 10
  }
];

const Subcription = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [userSubcriptionLevel, setUserSubcriptionLevel] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('4343434343434345');
  const [cvc, setCvc] = useState('123');
  const [expDate, setExpDate] = useState('8/25');
  const [selectedSubcription, setSelectedSubcription] = useState(null);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userId'); // Clear userId from AsyncStorage
      setUser(null); // Reset user state
      router.push("/sign-in");
    } catch (error) {
      console.log('Error during logout:', error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          router.push("/sign-in");
          return;
        }

        const userInfo = await getCurrentUser(userId);
        setUser(userInfo);

        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      const userPlan = getPlanByName(user?.accountType);

      if (user.accountType !== "Free")
        setUserSubcriptionLevel(userPlan?.level);
    }
  }, [user]);

  const back = async () => {
      router.push("/profile");
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

  const getPlanByName = (planName) => {
    return planOffered.find(plan => plan.plan === planName);
  };

  const handlePayment = async (item) => {
    try {
        // Step 1: Create a payment intent
        const response = await axios.post('https://api.paymongo.com/v1/payment_intents', {
            data: {
                attributes: {
                    amount: 2000,
                    payment_method_allowed: ['qrph', 'card', 'dob', 'paymaya', 'billease', 'gcash', 'grab_pay'],
                    payment_method_options: {card: {request_three_d_secure: 'any'}},
                    currency: 'PHP',
                    capture_type: 'automatic'
                },
            },
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': 'Basic c2tfdGVzdF93M0xzczhDWnZiYlZOVXNhNWVabWQzOWo6'
            },
        });

        const { data } = response.data;
        const paymentIntent = data;
        console.log("Step 1", paymentIntent.id);

        const exp = expDate.split('/');
        const expMonth = parseInt(exp[0]);
        const expYear = parseInt(exp[1]);

        // Step 2: Confirm the payment
        const confirmationResponse = await axios.post(`https://api.paymongo.com/v1/payment_methods`, {
          data: {
            attributes: {
              details: {
                card_number: cardNumber, 
                exp_month: expMonth, 
                exp_year: expYear, 
                cvc: cvc
              },
              type: 'card'
            }
          },
        }, {
          headers: {
              'authorization': 'Basic c2tfdGVzdF93M0xzczhDWnZiYlZOVXNhNWVabWQzOWo6',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
        });

        const { data2 } = confirmationResponse.data;
        const paymentMethod = data2;
        console.log("Step 2", confirmationResponse.data.data.id);

        // Step 3: Confirm the payment
        const attachPayment = await axios.post('https://api.paymongo.com/v1/payment_intents/' + paymentIntent.id + '/attach', {
          data: {
            attributes: {
              payment_method: confirmationResponse.data.data.id,
              return_url: 'https://dashboard.paymongo.com/developers'
            }
          },
        }, {
          headers: {
              'Authorization': 'Basic c2tfdGVzdF93M0xzczhDWnZiYlZOVXNhNWVabWQzOWo6',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
        });

        const { data3 } = attachPayment.data;
        const paymentStatus = attachPayment.data.data.attributes.status;
        console.log("Step 3", paymentStatus);
        
        if (paymentStatus === 'succeeded')
        {
          const upgrade = await upgradeSubcription(user.userId, item);

          if (upgrade)
            Alert.alert(
              'Successful',
              'Successfully Paid!',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    router.push("/profile");
                  },
                },
              ]
            );
        }
    } catch (error) {
        Alert.alert("Error", error.response ? error.response.data.errors[0].detail : error.message);
        setModalVisible(false);
    }
  };

  const openPaymentCard = (item) => {
    setSelectedSubcription(item);
    console.log(item);
    setModalVisible(true);
  }

  return (
    <View className="w-full h-full">
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
        
        <Text className="font-pmedium text-lg mt-3" style={{flex: 1, color: '#5E62AC', opacity: 100}}>
          WE OFFER
        </Text>

        <View>
          {planOffered.map((item, index) => (
            <>
              { (userSubcriptionLevel < item.level) && (
                <TouchableOpacity onPress={() => openPaymentCard(item)}>
                  <View key={index} className="mt-5" style={styles.card}>
                    <View style={{flexDirection: 'row'}}>
                      <Text className="font-pmedium text-base" style={{color: '#5E62AC', opacity: 100}}>
                        {item.plan}
                      </Text>
                      <Text className="font-pmedium text-base text-right" style={{flex: 1, color: 'black', opacity: 100}}>
                        {item.price}
                      </Text>
                    </View>
                    {item.offered.map((offer, offerIndex) => (
                      <View key={offerIndex} className="mt-2" style={{flexDirection: 'row', alignItems: 'center',}}>
                        <Text className="font-pmedium text-base" style={{color: 'black', opacity: 100, flex: 1}}>
                          {offer}
                        </Text>
                        <Image
                          source={icons.check}
                          resizeMode="contain"
                          className="w-5 h-5 ml-3 mr-3"
                          tintColor="green"
                        />
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              )}
            </>
          ))}
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

            <FormField
              title='Card Number'
              otherStyles="mt-5"
              value={cardNumber}
              handleChangeText={(e) => setCardNumber(e)}
              type="numeric"/>

              <FormField
                title='CVC'
                otherStyles="mt-5 w-50"
                value={cvc}
                handleChangeText={(e) => setCvc(e)}
                type="numeric"/>
                
              <FormField
                title='Exp Date'
                otherStyles="mt-5 w-50"
                placeholder="Ex. 9/24"
                value={expDate}
                handleChangeText={(e) => setExpDate(e)}
                type="text"/>

            <CustomButton title="Proceed" containerStyles="mt-5 w-full" handlePress={() => handlePayment(selectedSubcription)}/>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: '100%', // Full width of the screen
    padding: 20,
  },
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
});

export default Subcription