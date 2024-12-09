import { NativeEventEmitter, NativeModules, ToastAndroid } from 'react-native';

const { RFIDModule } = NativeModules;

if (!RFIDModule) {
  throw new Error('RFIDModule not linked properly.');
}

const RFIDModuleEmitter = new NativeEventEmitter(RFIDModule);

const showToast = (message: string) => {
  ToastAndroid.show(message, ToastAndroid.SHORT);
};

const handleState = async (
  action: () => Promise<string>,
  operation: string,
  onSuccess?: () => Promise<void>,
) => {
  try {
    // console.log(`${operation} -> initiated`);

    const result = await action();

    // console.log(`${operation} -> process`);

    if (onSuccess) {
      await onSuccess();
    }

    showToast(`${operation} successful`);
    console.log(`${operation} -> result:`, result);

    return result;
  } catch (error) {
    console.error(`Error during ${operation}:`, error);
    showToast(`${operation} failed`);
    throw error;
  }
};

const RFID = {
  startDiscovery: async () => {
    return handleState(() => RFIDModule.startDiscovery(), 'Start Discovery');
  },

  stopDiscovery: async () => {
    return handleState(() => RFIDModule.stopDiscovery(), 'Stop Discovery');
  },

  pairDevice: async (deviceInfo: string) => {
    try {
      const address = deviceInfo.split(' - ')[1];
      if (!address || !/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(address)) {
        throw new Error(`Invalid Bluetooth address format: ${deviceInfo}`);
      }

      const result = await RFIDModule.pairDevice(address);
      console.log(`Pairing initiated for ${address}:`, result);
      return result;
    } catch (error) {
      console.error('Error pairing device:', error);
      throw error;
    }
  },

  unpairDevice: async (deviceAddress: string) => {
    return handleState(
      () => RFIDModule.unpairDevice(deviceAddress),
      `Unpairing ${deviceAddress}`,
    );
  },

  connectToDevice: async (deviceAddress: string) => {
    return handleState(
      () => RFIDModule.connectToDevice(deviceAddress),
      `Connecting to ${deviceAddress}`,
    );
  },

  getAvailableDevices: async () => {
    try {
      const devices = await RFIDModule.getAvailableDevices();
      console.log('Available devices:', devices);
      return devices;
    } catch (error) {
      console.error('Error fetching available devices:', error);
      throw error;
    }
  },

  getPairedDevices: async () => {
    try {
      const devices = await RFIDModule.getPairedDevices();
      // console.log('Paired devices:', devices);
      return devices;
    } catch (error) {
      console.error('Error fetching paired devices:', error);
      throw error;
    }
  },

  onDeviceDiscovered: (
    callback: (device: { deviceName: string; deviceAddress: string }) => void,
  ) => {
    const subscription = RFIDModuleEmitter.addListener(
      'DeviceDiscovered',
      (device) => {
        const { deviceName, deviceAddress } = device;

        // Normalize device name and address
        const normalizedDevice = {
          deviceName:
            deviceName === 'Unknown Device' || deviceName === 'Unknown'
              ? ''
              : deviceName,
          deviceAddress,
        };

        callback(normalizedDevice);
      },
    );
    return () => subscription.remove();
  },
};

export default RFID;
