import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const ExpensesLayout = () => {

  return (
    <>
      <Stack>
        <Stack.Screen
          name="view-expenses"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="expenses-graph"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="new-transaction"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="transaction-list"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="group-expenses"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="edit-transaction"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <StatusBar backgroundColor="#161622" style="light" />
    </>
  );
};

export default ExpensesLayout;
