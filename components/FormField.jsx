import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";

import { icons } from "../constants";

const FormField = ({
  title,
  value,
  placeholder,
  handleChangeText,
  otherStyles,
  handleSubmit,
  searchSubmit,
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`space-y-2 ${otherStyles}`}>
      <Text className="text-base text-gray">{title}</Text>

      <View className="w-full h-16 px-4 rounded-2xl border-2 border-black-200 focus:border-primary flex flex-row items-center">
        <TextInput
          keyboardType={type}
          className="flex-1 text-black font-psemibold text-base"
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#7B7B8B"
          onChangeText={handleChangeText}
          secureTextEntry={(title === "Password" || title === "Confirm Password" || title === "Current Password" || title === "New Password") && !showPassword}
          {...props}
          onSubmitEditing={handleSubmit}
        />

        {(title === "Password"  || title === "Confirm Password" || title === "Current Password" || title === "New Password") && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={!showPassword ? icons.eye : icons.eyeHide}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {(title === "Search user by email") && (
          <TouchableOpacity onPress={searchSubmit}>
            <Image
              source={icons.search}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormField;
