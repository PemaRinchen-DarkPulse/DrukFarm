import { Alert } from 'react-native';
import { downloadOrderImage } from '../lib/api';
import { getCurrentCid } from '../lib/auth';

export const testDownloadAPI = async (orderId) => {
  try {
    console.log('=== Testing API call for order:', orderId, '===');
    
    const cid = getCurrentCid();
    console.log('User CID:', cid);
    
    if (!cid) {
      Alert.alert('Error', 'No user CID found');
      return;
    }
    
    console.log('Making API call...');
    const response = await downloadOrderImage(orderId, cid);
    
    console.log('=== API Response Analysis ===');
    console.log('Response type:', typeof response);
    console.log('Response keys:', Object.keys(response || {}));
    console.log('Success:', response?.success);
    console.log('Has data:', !!response?.data);
    console.log('Data type:', typeof response?.data);
    console.log('Data length:', response?.data?.length);
    console.log('Filename:', response?.filename);
    
    if (response?.data) {
      console.log('Data preview (first 50 chars):', response.data.substring(0, 50));
      console.log('Data preview (last 20 chars):', response.data.substring(response.data.length - 20));
    }
    
    // Show results in alert
    const message = `
API Test Results:
Success: ${response?.success}
Has Data: ${!!response?.data}
Data Type: ${typeof response?.data}
Data Length: ${response?.data?.length || 0}
Filename: ${response?.filename || 'N/A'}

${response?.data ? 'Data looks valid!' : 'No data received!'}
    `;
    
    Alert.alert('API Test Results', message.trim());
    
  } catch (error) {
    console.error('=== API Test Error ===');
    console.error('Error:', error);
    console.error('Status:', error.status);
    console.error('Body:', error.body);
    
    Alert.alert(
      'API Test Failed',
      `Error: ${error.message}\nStatus: ${error.status}\nBody: ${JSON.stringify(error.body)}`
    );
  }
};