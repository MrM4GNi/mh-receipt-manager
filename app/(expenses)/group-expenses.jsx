import React, { useState, useEffect }  from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Image, TouchableOpacity, Text, View, StyleSheet, ScrollView,Alert, BackHandler } from "react-native";
import PieChart from 'react-native-pie-chart'
import { router } from "expo-router";
import { icons } from "../../constants";
import { parseDateString } from "../../constants/parseDateString";
import { getGroup, addGroupTransaction } from "../../lib/firebase";
import { Loader } from "../../components";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatAmount } from '../../constants/clearAmount';

const GroupExpenses = () => {
    const item = useLocalSearchParams();
    const widthAndHeight = 120;
    const series = [123, 321, 123, 789, 537];
    const sliceColor = ['#fbd203', '#ffb300', '#ff9100', '#ff6c00', '#ff3c00'];
    const [ groups, setGroups ] = useState(item);
    const seriesNull = [100];
    const sliceColorNull = ['#eeeeee'];
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState('');
    const [result, setResult] = useState({
        totalAmountsByMonth: [],
        totalAmountsByCategory: [],
        latestTransaction: [],
    });
    const categories = ["Groceries", "House", "Transportation", "Utilities"];
    const notesArray = [
        "Weekly grocery shopping",
        "Utility bill payment",
        "Gas refill",
        "Home repair supplies",
        "Monthly rent",
        "Shopping for new furniture",
        "Electricity bill",
        "Buying snacks",
        "Public transport fare",
        "Buying cleaning supplies",
        "Purchasing household items",
        "Dinner takeout",
        "Buying a gift",
        "Home maintenance services",
        "Water bill",
        "Buying dog food",
        "Monthly internet subscription",
        "Buying kitchen gadgets",
        "Subscription service",
        "Charity donation",
        "School supplies for kids",
        "Buying office supplies",
        "Gardening supplies",
        "Fitness class pass",
        "Gas for road trip",
        "Seasonal decorations",
        "Buying a new appliance",
        "Thermostat maintenance",
        "Monthly insurance payment",
        "Home cleaning service",
        "Buying a bicycle",
    ];
    const startDate = new Date("2024-08-01");
    const endDate = new Date("2024-11-01");
    
    useEffect(() => {
        const hasGroup = async () => {
            try {
                const userId = await AsyncStorage.getItem("userId");
                setUserId(userId);
    
                const groupId = item.groudId;
                const resGroup = await getGroup(groupId);
                if (resGroup)
                {
                    setGroups({ ...resGroup });
                    const currentMonthTransactions = getCurrentMonthTransactions('current', groups.transaction);
                    const result = processTransactions(currentMonthTransactions);
                    setResult(result);
                }
    
                /*setGroups({ ...resGroup });
                const currentMonthTransactions = getCurrentMonthTransactions('current', groups.transaction);
                setResult(processTransactions(currentMonthTransactions));*/
    
                setLoading(false);
            } catch (error) {
                console.log("Groud info error", error.message);
                setLoading(false);
            }
        };

        hasGroup();
    }, [groups]);
    
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

    const processTransactions = (transactions) => {
        // Initialize an object to hold category totals
        const categoryTotals = {};
        let totalExp = 0;
        let totalBudget = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of the day
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999); // End of the day

        if (transactions === null || transactions === undefined || transactions === '')
            return {
                totalAmountsByMonth: [],
                totalAmountsByCategory: [],
                latestTransaction: [],
            };
    
        // Process each transaction
        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            const category = transaction.category;

            if (transaction.category === 'Budget')
                totalBudget += amount;
            else
                totalExp += amount;
        
            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
        
            categoryTotals[category] += amount;
        });
        
            // Convert to array of totals and sort by amount
            const totalByCategory = Object.entries(categoryTotals)
                .map(([category, total]) => ({ category, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 3); // Sort by total descending
        
            // Get just the totals in an array
            const totalsArray = Object.values(categoryTotals);

            
            //Process of todays transaction
            const todayTransactions = transactions.filter(transaction => {
            const transactionDate = parseDateString(transaction.timestamp);
            return transactionDate >= today && transactionDate <= endOfDay;
        });
    
        return {
            totalAmountsByMonth: totalsArray,
            totalAmountsByCategory: totalByCategory,
            latestTransaction: todayTransactions,
            expenses: totalExp,
            budget: totalBudget
        };
    };
    //const result = processTransactions(groups.transaction);

    const getAccessTypeByUserId = (userId) => {
        const user = groups.users.find(user => user.userId === userId);
        return user ? user.accessType : null;
    };

    const newTransaction = async () => {
        const accessType = getAccessTypeByUserId(userId);

        if (accessType === "viewer" && userId !== groups.ownerId)
        {
            Alert.alert("Error","You don't have access to add new transaction.");
            return;
        }
        
        router.push({ pathname: `/group-transaction`, params: groups });
    };

    const getCurrentMonthTransactions = (dateTransaction, transactions) => {
        if (!transactions) return [];
    
        const now = new Date();
        let currentYear = now.getUTCFullYear();
        let currentMonth = now.getUTCMonth() + 1;
    
        if (dateTransaction !== 'current') {
          const getTransDate = dateTransaction.split('-');
          currentYear = parseInt(getTransDate[0], 10);
          currentMonth = parseInt(getTransDate[1], 10);
        }
    
        const res =  transactions.filter(transaction => {
          const transactionDate = parseDateString(transaction.timestamp);
          return transactionDate.getUTCFullYear() === currentYear && transactionDate.getUTCMonth() + 1 === currentMonth;
        });
    
        return res;
    };

    const generateFakeData = async () => {
        const getRandomAmount = () => (Math.random() * 100).toFixed(2);
        const getRandomCategory = () => categories[Math.floor(Math.random() * categories.length)];
        const getRandomNote = () => notesArray[Math.floor(Math.random() * notesArray.length)];
        
        const formatTimestamp = (date) => {
          return date.toLocaleString("en-US", { timeZone: "Asia/Manila" });
        };
        
        for (let i = 0; i < 20; i++) {
            const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    
            const fakeData = {
              amount: getRandomAmount(),
                category: getRandomCategory(),
                notes: getRandomNote(),
                receiptPath: "",
                timestamp: formatTimestamp(randomDate),
            }
    
            await addGroupTransaction(groups.groupId, fakeData);
        }
    }

    return (
        <View className="h-full bg-white">
            <Loader isLoading={loading} />

            <ScrollView>
                <View style={{padding: 20}}>
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
                
                <View style={{flexDirection: 'row'}}>
                    <Text className="font-pmedium text-base mt-3" style={{color: '#5E62AC', opacity: 100}} onPress={generateFakeData}>
                        {groups?.name}
                    </Text>
                    {
                        (userId === groups.ownerId) && (
                            <Text 
                                className="font-pmedium text-base mt-3 text-right" 
                                style={{color: '#5E62AC', opacity: 100, flex: 1, textDecorationLine: 'underline',}}
                                onPress={() => router.push({ pathname: `/group-member`, params: groups })}>
                                settings
                            </Text>
                        )
                    }
                </View>
                
                <Text className="text-2xl font-psemibold" style={{color: 'black', opacity: 100}}>
                    {(result?.budget) && (result?.budget - result?.expenses).toFixed(2)}
                </Text>

                <View style={{flexDirection: 'row'}} className="mt-5 mb-5">
                    <View style={styles.leftView}>
                    <View style={styles.incomeCard}>
                        <Text className="font-pmedium text-sm" style={{color: 'green', opacity: 100}}>
                        Budget
                        </Text>
                        <Text className="text-md font-pregular" style={styles.totalExpensesText}>
                        {result?.budget}
                        </Text>
                    </View>
                    </View>
                    <View style={styles.rightView}>
                    <View style={styles.incomeCard}>
                        <Text className="font-pmedium text-sm" style={{color: 'red', opacity: 100}}>
                        Expenses
                        </Text>
                        <Text className="text-lg font-pregular" style={styles.totalExpensesText}>
                        {result?.expenses}
                        </Text>
                    </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={{flexDirection: 'row'}}>
                        <Text className="font-pmedium text-sm" style={{color: 'black', opacity: 100}}>
                            Expenses graph
                        </Text>
                        <Text 
                            className="font-pmedium text-sm text-right" 
                            style={{color: '#5E62AC', opacity: 100, flex: 1, textDecorationLine: 'underline',}}
                            onPress={() => router.push({ pathname: `/group-expenses-graph`, params: groups })}>
                            Report
                        </Text>
                    </View>
                    <View style={{flexDirection: 'row'}} className="mt-5">
                    <View style={styles.leftView}>
                        <PieChart
                        widthAndHeight={widthAndHeight}
                        series={result?.totalAmountsByMonth?.length === 0 ? seriesNull : result.totalAmountsByMonth}
                        sliceColor={result?.totalAmountsByMonth?.length === 0 ? sliceColorNull : sliceColor.slice(0, result.totalAmountsByMonth.length)}
                        coverRadius={0.75}
                        coverFill={'#FFF'}
                        />
                    </View>
                    <View style={styles.rightView}>
                        {(result?.totalAmountsByCategory?.length === 0) && (
                            <View className="w-full" style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center',}}>
                                <Text className="text-gray-400">No Data</Text>  
                            </View>
                        )}
                        {result.totalAmountsByCategory.map((item, index) => (
                            <View key={index} className="w-full" style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center',}}>
                                <View style={{width: 15, height: 15, backgroundColor: sliceColor[index], marginEnd: 10}}></View>
                                <View style={{flex: 1}}>
                                <Text className="font-pmedium text-sm" style={{color: 'black', opacity: 100}}>
                                    {item.category}
                                </Text>
                                <Text className="text-sm font-pregular text-gray-400">
                                    {item.total}
                                </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                    </View>
                </View>

                <View style={styles.card} className="mt-5">
                    <View style={{flexDirection: 'row'}}>
                    <Text className="font-pmedium text-sm" style={{color: 'black', opacity: 100}}>
                        Latest Transaction
                    </Text>
                    <Text className="font-pmedium text-sm text-right" 
                        style={{color: '#5E62AC', opacity: 100, flex: 1, textDecorationLine: 'underline',}}
                        onPress={() => router.push({ pathname: `/group-transaction-list`, params: groups })}>
                        See all
                    </Text>
                    </View>
                    <View className="mt-5">

                    {result.latestTransaction.length === 0 ? (
                        <View>
                            <Text className="font-pmedium text-sm text-center m-5" style={{color: 'gray', opacity: 100}}>
                                No latest transaction
                            </Text>
                        </View>
                    ) : 
                        result.latestTransaction.map((item, index) => (
                            <View key={index}>
                                { item.amount !== '0' ?
                                <View className="p-1">
                                    <Text className="font-pmedium text-sm" style={{color: 'black', opacity: 100}}>
                                    {item.category}
                                    </Text>
                                    <Text className="text-sm font-pregular text-gray-400">
                                    {formatAmount(item.amount)}
                                    </Text>
                                </View> : <></>
                                }
                            </View>
                                
                        ))
                    }
                    </View>
                </View> 

                <Text  className="mt-7 text-center" style={{fontWeight: 700, color: '#5E62AC'}} onPress={newTransaction}>+ Add Receipt</Text>
                </View>
            </ScrollView>
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
    totalExpensesText: {
      fontSize: 18,
      fontWeight: 'bold',
      letterSpacing: 1,  
    },
    container: {
      flex: 1,
      flexDirection: 'row',
    },
    leftView: {
      flex: 1,  // Takes up 50% of the width
      justifyContent: 'center',
      alignItems: 'center',
    },
    rightView: {
      flex: 1,  // Takes up 50% of the width
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      fontSize: 18,
      color: 'white',
    },
    incomeCard: {
      backgroundColor: 'white',
      borderRadius: 10,
      elevation: 5, // For Android shadow
      shadowColor: '#000', // For iOS shadow
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      paddingLeft: 20,
      paddingRight: 20,
      paddingTop: 5,
      paddingBottom: 5,
      width: '80%',
    },
});

export default GroupExpenses