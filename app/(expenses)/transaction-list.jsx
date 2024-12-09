import { View, Text, TouchableOpacity, ScrollView, Image, TextInput, BackHandler } from 'react-native'
import React from 'react'
import { icons } from "../../constants";
import { router } from "expo-router";
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../../lib/firebase';
import { Loader } from '../../components';
import { Picker } from '@react-native-picker/picker';

const TransactionList = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ transaction, setTransaction ] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedGroupId, setSelectedGroupId] = useState('');

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

        userInfo.transaction.sort((a, b) => {
          const dateA = parseTimestamp(a.timestamp);
          const dateB = parseTimestamp(b.timestamp);
          
          return dateB - dateA;
        });
        setTransaction(userInfo.transaction);

        console.log("SSS", transaction);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const back = () => {
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

  const parseTimestamp = (timestamp) => {
    const [datePart, timePart] = timestamp.split(", ");
    const [month, day, year] = datePart.split("/").map(Number);
    const [time, period] = timePart.split(" ");
    
    // Adjust hours for AM/PM
    let [hours, minutes, seconds] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }
    
    // Create a new Date object
    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  const handleTransactionPress = (transaction) => {
    if (transaction.category !== 'Budget')
      router.push({ pathname: `/edit-transaction`, params: transaction });
  };

  const filteredAndSortedReceipts = () => {
    let filteredReceipts = transaction;

    if (selectedGroupId) {
      filteredReceipts = transaction.filter(item => item.category === selectedGroupId);
    }

    // Sorting by timestamp
    return filteredReceipts.sort((a, b) => {
      const dateA = parseTimestamp(a.timestamp);
      const dateB = parseTimestamp(b.timestamp);
      return sortOrder !== 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  return (
    <View className="w-full h-full bg-white">
      <Loader isLoading={loading} />
      
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
        
        <Text className="font-pmedium text-base mt-3 mb-3" style={{color: '#5E62AC', opacity: 100}}>
          All Transaction
        </Text>

        { transaction ? (
          <>
            <View style={{flexDirection: 'row', padding: 10}}>
              <Picker
                style={{
                  height: 50,
                  width: '49%',
                  backgroundColor: '#eee' }}
                selectedValue={selectedGroupId}
                onValueChange={(itemValue) => {
                  setSelectedGroupId(itemValue);
                }}
              >
                <Picker.Item  label="House" value="House" />
                <Picker.Item  label="Groceries" value="Groceries" />
                <Picker.Item  label="Transportation" value="Transportation" />
                <Picker.Item  label="Utilities" value="Utilities" />
              </Picker>
              <Picker
                style={{
                  marginLeft: '2%',
                  height: 50,
                  width: '49%',
                  backgroundColor: '#eee'}}
                selectedValue={sortOrder}
                onValueChange={(itemValue) => {
                  setSortOrder(itemValue);
                }}
              >
                <Picker.Item label="Newest" value="asc" />
                <Picker.Item label="Oldest" value="desc" />
              </Picker>
            </View>
            {
              filteredAndSortedReceipts().map((item, index) => (
                <TouchableOpacity key={index} onPress={() => handleTransactionPress(item)}>
                  <View className="p-1">
                    <View style={{flexDirection: 'row'}}>
                      <Text className="font-pmedium text-sm" style={{color: 'black', opacity: 100}}>
                        {item.category}
                      </Text>
                      <Text 
                        className="font-pmedium text-sm text-right" 
                        style={{color: 'gray', opacity: 300, flex: 1,}}>
                        {item.timestamp}
                      </Text>
                    </View>
                    {item.receiptPath === '' ? (
                      <Text className="text-sm font-pregular text-gray-500">
                        {item.notes}
                      </Text>
                    ) : (
                      <Text className="text-sm font-pregular text-gray-500">
                        This is receipt.
                      </Text>
                    )}
                    <Text className="text-sm font-pregular text-gray-400">
                      {item.amount}
                    </Text>

                    {(index < user.transaction.length - 1) && (
                      <View style={{width: '100%', marginVertical: 10, borderBottomColor: "#eee", borderBottomWidth: 1}}></View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            }
          </>
        ) : (<></>)}
      </ScrollView>
    </View>
  )
}

export default TransactionList