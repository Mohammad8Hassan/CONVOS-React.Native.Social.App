import { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

// Full-screen camera that reads one QR code and hands its text to onScanned(text), then closes.
// Asks for the camera permission the first time it opens.
export default function QRScannerModal({ visible, onClose, onScanned, hint = 'Point the camera at a QR code' }) {
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  useEffect(() => {
    if(visible) {
      handled.current = false;
      if(permission && !permission.granted && permission.canAskAgain) requestPermission();
    }
  }, [visible, permission && permission.granted])

  const onBarcodeScanned = ({ data }) => {
    if(handled.current || !data) return;
    handled.current = true;
    onScanned(String(data).trim());
    onClose();
  }

  return (
    <Modal visible={visible} animationType='slide' onRequestClose={onClose}>
      <View style={styles.container}>
        {permission && permission.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing='back'
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={onBarcodeScanned}
          />
        ) : (
          <View style={styles.denied}>
            <Text style={styles.deniedText}>
              {permission && !permission.canAskAgain
                ? 'Camera access is turned off. Enable it for CONVOS in the phone settings to scan QR codes.'
                : 'Waiting for camera permission...'}
            </Text>
          </View>
        )}

        <SafeAreaView style={styles.overlay} pointerEvents='box-none'>
          <Pressable onPress={onClose} style={({ pressed }) => [{opacity: pressed ? 0.5 : 1}, styles.close]} hitSlop={10}>
            <Ionicons name='chevron-back-circle' size={32} color='white' />
          </Pressable>
          <View style={styles.frame} pointerEvents='none' />
          <Text style={styles.hint}>{ hint }</Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  close: { alignSelf: 'flex-start' },
  frame: { width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: '#d4c86e' },
  hint: { color: 'white', fontSize: 16, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  denied: { flex: 1, justifyContent: 'center', padding: 30 },
  deniedText: { color: 'white', fontSize: 17, textAlign: 'center' },
});
