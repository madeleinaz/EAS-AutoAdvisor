import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import ProcessScreen from './screens/ProcessScreen';
import ResultsScreen from './screens/ResultsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#333D29' },
          headerTintColor: '#C2C5AA',
          headerTitleStyle: { fontWeight: '500' },
          headerSubtitle: 'University of North Georgia',
          cardStyle: { backgroundColor: '#C2C5AA' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'AutoAdvisor' }} />
        <Stack.Screen name="Process" component={ProcessScreen} options={{ title: 'Analyzing...' }} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Your Report' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}