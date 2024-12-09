import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import RFIDModule, { Device } from './RFIDModule';

const App: React.FC = () => {
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [pairedDevices, setPairedDevices] = useState<Device[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    RFIDModule.addListener('DeviceDiscovered', (device) => {
      setAvailableDevices((prev) => [...prev, device]);
    });

    return () => {
      RFIDModule.removeAllListeners('DeviceDiscovered');
    };
  }, []);

  const handleStartDiscoveryWithTimeout = async () => {
    try {
      await RFIDModule.startDiscovery();
      Alert.alert('Discovery Started', 'Searching for devices...');

      // Set a timeout to stop discovery after 3 seconds
      setTimeout(async () => {
        try {
          await RFIDModule.stopDiscovery();
          Alert.alert('Discovery Stopped', 'Stopped after 3 seconds');
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }, 3000); // 3 seconds timeout
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleFetchAvailableDevices = async () => {
    setAvailableDevices([]);
    try {
      const devices = await RFIDModule.getAvailableDevices();
      console.log(devices, '<<<< availab device');

      setAvailableDevices(devices);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleFetchPairedDevices = async () => {
    setPairedDevices([]);
    try {
      const devices = await RFIDModule.getPairedDevices();
      console.log(devices, '<<<< paired device');
      setPairedDevices(devices);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const filteredAvailableDevices = availableDevices.filter((device) =>
    device?.deviceName?.toLowerCase()?.includes(searchQuery.toLowerCase()),
  );

  const filteredPairedDevices = pairedDevices.filter((device) =>
    device?.deviceName?.toLowerCase()?.includes(searchQuery.toLowerCase()),
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>RFID Bluetooth Module</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search devices"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <Button
        title="Start Discovery"
        onPress={handleStartDiscoveryWithTimeout}
      />
      <Button
        title="Fetch Available Devices"
        onPress={handleFetchAvailableDevices}
      />
      <Button title="Fetch Paired Devices" onPress={handleFetchPairedDevices} />

      <Text style={styles.listHeader}>
        Available Devices ({filteredAvailableDevices.length}):
      </Text>
      <FlatList
        data={availableDevices}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>{`Device: ${item}`}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No available devices found.</Text>}
      />

      <Text style={styles.listHeader}>
        Paired Devices ({filteredPairedDevices.length}):
      </Text>
      <FlatList
        data={filteredPairedDevices}
        keyExtractor={(item) => item.deviceAddress}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>{`Name: ${item.deviceName}`}</Text>
            <Text>{`Address: ${item.deviceAddress}`}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No paired devices found.</Text>}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  listHeader: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
});

export default App;
