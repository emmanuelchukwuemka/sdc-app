import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BRAND_GREEN = "#16A34A";

export default function IpJourney({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journey & Contracts</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Contracts</Text>
        <Text style={styles.text}>This is where your contracts will appear.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAF9" },
  title: { fontSize: 22, fontWeight: "900", color: BRAND_GREEN },
  text: { marginTop: 10, color: "#374151" },
});
