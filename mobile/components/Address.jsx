import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Renders a single address card.
const AddressCard = ({
  iconName,
  iconBgColor,
  title,
  address,
  isPermanentDefault,
  isSelected,
  onSelect,
}) => (
  <View style={styles.addressCard}>
    <View style={styles.addressContent}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Icon name={iconName} size={20} color="white" />
      </View>
      <View style={styles.addressTextContainer}>
        <View style={styles.titleRow}>
          {/* Title is now by itself on the left */}
          <Text style={styles.addressTitle}>{title}</Text>

          {/* This new container holds the label and switch together on the right */}
          <View style={styles.switchContainer}>
            {isPermanentDefault && <Text style={styles.defaultLabel}>Default</Text>}
            <Switch
              value={isSelected}
              onValueChange={() => onSelect(title)}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={isSelected ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>
        <Text style={styles.addressText}>{address}</Text>
      </View>
    </View>
  </View>
);

const Address = ({ navigation }) => {
  const [selectedAddress, setSelectedAddress] = useState('Home');

  const addressData = [
    {
      iconName: 'home',
      iconBgColor: '#4CAF50',
      title: 'Home',
      address: '123 Happiness Avenue, Thrissur',
    },
    {
      iconName: 'briefcase',
      iconBgColor: '#2196F3',
      title: 'Office',
      address: '456 Serenity Road, Pala',
    },
    {
      iconName: 'home',
      iconBgColor: '#9C27B0',
      title: "Mom's House",
      address: '789 Tranquility Lane, Palakkad',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - MODIFIED TO MATCH PROFILE SCREEN */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (navigation?.canGoBack()) navigation.goBack();
          else navigation?.navigate?.('Account Settings');
        }}>
          {/* Changed icon name and color */}
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Address List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.addressList}>
          {addressData.map((item) => (
            <AddressCard
              key={item.title}
              iconName={item.iconName}
              iconBgColor={item.iconBgColor}
              title={item.title}
              address={item.address}
              isPermanentDefault={item.title === 'Home'}
              isSelected={selectedAddress === item.title}
              onSelect={setSelectedAddress}
            />
          ))}
        </View>
      </ScrollView>

      {/* Add New Address Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => console.log('Add new address')}
        >
          <Icon name="add" size={20} color="white" style={styles.addIcon} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Matched background color for consistency
  },
  // MODIFIED HEADER STYLES
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12, // Changed from 16 to 12
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Changed from #E0E0E0
  },
  // MODIFIED HEADER TITLE STYLES
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold', // Changed from '600'
    color: '#333', // Changed from #000
  },
  scrollView: {
    flex: 1,
  },
  addressList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    marginRight: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Address;