import { Stack } from 'expo-router';

export default function TelemedicineLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Telemedicina',
          headerStyle: { backgroundColor: '#22c55e' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
    </Stack>
  );
}
