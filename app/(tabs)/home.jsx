import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Text, View, StyleSheet, Alert, BackHandler } from "react-native";
import PieChart from 'react-native-pie-chart';
import { router, useFocusEffect } from "expo-router";
import { Loader } from "../../components";
import { getGroup, getCurrentUser, addTransaction, addGroupTransaction, checkIfBudgetRefresh, checkIfGroupBudgetRefresh } from "../../lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseDateString } from "../../constants/parseDateString";
import { cleanAmount, formatAmount } from '../../constants/clearAmount';

const Home = () => {
  const [groups, setGroups] = useState([]);
  const widthAndHeight = 120;
  const seriesNull = [100];
  const sliceColorNull = ['#eeeeee'];
  const sliceColor = ['#fbd203', '#ffb300', '#ff9100', '#ff6c00', '#ff3c00'];
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState({
    totalAmountsByMonth: [],
    totalAmountsByCategory: [],
    latestTransaction: [],
    budget: 0,
    expenses: 0
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
        const currentYear = new Date().getFullYear();
        const userId = await AsyncStorage.getItem('userId');
  
        const userInfo = await getCurrentUser(userId);
        setUser(userInfo);

        if (userInfo)
        {
            const currentMonthTransactions = getCurrentMonthTransactions(userInfo.transaction);
            const result2 = processTransactions(currentMonthTransactions);
            setResult(result2);
        }

        if (userInfo.group !== null && userInfo.group.length !== 0) {
          const groupPromises = userInfo.group.map(async (item) => {
            const resGroup = await getGroup(item.groupId);
            const res = getCurrentMonthTransactions(resGroup.transaction);
            const result = processTransactions(res);
  
            if (userInfo.userId === resGroup.ownerId)
              {
                const budgetForThisMonth = {
                  timestamp: new Date().toLocaleString(),
                  notes: getCurrentMonth().toString() + ' 1, ' + currentYear.toString() + ' refreshed budget limit',
                  amount: cleanAmount(resGroup.budget),
                  category: 'Budget',
                  receiptPath: '',
                  createdBy: 'System'
                }
      
                const isBudgetRefresh = await checkIfGroupBudgetRefresh(item.groupId, budgetForThisMonth.notes);

                if (!isBudgetRefresh)
                  await addGroupTransaction(item.groupId, budgetForThisMonth);
              }
            
            return { ...resGroup, result };
          });
          const groupsData = await Promise.all(groupPromises);
          setGroups(groupsData);
        }
    
        const budgetForThisMonth = {
          timestamp: new Date().toLocaleString(),
          notes: getCurrentMonth().toString() + ' 1, ' + currentYear.toString() + ' refreshed budget limit',
          amount: cleanAmount(userInfo.budget),
          category: 'Budget',
          receiptPath: '',
          createdBy: 'System'
        }

        const isBudgetRefresh = await checkIfBudgetRefresh(budgetForThisMonth.notes);

        if (!isBudgetRefresh)
          await addTransaction(userInfo.userId, budgetForThisMonth);
        
        setLoading(false);
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    };
    
    hasGroup();
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert('Hold on!', 'Are you sure you want to exit the app?', [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          { text: 'YES', onPress: () => BackHandler.exitApp() }, // Exit the app
        ]);
        return true;
      };
  
      BackHandler.addEventListener(
        'hardwareBackPress', onBackPress
      );
  
      return () =>
        BackHandler.removeEventListener(
          'hardwareBackPress', onBackPress
        );
    }, [])
  );

  const createGroup = () => {
    if (user?.canCreateGroupForSharing === 0) {
      Alert.alert('Message', "Subscribe to premium account to be able to create a group.");
    } else {
      router.push("/create");
    }
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleString('default', { month: 'long' });
  };

  const processTransactions = (transactions) => {
    const categoryTotals = {};
    let totalExp = 0;
    let totalBudget = 0;
    if (!transactions) return [];

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      const category = transaction.category;

      if (transaction.category === 'Budget')
        totalBudget += amount;
      else
        totalExp += amount;

      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    const totalByCategory = Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    return {
      totalAmountsByMonth: Object.values(categoryTotals),
      totalAmountsByCategory: totalByCategory,
      expenses: totalExp,
      budget: totalBudget
    };
  };

  const getCurrentMonthTransactions = (transactions) => {
    if (!transactions)
      return [];

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1; // 0-indexed (0 for January, 1 for February, etc.)

    
    return transactions.filter(transaction => {
        const transactionDate = parseDateString(transaction.timestamp);
        return transactionDate.getUTCFullYear() === currentYear && transactionDate.getUTCMonth() + 1 === currentMonth;
    });
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

        await addTransaction(user.userId, fakeData);
    }
  }

  return (
    <SafeAreaView className="bg-white h-full">
      <Loader isLoading={loading} />

      {(user?.scanReceipt === 0) && (
        <View className="p-2 bg-slate-200 flex-row w-full">
          <Text>Free Trial: {user?.scanReceiptLeft} receipt scan and {user?.canCreateGroupForSharing} group for sharing</Text>
        </View>
      )}

      <ScrollView>
        <View className="flex my-6 px-4 space-y-6">
          <View className="flex justify-between items-start flex-row">
            <View className="w-full">
              <Text className="font-pmedium text-sm" style={{ color: '#5E62AC' }}>
                Welcome Back
              </Text>
              <View className="flex-row w-full items-center">
                <Text className="text-2xl font-psemibold" style={{ color: '#5E62AC' }} onPress={generateFakeData}>
                  {user?.fullName}
                </Text>
                <Text className="text-right" style={{ fontWeight: '700', color: '#5E62AC', flex: 1 }} onPress={createGroup}>
                  + Create group
                </Text>
              </View>
            </View>
          </View>

          {(groups) && (
            <>
              {groups.map((item, index) => (
                <View key={index} style={styles.card}>
                  <View className="flex-row">
                    <Text
                      className="font-pmedium text-base"
                      style={{ color: '#5E62AC' }}
                      onPress={() => router.push({ pathname: `/group-expenses`, params: item })}
                    >
                      {item.name}
                    </Text>
                    <Text className="font-pmedium text-base text-right" style={{ flex: 1 }}>
                      {getCurrentMonth()}
                    </Text>
                  </View>
                  <Text className="text-lg font-pregular" style={styles.totalExpensesText}>
                    {formatAmount(item.result.budget - item.result.expenses)}
                  </Text>

                  <View style={{ flexDirection: 'row' }} className="mt-5">
                    <View style={styles.leftView}>
                      <PieChart
                        widthAndHeight={widthAndHeight}
                        series={item.result.totalAmountsByMonth.length === 0 ? seriesNull : item.result.totalAmountsByMonth}
                        sliceColor={item.result.totalAmountsByMonth.length === 0 ? sliceColorNull : sliceColor.slice(0, item.result.totalAmountsByMonth.length)}
                        coverRadius={0.75}
                        coverFill={'#FFF'}
                      />
                    </View>
                    <View style={styles.rightView}>
                      {item.result.totalAmountsByCategory.length === 0 ? (
                        <View className="w-full" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                          <Text className="text-gray-400">No Data</Text>
                        </View>
                      ) : (
                        item.result.totalAmountsByCategory.map((categoryItem, index) => (
                          <View key={index} className="w-full" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ width: 15, height: 15, backgroundColor: sliceColor[index], marginEnd: 10 }}></View>
                            <View style={{ flex: 1 }}>
                              <Text className="font-pmedium text-sm" style={{ color: 'black' }}>
                                {categoryItem.category}
                              </Text>
                              <Text className="text-sm font-pregular text-gray-400">
                                {formatAmount(categoryItem.total)}
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row' }} className="mt-7">
                    <View style={styles.leftView}>
                      <View style={styles.incomeCard}>
                        <Text className="font-pmedium text-sm" style={{ color: 'green' }}>
                          Budget
                        </Text>
                        <Text className="text-base font-psemibold">
                          {formatAmount(item.result.budget)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rightView}>
                      <View style={styles.incomeCard}>
                        <Text className="font-pmedium text-sm" style={{ color: 'red' }}>
                          Expenses
                        </Text>
                        <Text className="text-base font-psemibold">
                          {formatAmount(item.result.expenses)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}

          {(result) && (
            <View style={styles.card}>
              <View className="flex-row">
                <Text className="font-pmedium text-base" style={{ color: '#5E62AC' }} onPress={() => router.push("/view-expenses")}>
                  Personal Expenses
                </Text>
                <Text className="font-pmedium text-base text-right" style={{ flex: 1 }}>{getCurrentMonth()}</Text>
              </View>
              <Text className="text-md font-pregular" style={styles.totalExpensesText}>
                {isNaN(result?.budget - result?.expenses) ? 0 : formatAmount((result?.budget - result?.expenses))}
              </Text>

              <View style={{ flexDirection: 'row' }} className="mt-5">
                <View style={styles.leftView}>
                  <PieChart
                    widthAndHeight={widthAndHeight}
                    series={result?.budget === 0 ? seriesNull : result.totalAmountsByMonth}
                    sliceColor={result?.budget === 0 ? sliceColorNull : sliceColor.slice(0, result.totalAmountsByMonth.length)}
                    coverRadius={0.75}
                    coverFill={'#FFF'}
                  />
                </View>
                <View style={styles.rightView}>
                  {result?.totalAmountsByCategory?.length === 0 ? (
                    <View className="w-full" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                      <Text className="text-gray-400">No Data</Text>
                    </View>
                  ) : (
                    result.totalAmountsByCategory.map((item, index) => (
                      <View key={index} className="w-full" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ width: 15, height: 15, backgroundColor: sliceColor[index], marginEnd: 10 }}></View>
                        <View style={{ flex: 1 }}>
                          <Text className="font-pmedium text-sm" style={{ color: 'black' }}>
                            {item.category}
                          </Text>
                          <Text className="text-sm font-pregular text-gray-400">
                            {formatAmount(item.total)}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row' }} className="mt-7">
                <View style={styles.leftView}>
                  <View className="w-75" style={styles.incomeCard}>
                    <Text className="font-pmedium text-sm" style={{ color: 'green' }}>
                      Budget
                    </Text>
                    <Text className="text-base font-psemibold">
                      {formatAmount(result?.budget)}
                    </Text>
                  </View>
                </View>
                <View style={styles.rightView}>
                  <View style={styles.incomeCard}>
                    <Text className="font-pmedium text-sm" style={{ color: 'red' }}>
                      Expenses
                    </Text>
                    <Text className="text-base font-psemibold">
                      {formatAmount(result?.expenses)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.leftView} className="mt-5">
            
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5, // For Android shadow
    //shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    width: '100%', // Full width of the screen
    padding: 20,
    marginTop: 20,
  },
  totalExpensesText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
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
  incomeCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    padding: 10,
    width: '80%',
  },
});

export default Home;
  
