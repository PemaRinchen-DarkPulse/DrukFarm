import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { height: screenHeight } = Dimensions.get('window');

export default function FarmerFilterModal({
  visible,
  onClose,
  slideAnim,
  panResponder,
  activeTab,
  // Search
  orderSearchText,
  setOrderSearchText,
  // Category
  productCategoryFilter,
  setProductCategoryFilter,
  categoryOptions,
  showCategoryDropdown,
  setShowCategoryDropdown,
  // Date
  orderDateFilter,
  setOrderDateFilter,
  showDateDropdown,
  setShowDateDropdown,
  // Price
  orderPriceFilter,
  setOrderPriceFilter,
  showPriceDropdown,
  setShowPriceDropdown,
  // Actions
  onApply,
  onClear,
  closeAllDropdowns,
}) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.overlayBackground} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <Animated.View 
          style={[styles.bottomSheet, { top: slideAnim }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleBar} />
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>
              {activeTab === "Products" ? "Filter Products" : "Filter Orders"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
            {/* Search Section */}
            {activeTab === "Orders" && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Search</Text>
                <View style={styles.searchInputWrapper}>
                  <Icon name="magnify" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Search by buyer name or order ID"
                    placeholderTextColor="#9CA3AF"
                    value={orderSearchText}
                    onChangeText={setOrderSearchText}
                  />
                  {orderSearchText.length > 0 && (
                    <TouchableOpacity onPress={() => setOrderSearchText("")}>
                      <Icon name="close-circle" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Category Filter (Products Tab) */}
            {activeTab === "Products" && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                <View style={styles.inputContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowDateDropdown(false);
                      setShowPriceDropdown(false);
                      setShowCategoryDropdown(!showCategoryDropdown);
                    }}
                  >
                    <Icon name="shape" size={20} color="#6B7280" style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, !productCategoryFilter && styles.placeholderText]}>
                      {productCategoryFilter || 'Select Category'}
                    </Text>
                    <Icon name={showCategoryDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                  
                  {showCategoryDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {["All Categories", ...categoryOptions].map((category, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setProductCategoryFilter(category);
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{category}</Text>
                            {productCategoryFilter === category && (
                              <Icon name="check" size={18} color="#059669" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Date Filter (Orders Tab) */}
            {activeTab === "Orders" && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Date Range</Text>
                <View style={styles.inputContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowCategoryDropdown(false);
                      setShowPriceDropdown(false);
                      setShowDateDropdown(!showDateDropdown);
                    }}
                  >
                    <Icon name="calendar" size={20} color="#6B7280" style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, !orderDateFilter && styles.placeholderText]}>
                      {orderDateFilter || 'Select Date Range'}
                    </Text>
                    <Icon name={showDateDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                  
                  {showDateDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {["All Time", "Today", "Last 7 Days", "Last 30 Days"].map((date, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setOrderDateFilter(date);
                              setShowDateDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{date}</Text>
                            {orderDateFilter === date && (
                              <Icon name="check" size={18} color="#059669" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Price Filter (Orders Tab) */}
            {activeTab === "Orders" && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                <View style={styles.inputContainer}>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowCategoryDropdown(false);
                      setShowDateDropdown(false);
                      setShowPriceDropdown(!showPriceDropdown);
                    }}
                  >
                    <Icon name="cash" size={20} color="#6B7280" style={styles.inputIcon} />
                    <Text style={[styles.dropdownText, !orderPriceFilter && styles.placeholderText]}>
                      {orderPriceFilter || 'Select Price Range'}
                    </Text>
                    <Icon name={showPriceDropdown ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                  
                  {showPriceDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {[
                          "All Prices",
                          "Under Nu.500",
                          "Nu.500 - Nu.1000",
                          "Nu.1000 - Nu.5000",
                          "Above Nu.5000"
                        ].map((price, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setOrderPriceFilter(price);
                              setShowPriceDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{price}</Text>
                            {orderPriceFilter === price && (
                              <Icon name="check" size={18} color="#059669" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.clearButton} onPress={onClear}>
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={onApply}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 48,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#D1D5DB',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#059669',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
