import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function SuperAdminDashboard({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.getSuperAdminStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      Alert.alert('Error', 'Failed to load statistics');
    }
  }, []);

  // Fetch users list
  const fetchUsers = useCallback(async (refresh = false) => {
    try {
      const currentPage = refresh ? 1 : page;
      const params = {
        page: currentPage,
        limit: 20,
      };
      
      if (filterRole !== 'all') {
        params.role = filterRole;
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await api.getSuperAdminUsers(params);
      
      if (refresh) {
        setUsers(response.users || []);
        setPage(1);
      } else {
        setUsers(prev => [...prev, ...(response.users || [])]);
      }
      
      setHasMore(response.pagination?.page < response.pagination?.pages);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  }, [page, filterRole, searchQuery]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers(true)]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchUsers(true)]);
    setRefreshing(false);
  }, [fetchStats, fetchUsers]);

  // Load more users
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchUsers(false);
    }
  }, [loading, hasMore, fetchUsers]);

  // Search handler
  const handleSearch = useCallback(() => {
    setUsers([]);
    setPage(1);
    fetchUsers(true);
  }, [fetchUsers]);

  // Filter change handler
  const handleFilterChange = useCallback((role) => {
    setFilterRole(role);
    setUsers([]);
    setPage(1);
    setSearchQuery('');
  }, []);

  // Re-fetch when filter changes
  useEffect(() => {
    if (!loading) {
      fetchUsers(true);
    }
  }, [filterRole]);

  // Stats Card Component
  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.statIcon}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  // User Card Component
  const UserCard = ({ user }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Icon name="account" size={32} color="#059669" />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userPhone}>{user.phoneNumber}</Text>
          <Text style={styles.userCid}>CID: {user.cid}</Text>
        </View>
        <View style={[styles.roleBadge, styles[`role_${user.role}`]]}>
          <Text style={styles.roleText}>{user.role}</Text>
        </View>
      </View>
      
      <View style={styles.userDetails}>
        {user.dzongkhag && (
          <View style={styles.detailItem}>
            <Icon name="map-marker" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{user.dzongkhag}</Text>
          </View>
        )}
        {user.location && (
          <View style={styles.detailItem}>
            <Icon name="home" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{user.location}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Icon name="clock" size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#059669', '#047857']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Super Admin</Text>
            <Text style={styles.headerSubtitle}>System Management Dashboard</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh}>
            <Icon name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Icon 
            name="view-dashboard" 
            size={20} 
            color={activeTab === 'overview' ? '#059669' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Icon 
            name="account-group" 
            size={20} 
            color={activeTab === 'users' ? '#059669' : '#6B7280'} 
          />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Users
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#059669']} />
        }
      >
        {activeTab === 'overview' && (
          <View style={styles.overviewContent}>
            {/* Statistics Cards */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Users"
                value={stats?.totalUsers || 0}
                icon="account-multiple"
                color="#059669"
                onPress={() => setActiveTab('users')}
              />
              <StatCard
                title="Vegetable Vendors"
                value={stats?.usersByRole?.vegetable_vendor || 0}
                icon="cart"
                color="#3B82F6"
                onPress={() => {
                  setFilterRole('vegetable_vendor');
                  setActiveTab('users');
                }}
              />
              <StatCard
                title="Farmers"
                value={stats?.usersByRole?.farmer || 0}
                icon="barn"
                color="#F59E0B"
                onPress={() => {
                  setFilterRole('farmer');
                  setActiveTab('users');
                }}
              />
              <StatCard
                title="Transporters"
                value={stats?.usersByRole?.transporter || 0}
                icon="truck"
                color="#8B5CF6"
                onPress={() => {
                  setFilterRole('transporter');
                  setActiveTab('users');
                }}
              />
              <StatCard
                title="Super Admins"
                value={stats?.usersByRole?.superadmin || 0}
                icon="shield-crown"
                color="#EF4444"
                onPress={() => {
                  setFilterRole('superadmin');
                  setActiveTab('users');
                }}
              />
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => setActiveTab('users')}
                >
                  <Icon name="account-plus" size={32} color="#059669" />
                  <Text style={styles.actionText}>Manage Users</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Products')}
                >
                  <Icon name="package-variant" size={32} color="#3B82F6" />
                  <Text style={styles.actionText}>View Products</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={() => navigation.navigate('Categories')}
                >
                  <Icon name="tag-multiple" size={32} color="#F59E0B" />
                  <Text style={styles.actionText}>Categories</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionCard}
                  onPress={handleRefresh}
                >
                  <Icon name="refresh" size={32} color="#8B5CF6" />
                  <Text style={styles.actionText}>Refresh Data</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* System Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>System Information</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Icon name="account-circle" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Logged in as:</Text>
                  <Text style={styles.infoValue}>{user?.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="shield-check" size={20} color="#059669" />
                  <Text style={styles.infoLabel}>Role:</Text>
                  <Text style={styles.infoValue}>Super Administrator</Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="phone" size={20} color="#6B7280" />
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{user?.phoneNumber}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'users' && (
          <View style={styles.usersContent}>
            {/* Search and Filter */}
            <View style={styles.searchSection}>
              <View style={styles.searchBar}>
                <Icon name="magnify" size={20} color="#6B7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, CID, or phone..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => {
                    setSearchQuery('');
                    handleSearch();
                  }}>
                    <Icon name="close-circle" size={20} color="#6B7280" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Role Filter */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
              >
                {['all', 'vegetable_vendor', 'farmer', 'transporter', 'superadmin'].map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.filterChip,
                      filterRole === role && styles.filterChipActive
                    ]}
                    onPress={() => handleFilterChange(role)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filterRole === role && styles.filterChipTextActive
                    ]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Users List */}
            <FlatList
              data={users}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <UserCard user={item} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Icon name="account-off" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading && !refreshing ? (
                  <ActivityIndicator size="small" color="#059669" style={{ marginVertical: 16 }} />
                ) : null
              }
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0F2F1',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#059669',
  },
  content: {
    flex: 1,
  },
  overviewContent: {
    padding: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  usersContent: {
    padding: 16,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#059669',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userCid: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  role_vegetable_vendor: {
    backgroundColor: '#DBEAFE',
  },
  role_farmer: {
    backgroundColor: '#FEF3C7',
  },
  role_transporter: {
    backgroundColor: '#EDE9FE',
  },
  role_superadmin: {
    backgroundColor: '#FEE2E2',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  userDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
