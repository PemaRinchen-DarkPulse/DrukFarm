import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  MessageCircle,
} from "lucide-react-native";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  const handleSubmit = () => {
    if (!name || !isValidEmail(email) || !message) {
      Alert.alert("Error", "Please fill name, valid email and a message");
      return;
    }

    Alert.alert("Success", "Message sent — we will get back to you shortly");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Contact</Text>

      <View style={styles.grid}>
        {/* Left: Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Get in touch</Text>
          <Text style={styles.cardDesc}>
            Reach out for partnerships, support, or media inquiries.
          </Text>

          <View style={styles.infoList}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => Linking.openURL("mailto:contact@drukfarm.bt")}
            >
              <Mail color="#047857" size={20} />
              <Text style={styles.infoText}>contact@drukfarm.bt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => Linking.openURL("tel:+97512345678")}
            >
              <Phone color="#047857" size={20} />
              <Text style={styles.infoText}>+975 1234 5678</Text>
            </TouchableOpacity>

            <View style={styles.infoItem}>
              <MapPin color="#047857" size={20} />
              <Text style={styles.infoText}>Thimphu, Bhutan</Text>
            </View>
          </View>

          <Text style={[styles.cardTitle, { marginTop: 16 }]}>Follow us</Text>
          <View style={styles.socials}>
            <TouchableOpacity style={styles.socialIcon}>
              <Facebook color="#047857" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Instagram color="#047857" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <MessageCircle color="#047857" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right: Form */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Send message</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>Our Location</Text>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 27.4712,
            longitude: 89.6339,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{ latitude: 27.4712, longitude: 89.6339 }}
            title="DrukFarm"
            description="Thimphu, Bhutan"
          />
        </MapView>
        <TouchableOpacity
          style={styles.mapLinkButton}
          onPress={() =>
            Linking.openURL("https://www.google.com/maps?q=27.4712,89.6339")
          }
        >
          <Text style={styles.mapLinkText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F3F4F6",
  },
  header: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "column",
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
  },
  infoList: {
    marginTop: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#111",
  },
  socials: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  socialIcon: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#047857",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  mapContainer: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111",
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  mapLinkButton: {
    backgroundColor: "#047857",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  mapLinkText: {
    color: "#fff",
    fontWeight: "600",
  },
});
