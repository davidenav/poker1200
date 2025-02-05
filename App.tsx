import React from "react";
import GamesList from "./src/GamesList";
import GameStatsScreen from './src/GameStatsScreen';
import GameScreen from './src/GameScreen';
import { RootStackParamList } from './src/types';
import { Button, View, StyleSheet, SafeAreaView, ImageBackground } from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
import outputs from "./amplify_outputs.json";
import { HeaderBackButton } from '@react-navigation/elements';

Amplify.configure(outputs);

const Stack = createNativeStackNavigator<RootStackParamList>();

const SignOutButton = () => {
  const { signOut } = useAuthenticator();

  return (
    <View style={styles.signOutButton}>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
};

const AppContent = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
        headerStyle: {
          backgroundColor: '#190224',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
        <Stack.Screen
          name="GamesList"
          component={GamesList}
          options={({ navigation }) => ({
            title: 'Games',
            headerRight: () => <SignOutButton />
          })}
        />
        <Stack.Screen
          name="GameStats"
          component={GameStatsScreen}
          options={({ navigation, route }) => (
            {
              title: 'Game Statistics',
              headerLeft: (props) => (
                <HeaderBackButton {...props}
                  onPress={() => {
                    navigation.navigate('GamesList');
                  }}
                />
              )
            }
          )}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ title: 'Game' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <Authenticator.Provider>
      <Authenticator signUpAttributes={['name']}>
        <SafeAreaView style={styles.container}>
          <AppContent />
        </SafeAreaView>
      </Authenticator>
    </Authenticator.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  signOutButton: {
    marginRight: 10,
  },
});

export default App;