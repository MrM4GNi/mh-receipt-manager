import { View, Text, TouchableOpacity, ScrollView, Image, Alert, BackHandler } from 'react-native'
import React, { useEffect, useState } from 'react'
import { icons } from "../../constants";
import { router } from "expo-router";
import { useLocalSearchParams } from 'expo-router';
import { getCurrentUser, getGroup } from "../../lib/firebase";
import { Loader } from "../../components";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const GroupTransactionList = () => {
    const item = useLocalSearchParams();
    const [ groups, setGroups ] = useState(item);
    const [ transaction, setTransaction ] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [sortOrder, setSortOrder] = useState('asc');
    const [selectedGroupId, setSelectedGroupId] = useState('');

    useEffect(() => {
      const hasGroup = async () => {
        try {
          const userId = await AsyncStorage.getItem("userId");
          setUserId(userId);

          const groupId = item.groudId;
          const resGroup = await getGroup(groupId);

          setGroups({ ...resGroup });

          const sortedTransactions = resGroup.transaction.sort((a, b) => {
            const dateA = parseTimestamp(a.timestamp);
            const dateB = parseTimestamp(b.timestamp);
            return dateB - dateA;
        });

        const transactionsWithNames = await Promise.all(sortedTransactions.map(async (item) => {
            const name = await getFullname(item.createdBy);
            return { ...item, createdBy: name };
        }));

        setTransaction(transactionsWithNames);

          setLoading(false);
      } catch (error) {
          console.log("Groud info error", error.message);
      }
      };

      hasGroup();
    }, [groups]);

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

    const getFullname = async (userId) => {
      if (userId === "System")
        return 'System';

      const currentUserId = await AsyncStorage.getItem('userId');
      if (userId === currentUserId)
        return "You";

      const user = await getCurrentUser(userId);
      return user ? user?.fullName : "";
    };

    const handleTransactionPress = (transaction) => {
      const accessType = getAccessTypeByUserId(userId);
      const groupId = item.groupId;

      if (accessType === "viewer")
      {
          Alert.alert("Error", "You don't have access modified transaction.");
          return;
      }

      if (transaction.category !== 'Budget')
        router.push({ pathname: `/group-edit-transaction`, params: { transaction: JSON.stringify(transaction), groups: JSON.stringify(groups) } });
    };

    const getAccessTypeByUserId = (userId) => {
      const user = groups.users.find(user => user.userId === userId);
      return user ? user.accessType : null;
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
                  backgroundColor: '#eee'}}
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
                      <Text className="text-sm font-pregular text-gray-600">
                        {item.notes}
                      </Text>
                    ) : (
                      <Text className="text-sm font-pregular text-gray-600">
                        This is receipt.
                      </Text>
                    )}
                    
                    { item.createdBy !== 'System' ? (
                      <Text className="text-sm font-pregular text-gray-600 mt-2">
                        Uploaded by: {item.createdBy}
                      </Text>
                    ) : (
                      <></>
                    )}

                    <Text className="text-sm font-pregular text-gray mt-3">
                      {item.amount}
                    </Text>

                    {(index < transaction.length - 1) && (
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

export default GroupTransactionList