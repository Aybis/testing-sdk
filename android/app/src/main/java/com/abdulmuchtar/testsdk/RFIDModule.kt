package com.abdulmuchtar.testsdk

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice // Add this import
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.widget.ArrayAdapter
import com.example.rfid_handheld_sdk.BluetoothHandler
import com.example.rfid_handheld_sdk.Connect
import com.example.rfid_handheld_sdk.ZebraReader
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.util.Log

class RFIDModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private lateinit var bluetoothHelper: BluetoothHandler
    private var availableDevicesAdapter: ArrayAdapter<String>
    private var pairedDevicesAdapter: ArrayAdapter<String>
    private var connect: Connect? = null
    private var zebraReader: ZebraReader? = null

    init {
        // Initialize device adapters
        availableDevicesAdapter = ArrayAdapter(reactContext, android.R.layout.simple_list_item_1)
        pairedDevicesAdapter = ArrayAdapter(reactContext, android.R.layout.simple_list_item_1)
        // Initialize BluetoothHandler
        bluetoothHelper = BluetoothHandler(
            reactContext, 
            availableDevicesAdapter, 
            pairedDevicesAdapter
        )
    }

    override fun getName(): String {
        return "RFIDModule"
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

// Bluetooth Func
    @ReactMethod
    fun startDiscovery(promise: Promise) {
        try {
            if (BluetoothAdapter.getDefaultAdapter()?.isEnabled == true) {
                val filter = IntentFilter(BluetoothDevice.ACTION_FOUND)
                reactApplicationContext.registerReceiver(bluetoothReceiver, filter)
                bluetoothHelper.startDiscovery() // Start discovery without callback here
                promise.resolve("Discovery started")
            } else {
                promise.reject("BLUETOOTH_DISABLED", "Please enable Bluetooth")
            }
        } catch (e: Exception) {
            promise.reject("START_DISCOVERY_ERROR", e)
        }
    }

    @ReactMethod
    fun stopDiscovery(promise: Promise) {
        try {
            bluetoothHelper.stopDiscovery()
            reactApplicationContext.unregisterReceiver(bluetoothReceiver)
            promise.resolve("Discovery stopped")
        } catch (e: Exception) {
            promise.reject("STOP_DISCOVERY_ERROR", e)
        }
    }

    private val bluetoothReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val action: String? = intent?.action
            if (BluetoothDevice.ACTION_FOUND == action) {
                val device: BluetoothDevice? =
                    intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
                device?.let {
                    val deviceName = it.name
                    val deviceAddress = it.address

                    // Log the entire device object
                    Log.d("BluetoothReceiver", "Discovered device object: $it")

                    // Log specific details of the device
                    Log.d("BluetoothReceiver", "Device Name: $deviceName")
                    Log.d("BluetoothReceiver", "Device Address: $deviceAddress")
                    Log.d("BluetoothReceiver", "Device Bond State: ${it.bondState}")
                    Log.d("BluetoothReceiver", "Device Type: ${it.type}")

                    // Emit the device details to JS
                    val params = Arguments.createMap().apply {
                        putString("deviceName", deviceName)
                        putString("deviceAddress", deviceAddress)
                    }
                    sendEvent("DeviceDiscovered", params)
                }
            }
        }
    }

    @ReactMethod
    fun pairDevice(deviceAddress: String, promise: Promise) {
        try {
            bluetoothHelper.pairDeviceClick(deviceAddress)
            promise.resolve("Pairing with $deviceAddress initiated")
        } catch (e: Exception) {
            promise.reject("PAIRING_ERROR", e)
        }
    }

    private fun unpairDeviceClick(deviceAddress: String): Boolean {
        val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
        val device = bluetoothAdapter.getRemoteDevice(deviceAddress)
        return try {
            val method = device.javaClass.getMethod("removeBond")
            method.invoke(device) as Boolean
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    @ReactMethod
    fun unpairDevice(deviceAddress: String, promise: Promise) {
        try {
            if (!BluetoothAdapter.checkBluetoothAddress(deviceAddress)) {
                promise.reject("INVALID_ADDRESS", "$deviceAddress is not a valid Bluetooth address")
                return
            }

            val result = unpairDeviceClick(deviceAddress)
            if (result) {
                promise.resolve("Unpairing with $deviceAddress was successful")
            } else {
                promise.reject("UNPAIRING_FAILED", "Failed to unpair device with address $deviceAddress")
            }
        } catch (e: Exception) {
            promise.reject("UNPAIRING_ERROR", e)
        }
    }

    @ReactMethod
    fun getAvailableDevices(promise: Promise) {
        try {
            val devices = mutableListOf<String>()
            for (i in 0 until availableDevicesAdapter.count) {
                Log.d("Device", availableDevicesAdapter.getItem(i) ?: "")
                devices.add(availableDevicesAdapter.getItem(i) ?: "")
            }
            promise.resolve(Arguments.fromList(devices))
        } catch (e: Exception) {
            promise.reject("FETCH_DEVICES_ERROR", e)
        }
    }
    // @ReactMethod
    // fun getAvailableDevices(promise: Promise) {
    //     try {
    //         val devicesMap = mutableMapOf<String, String>() // Map to store unique addresses with preferred names

    //         for (i in 0 until availableDevicesAdapter.count) {
    //             val deviceInfo = availableDevicesAdapter.getItem(i) ?: ""
    //             val parts = deviceInfo.split(" - ") // Split into name and address

    //             if (parts.size == 2) {
    //                 val name = parts[0]
    //                 val address = parts[1]

    //                 // Only replace the name if the current one is "Unknown" or "Unknown Device"
    //                 if (!devicesMap.containsKey(address) || devicesMap[address] == "Unnamed Device") {
    //                     val deviceName = if (name == "Unknown" || name == "Unknown Device") "Unnamed Device" else name
    //                     devicesMap[address] = deviceName
    //                 }
    //             }
    //         }

    //         // Combine the name and address back for the result
    //         val uniqueDevices = devicesMap.map { (address, name) -> "$name - $address" }
    //         promise.resolve(Arguments.fromList(uniqueDevices))
    //     } catch (e: Exception) {
    //         promise.reject("FETCH_DEVICES_ERROR", e)
    //     }
    // }

    @ReactMethod
    fun getPairedDevices(promise: Promise) {
        try {
            val devices = mutableListOf<String>()
            for (i in 0 until pairedDevicesAdapter.count) {
                devices.add(pairedDevicesAdapter.getItem(i) ?: "")
            }
            promise.resolve(Arguments.fromList(devices))
        } catch (e: Exception) {
            promise.reject("FETCH_PAIRED_DEVICES_ERROR", e)
        }
    }


    // Connect to a device using Connect.connectDevice()
   @ReactMethod
    fun connectToDevice(deviceAddress: String, promise: Promise) {
        try {
            if (connect == null) {
                connect = Connect(reactApplicationContext)
            }

            connect?.let {
                // Call connectReader without arguments
                val result = it.connectReader() // Adjust this based on the SDK documentation
                promise.resolve("Device connected: $result")
            } ?: run {
                promise.reject("CONNECT_ERROR", "Connect instance is null")
            }
        } catch (e: Exception) {
            promise.reject("CONNECT_DEVICE_ERROR", e)
        }
    }

    @ReactMethod
    fun setBeeperVolume(level: String, promise: Promise) {
        try {
            when (level.uppercase()) {
                "QUIET", "LOW", "MEDIUM", "HIGH" -> {
                    zebraReader?.getBeeper()?.enabledBeep() // Replace with actual SDK method
                    promise.resolve("Beeper volume set to $level")
                }
                else -> {
                    promise.reject("INVALID_VOLUME_LEVEL", "Invalid volume level: $level")
                }
            }
        } catch (e: Exception) {
            promise.reject("SET_BEEPER_VOLUME_ERROR", e)
        }
    }

}
