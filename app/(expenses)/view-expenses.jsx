import { useState, useEffect } from "react";
import { Image, TouchableOpacity, Text, View, StyleSheet, ScrollView, Alert, BackHandler } from "react-native";
import PieChart from 'react-native-pie-chart';
import { router } from "expo-router";
import { icons } from "../../constants";
import { Modal } from "react-native-paper";
import { CustomButton, FormField, Loader } from "../../components";
import { parseDateString } from "../../constants/parseDateString";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addTransaction, db, getCurrentUser, updateBudgetLimit } from "../../lib/firebase";
import Checkbox from 'expo-checkbox';
import { cleanAmount, formatAmount } from "../../constants/clearAmount";

const ViewExpenses = () => {
  const widthAndHeight = 120;
  const series = [123, 321, 123, 789, 537];
  const sliceColor = ['#fbd203', '#ffb300', '#ff9100', '#ff6c00', '#ff3c00'];
  const seriesNull = [100];
  const sliceColorNull = ['#eeeeee'];

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [oldBudget, setOldBudget] = useState(0);
  const [isChecked, setIsChecked] = useState(true);

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
        setOldBudget(userInfo.budget);

        const budget = parseFloat(userInfo.budget);
        if (budget === 0)
          Alert.alert("Warning","Set up your budget limit per month");

        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);
  
  const back = () => {
    router.push("/home");
  };

  useEffect(() => {
    const backAction = () => {
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
  }, []);

  const processTransactions = (transactions) => {
    const categoryTotals = {};
    let totalExp = 0;
    let totalBudget = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    if (!transactions)
      return [];

    transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      const category = transaction.category;

      if (category === 'Budget') {
        totalBudget += amount;
      } else {
        totalExp += amount;
      }

      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }

      categoryTotals[category] += amount;
    });

    const totalByCategory = Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const totalsArray = Object.values(categoryTotals);

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

  const getCurrentMonthTransactions = (transactions) => {
    if (!transactions) return [];

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    return transactions.filter(transaction => {
      const transactionDate = parseDateString(transaction.timestamp);
      return transactionDate.getUTCFullYear() === currentYear && transactionDate.getUTCMonth() + 1 === currentMonth;
    });
  };

  const currentMonthTransactions = getCurrentMonthTransactions(user?.transaction);
  const result = processTransactions(currentMonthTransactions);

  const updateBudget = async () => {
    setIsUpdating(true); 
    const amnt = cleanAmount(user.budget);

    if (amnt <= 0)
    {
      Alert.alert("Error","Budget limit cannot be 0");
      setIsUpdating(false);
      setUser({ ...user, budget: oldBudget });
      return;
    }

    const isBusgetChanged = oldBudget !== user.budget;
    if (isBusgetChanged) {
      try {
        const isSaved = await updateBudgetLimit(user.userId, amnt);

        if (isSaved && isChecked)
        {
          const newTransaction = {
            timestamp: formatDate(),
            notes: 'Update budget limit',
            amount: amnt - oldBudget,
            category: 'Budget',
            receiptPath: ''
          };

          await addTransaction(user.userId, newTransaction);
        }

        if (isSaved && !isChecked)
        {
            Alert.alert("Success", "Saved successfully! but your budget limit will apply next month.");
        } else {
            Alert.alert("Success", "Saved successfully!");
        }
        setOldBudget(user.budget);
      } catch (error) {
        console.log(error.message);
      } finally {
        setIsUpdating(false);
        setModalVisible(false);
      }
    } else {
      Alert.alert("Warning","No changes made to the budget.");
      setIsUpdating(false);
      setModalVisible(false);
    }
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
  
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Loader isLoading={loading} />

      <ScrollView className="mt-5">
        <View style={{ padding: 20 }}>
          <TouchableOpacity onPress={back} style={{ flexDirection: 'row', marginTop: 5 }}>
            <Image source={icons.leftArrow} resizeMode="contain" style={{ width: 24, height: 24 }} />
          </TouchableOpacity>
          
          <Text style={{ fontSize: 18, color: '#5E62AC', opacity: 1, marginTop: 3 }}>
            Personal Tracker
          </Text>
          
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'black' }}>
            {formatAmount(result?.budget - result?.expenses)}
          </Text>

          <View style={{ flexDirection: 'row', marginVertical: 5 }}>
            <View style={styles.leftView}>
              <View style={styles.incomeCard}>
                <Text style={{ fontSize: 14, color: 'green' }}>
                  Budget
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.totalExpensesText} onPress={() => setModalVisible(true)}>
                    {formatAmount(user?.budget)}
                  </Text>
                  <Image source={icons.pencil} resizeMode="contain" style={{ width: 16, height: 16, marginLeft: 8 }} />
                </View>
              </View>
            </View>
            <View style={styles.rightView}>
              <View style={styles.incomeCard}>
                <Text style={{ fontSize: 14, color: 'red' }}>
                  Expenses
                </Text>
                <Text style={styles.totalExpensesText}>
                  {formatAmount(result?.expenses)}
                </Text>
              </View>
            </View>
          </View>

          {user ? (
            <>
              <View className="mt-5" style={styles.card}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ fontSize: 14, color: 'black' }}>
                    Expenses graph
                  </Text>
                  <Text 
                    style={{ color: '#5E62AC', flex: 1, textDecorationLine: 'underline', textAlign: 'right' }}
                    onPress={() => router.push('/expenses-graph')}>
                    Report
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 5 }}>
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
                    {result.totalAmountsByCategory.length === 0 ? (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: 'gray' }}>No Data</Text>
                      </View>
                    ) : (
                      result.totalAmountsByCategory.map((item, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 15, height: 15, backgroundColor: sliceColor[index], marginRight: 10 }}></View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, color: 'black' }}>
                              {item.category}
                            </Text>
                            <Text style={{ fontSize: 12, color: 'gray' }}>
                              {formatAmount(item.total)}
                            </Text>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.card} className="mt-5">
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ fontSize: 14, color: 'black' }}>
                    Latest Transaction
                  </Text>
                  <Text style={{ color: '#5E62AC', flex: 1, textDecorationLine: 'underline', textAlign: 'right' }} 
                    onPress={() => router.push("/transaction-list")}>
                    See all
                  </Text>
                </View>
                <View style={{ marginTop: 5 }}>
                  {result.latestTransaction.length === 0 ? (
                    <Text style={{ fontSize: 14, textAlign: 'center', marginVertical: 5, color: 'gray' }}>
                      No latest transaction
                    </Text>
                  ) : 
                    result.latestTransaction.map((item, index) => (
                      <View key={index}>
                        { item.amount !== '0' ?
                          <View style={{ paddingVertical: 4 }}>
                            <Text style={{ fontSize: 14, color: 'black' }}>
                              {item.category}
                            </Text>
                            <Text style={{ fontSize: 12, color: 'gray' }}>
                              {formatAmount(item.amount)}
                            </Text>
                          </View> : <></>
                        }
                      </View>
                    ))
                  }
                </View>
              </View> 
            </>
          ) : null}

          <Text style={{ marginTop: 14, textAlign: 'center', fontWeight: 'bold', color: '#5E62AC' }} onPress={() => router.push("new-transaction")}>
            + Add Receipt
          </Text>
        </View>
      </ScrollView>

      <Modal transparent={true} animationType="fade" visible={modalVisible}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={{ alignItems: 'flex-end' }} onPress={() => setModalVisible(false)}>
              <Image source={icons.close} resizeMode="contain" style={{ width: 24, height: 24 }} />
            </TouchableOpacity>

            <FormField
              title='Budget Limit (note: This is per month)'
              value={user?.budget.toString()}
              handleChangeText={(e) => setUser({ ...user, budget: e })}
              type="numeric"/>

            <View className="flex-row mt-3 mb-5">
              <Checkbox
                value={isChecked}
                onValueChange={toggleCheckbox}
              />
              <Text className="ml-3">Effective this month</Text>
            </View>

            <CustomButton 
              title="SAVE"
              containerStyles={{ width: '100%', marginTop: 20 }}
              handlePress={updateBudget}
              isLoading={isUpdating}/>
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
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      width: '100%',
      padding: 20,
    },
    totalExpensesText: {
      fontSize: 18,
      fontWeight: 'bold',
      letterSpacing: 1,  
    },
    leftView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    rightView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    incomeCard: {
      backgroundColor: 'white',
      borderRadius: 10,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      padding: 10,
      width: '80%',
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
    },
    modalText: {
      fontSize: 18,
      marginBottom: 20,
    },
});

export default ViewExpenses;
