import { View, Text } from 'react-native'
import React from 'react'
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const _layout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="premium"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="about-us"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <StatusBar backgroundColor="#161622" style="light" />
    </>
  )
}

export default _layout