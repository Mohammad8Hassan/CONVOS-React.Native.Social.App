import { StyleSheet, Text, View, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons } from '@expo/vector-icons';

export default function QRCodeModal({ visible, onClose, title, value, caption, onCopy }) {
  return (
    <Modal visible={visible} animationType='fade' transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.outer}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <Text style={styles.title}>{ title }</Text>
              { caption ? <Text style={styles.caption} numberOfLines={2}>{ caption }</Text> : null }

              <View style={styles.qrFrame}>
                { value ? <QRCode value={value} size={220} backgroundColor='white' color='#261235' /> : null }
              </View>

              <Text style={styles.id} selectable>{ value }</Text>

              <View style={styles.row}>
                { onCopy &&
                  <Pressable onPress={onCopy} style={({ pressed }) => [{opacity: pressed ? 0.5 : 1}, styles.button]}>
                    <MaterialIcons name='file-copy' size={16} color='#613a5f' />
                    <Text style={styles.buttonText}>Copy</Text>
                  </Pressable>
                }
                <Pressable onPress={onClose} style={({ pressed }) => [{opacity: pressed ? 0.5 : 1}, styles.button]}>
                  <Text style={styles.buttonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#806b96', borderRadius: 24, padding: 20, alignItems: 'center', elevation: 15, alignSelf: 'stretch' },
  title: { color: 'white', fontSize: 20, fontFamily: 'Solway-Regular' },
  caption: { color: '#ede9f2', fontSize: 14, marginTop: 2, textAlign: 'center' },
  qrFrame: { backgroundColor: 'white', padding: 16, borderRadius: 18, marginVertical: 16 },
  id: { color: 'white', opacity: 0.75, fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  row: { flexDirection: 'row', marginTop: 18 },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d4c86e', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, marginHorizontal: 6 },
  buttonText: { color: '#613a5f', fontSize: 16, marginLeft: 4 },
});
