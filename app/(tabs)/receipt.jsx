import { ScrollView, Alert, Text, View, TouchableOpacity, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Loader } from "../../components";
import { useEffect, useState } from "react";
import { getCurrentUser, getGroup } from "../../lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Picker } from '@react-native-picker/picker';

const Receipt = () => {
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipts] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [id, setId] = useState([]);

  useEffect(() => {
    const hasGroup = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const userInfo = await getCurrentUser(userId);
        
        // Get user transactions based on personal expenses
        const userTransactions = getTransactionsByUser("Personal Expenses", userInfo.transaction, userId);
        setReceipts(userTransactions);
        setId([{text: "Personal Expenses", value: ''}]);

        if (userInfo.group && userInfo.group.length > 0) {
          const groupPromises = userInfo.group.map(async (item) => {
            const resGroup = await getGroup(item.groupId);
            setId(prevId => [ ...prevId, {text: resGroup.name, value: item.groupId}]);
            console.log("res group", resGroup);
            return getTransactionsByUser(resGroup.name, resGroup.transaction, userId, item.groupId, resGroup);
          });
          
          const groupsData = await Promise.all(groupPromises);
          const allGroupReceipts = groupsData.flat();
          setReceipts(prevReceipts => [...prevReceipts, ...allGroupReceipts]);
        }
        setLoading(false);
      } catch (error) {
        Alert.alert("Error", error);
      }
    };
    
    hasGroup();
  }, []);

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

  const getTransactionsByUser = (from, transactions, userId, groupId, group) => {
    let sort = [];
    if (from === 'Personal Expenses') {
      sort = transactions.filter(transaction => transaction.receiptPath !== '')
        .map(transaction => ({
          ...transaction,
          from: from,
          id: userId
      }));
    } else {
      sort = transactions.filter(transaction => transaction.createdBy === userId && transaction.receiptPath !== '')
        .map(transaction => ({
          ...transaction,
          from: from,
          id: groupId,
          ...group
      }));
    }
                
    return sort;
  };

  const handleTransactionPress = (transaction) => {
    console.log("trans", transaction.transaction[1]);
    if (transaction.from === 'Personal Expenses')
      router.push({ pathname: `/edit-transaction`, params: transaction });
    else
      router.push({ pathname: `/group-edit-transaction`, params: { transaction: JSON.stringify(transaction.transaction[1]), groups: JSON.stringify(transaction) } });
  };

  // Function to filter and sort the transactions based on selected group and sort order
  const filteredAndSortedReceipts = () => {
    let filteredReceipts = receipt;

    // Filter by selected group
    if (selectedGroupId) {
      filteredReceipts = receipt.filter(item => item.id === selectedGroupId);
    }

    // Sorting by timestamp
    return filteredReceipts.sort((a, b) => {
      const dateA = parseTimestamp(a.timestamp);
      const dateB = parseTimestamp(b.timestamp);
      return sortOrder !== 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

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

  return (
    <SafeAreaView className="w-full h-full">
      <Loader isLoading={loading}/>
      
      { receipt.length !== 0 ? (
        <View style={{flexDirection: 'row', padding: 10}}>
          <Picker
            style={{
              height: 50,
              width: '49%',
              backgroundColor: 'white'}}
            selectedValue={selectedGroupId}
            onValueChange={(itemValue) => {
              setSelectedGroupId(itemValue);
            }}
          >
            {
              id.map((item, index) => (
                <Picker.Item key={index} label={item.text} value={item.value} />
              ))
            }
          </Picker>

          <Picker
            style={{
              marginLeft: '2%',
              height: 50,
              width: '49%',
              backgroundColor: 'white'}}
            selectedValue={sortOrder}
            onValueChange={(itemValue) => {
              setSortOrder(itemValue);
            }}
          >
            <Picker.Item label="Newest" value="asc" />
            <Picker.Item label="Oldest" value="desc" />
          </Picker>
        </View>
      ) : (
        <></>
      )}

      {receipt.length !== 0 ? (
        <View style={{borderTopWidth: 1, borderColor: 'black', marginLeft: 20, marginEnd: 20, marginTop: 10}}></View>
      ) : (<></>)}

      { receipt.length !== 0 ? (
          <ScrollView style={{paddingStart: 20, paddingEnd: 20, paddingBottom: 20}}>
            {
              filteredAndSortedReceipts().map((item, index) => (
                <TouchableOpacity key={index} onPress={() => handleTransactionPress(item)}>
                  <View className="p-1" style={{borderBottomWidth: 1, borderColor: 'black'}}>
                    <Text className="font-pmedium text-sm mb-2" style={{color: 'black', opacity: 100}}>
                      {item.from}
                    </Text>
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

                    <Text className="text-base font-pregular text-gray mt-2">
                      {item.amount}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            }
          </ScrollView>
      ) : (
        <View className="w-full h-full" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text className="text-gray-400">No Receipt Uploaded</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Receipt;
