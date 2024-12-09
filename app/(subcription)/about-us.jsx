import { View, Text, ScrollView,TouchableOpacity, Image, BackHandler } from 'react-native'
import React from 'react';
import { useEffect } from 'react';
import { icons } from "../../constants";
import { router } from 'expo-router';

const AboutUs = () => {

    const back = async () => {
        router.push("/profile");
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

    return (
        <View className="w-full h-full">
            <ScrollView className="p-5">
                <TouchableOpacity
                    onPress={back}
                    className="flex mt-5">
                    <Image
                        source={icons.leftArrow}
                        resizeMode="contain"
                        className="w-6 h-6"
                    />
                </TouchableOpacity>
                
                <Text className="font-pmedium text-lg mt-3" style={{flex: 1, color: '#5E62AC', opacity: 100}}>
                    ABOUT US
                </Text>

                <Text className="mt-2 w-full" style={{textAlign: 'justify',}}>We are a team of passionate 4th-year Computer Science students from Taguig City University working together to develop the Mobile Household Receipt Manager—a streamlined solution for expense tracking through automated receipt scanning and NLP-based categorization. Our shared vision is to simplify financial management for everyday users by leveraging modern mobile and AI technologies.</Text>
            
                <Text className="font-pmedium text-base mt-5" style={{flex: 1, color: '#5E62AC', opacity: 100}}>
                    OUR TEAM
                </Text>

                <Text className="mt-2" style={{textAlign: 'justify'}}>
                    JHON MIRO CAPILI – Programmer
                    Jhon is responsible for building the app using React Native. His expertise ensures smooth functionality across platforms.
                </Text>
                <Text className="mt-3" style={{textAlign: 'justify'}}>
                    DIONNE MARWEEN BOCO – Tester
                    Dionne handles testing, making sure the app is user-friendly and bug-free.
                </Text>
                <Text className="mt-3" style={{textAlign: 'justify'}}>
                    JUSTINE DE LEON – Technical Writer
                    Justine documents the technical aspects of the project, making our work clear and understandable.
                </Text>
                <Text className="mt-3" style={{textAlign: 'justify'}}>
                    JAN VERNICE ESCLABANAN – UI/UX Designer
                    Jan creates the look and feel of the app, ensuring it's both attractive and easy to use.
                </Text>


                <Text className="font-pmedium text-base mt-5" style={{flex: 1, color: '#5E62AC', opacity: 100}}>
                    OUR VISION
                </Text>

                <Text className="mt-2" style={{textAlign: 'justify'}}>
                    Our vision is to empower households to manage their expenses more efficiently with the help of technology. By simplifying the often tedious task of manual receipt logging and expense categorization, we hope to offer a solution that makes financial management more accessible and less time-consuming for everyone.
                </Text>

                <Text className="font-pmedium text-base mt-5" style={{flex: 1, color: '#5E62AC', opacity: 100}}>
                    HOW WE WORK
                </Text>

                <Text className="mt-2" style={{textAlign: 'justify'}}>
                    We believe that collaboration and communication are key to successful project development. Our team employs Agile methodologies, holding regular stand-up meetings to track progress, exchange ideas, and solve problems as a group. Each member brings their unique strengths to the table, ensuring a well-rounded and high-quality final product.
                </Text>

                <Text className="font-pmedium text-base mt-5" style={{flex: 1, color: '#5E62AC', opacity: 100}}>
                    FUTURE PLAN
                </Text>

                <Text className="mt-2 mb-10" style={{textAlign: 'justify'}}>
                As we near completion of our thesis, we see tremendous potential for the Mobile Household Receipt Manager to evolve into a full-fledged product that can help families around the world track their expenses effortlessly. Our goal is to continue refining the app, adding new features, and eventually bringing it to market.
                </Text>
            </ScrollView>
        </View>
    )
}

export default AboutUs