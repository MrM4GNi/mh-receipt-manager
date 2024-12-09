import React from 'react'
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const ReceiptLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="create"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="group-transaction"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="group-transaction-list"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="group-member"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="group-expenses-graph"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="group-edit-transaction"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <StatusBar backgroundColor="#161622" style="light" />
    </>
  )
}

export default ReceiptLayout