import { NativeModules, NativeEventEmitter } from 'react-native';

const { RFIDModule } = NativeModules;

if (!RFIDModule) {
  throw new Error('RFIDModule is not linked properly.');
}

// Define types for devices
export type Device = {
  deviceName: string;
  deviceAddress: string;
};

// Event emitter instance
const RFIDEventEmitter = new NativeEventEmitter(RFIDModule);

const startDiscovery = async (): Promise<string> => {
  try {
    return await RFIDModule.startDiscovery();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to start discovery');
  }
};

const stopDiscovery = async (): Promise<string> => {
  try {
    return await RFIDModule.stopDiscovery();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to stop discovery');
  }
};

const pairDevice = async (deviceAddress: string): Promise<string> => {
  try {
    return await RFIDModule.pairDevice(deviceAddress);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to pair device');
  }
};

const unpairDevice = async (deviceAddress: string): Promise<string> => {
  try {
    return await RFIDModule.unpairDevice(deviceAddress);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to unpair device');
  }
};

const getAvailableDevices = async (): Promise<Device[]> => {
  try {
    const devices = await RFIDModule.getAvailableDevices();
    console.log(devices, '<<< device get available');

    return devices;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch available devices');
  }
};

const getPairedDevices = async (): Promise<Device[]> => {
  try {
    const devices = await RFIDModule.getPairedDevices();
    return devices;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch paired devices');
  }
};

const addListener = (eventName: string, callback: (device: Device) => void) => {
  RFIDEventEmitter.addListener(eventName, callback);
};

const removeAllListeners = (eventName: string) => {
  RFIDEventEmitter.removeAllListeners(eventName);
};

export default {
  startDiscovery,
  stopDiscovery,
  pairDevice,
  unpairDevice,
  getAvailableDevices,
  getPairedDevices,
  addListener,
  removeAllListeners,
};
