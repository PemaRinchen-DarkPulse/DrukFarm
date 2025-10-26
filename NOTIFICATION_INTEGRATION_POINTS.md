# Notification Integration Points - Technical Reference

## Document Purpose
This document provides detailed information about where and how to integrate push notifications throughout the DrukFarm application. It maps each notification trigger to specific files, functions, and database operations.

---

## Backend Integration Points

### Server Structure Overview

The DrukFarm backend is organized into several key directories:
- **models folder**: Contains MongoDB schema definitions for all data entities
- **routes folder**: Contains Express route handlers for all API endpoints
- **services folder**: Will contain reusable business logic including notifications
- **utils folder**: Contains utility functions for QR codes, images, and other helpers

---

## File-by-File Integration Guide

### User Model Extensions
**File Location:** server/models/User.js

**Current State:**
The User schema currently stores basic user information including CID, name, password (hashed), role, location, phone number, profile image, and gender. The schema has timestamps enabled for tracking creation and updates.

**Required Changes:**
Add two new fields to the UserSchema object. First, add an fcmToken field which will store the Firebase Cloud Messaging token as a string. This field should be optional (not required) and default to null since users might not have granted notification permissions yet. Second, add a notificationSettings field which will be an embedded object containing boolean flags for different notification categories.

The notificationSettings object should have four properties: orders (default true), payments (default true), products (default true), and marketing (default false). These allow users granular control over which notifications they receive.

**Implementation Location:**
These additions should be made within the UserSchema definition, after the existing gender field and before the schema options object that contains timestamps.

---

### New Notification Service Module
**File Location:** server/services/notificationService.js (new file to create)

**Purpose:**
This new service module will encapsulate all Firebase Cloud Messaging logic, keeping notification code separate from business logic. It provides a clean interface for other parts of the application to send notifications without knowing Firebase implementation details.

**Module Structure:**
The file should start by importing the firebase-admin package and the User model. Initialize the Firebase Admin SDK using credentials from environment variables including project ID, client email, and private key.

Create a NotificationService class with several methods. The sendToUser method takes a CID and notification object containing title, body, type, and optional metadata like order ID or product ID. It looks up the user's FCM token in the database and sends the notification through Firebase.

The sendToMultiple method accepts an array of CIDs and a notification object, sending the same notification to multiple users efficiently. This uses Firebase's batch sending capability.

Add a sendToRole method that sends notifications to all users with a specific role (farmers, transporters, etc). This queries the User collection for users with matching roles and active FCM tokens.

Include helper methods for token management like removeInvalidToken which deletes tokens that Firebase reports as invalid, and updateToken which updates a user's FCM token when they log in from a different device.

Implement error handling throughout to gracefully manage Firebase API failures, network issues, and invalid tokens without crashing the application.

---

### Orders Route Modifications
**File Location:** server/routes/orders.js

This is the most critical file for notifications as it handles the complete order lifecycle.

**Order Creation - Buy Now Endpoint:**
Location: Around line 153, in the POST /buy route handler
After the order is successfully created and saved to the database, add a notification call to inform the seller. Import the notification service at the top of the file. After the line where the order is saved (order.save()), call the notification service to send to the seller's CID (found in product.createdBy). The notification should have a title like "New Order Received" and body including the buyer's name, quantity, and product name. Pass the order ID in the notification data for deep linking.

**Order Creation - Cart Checkout Endpoint:**
Location: Around line 268, in the POST /cart-checkout route handler
Similar to buy now, after successfully creating orders from cart items, send notifications to all sellers involved. Since cart checkout can create multiple orders for different sellers, loop through the created orders and send a notification to each unique seller CID. Consolidate multiple product purchases from the same seller into one notification message.

**Order Confirmation Endpoint:**
Location: Around line 913, in the PATCH /:orderId/confirm route handler
After the order status is updated to confirmed and saved, send a notification to the buyer (order.userCid). The notification title should be "Order Confirmed" with body including the seller's name. If the user role is tshogpas and the status changes to shipped, send an additional notification about shipment.

**Order Shipped Endpoint:**
Location: Around line 858, in the PATCH /:orderId/shipped route handler
After marking the order as shipped, send notifications to two parties: the buyer (order.userCid) and the transporter if one is assigned (order.transporter.cid). The buyer notification should say their order has been shipped with expected delivery information. The transporter notification should include pickup details.

**Transporter Assignment Endpoint:**
Location: Around line 607, in the PATCH /:orderId/out-for-delivery route handler
After successfully assigning a transporter to an order, send notifications to three parties: the buyer informing them their order is out for delivery, the seller confirming the transporter has picked up the order, and the transporter with delivery instructions including the buyer's location and contact information.

**Order Delivered Endpoint:**
Location: Around line 709, in the PATCH /:orderId/delivered route handler
After marking the order as delivered, send notifications to both the buyer and seller. The buyer notification should include a prompt to leave a review. The seller notification confirms successful delivery and payment eligibility.

**Order Cancellation Endpoint:**
Location: Around line 831, in the PATCH /:orderId/cancel route handler
After cancelling the order and restocking the product, send a notification to the seller (order.product.sellerCid) informing them that the buyer has cancelled the order. Include the reason if provided.

**Stock Management:**
Location: After product stock updates throughout the file
When stock is decremented (tryDecrementStock function) and reaches a low threshold (less than 5 units), send a low stock notification to the product owner. This should be checked in the order creation flows.

---

### Payment Routes Modifications
**File Location:** server/routes/orders.js (payment endpoints are in same file)

**Payment Initialization:**
Location: Around line 1611, in the POST /:orderId/payment/initialize route handler
After successfully initializing the payment flow, send notifications to all parties involved in the payment chain. The notification should explain their role and when they will need to take action. Send to consumer, transporter (if exists), tshogpas (if exists), and farmer.

**Payment Step Update:**
Location: Around line 1665, in the PUT /:orderId/payment/:step route handler
When a payment step is marked as completed, determine the next party in the payment chain and send them a notification. For example, when consumer-to-transporter is completed, notify the transporter to confirm receipt. When marked as failed, notify all parties so they can coordinate resolution.

**Payment Confirmation by Transporter:**
Location: Around line 1893, in the POST /:orderId/payment/transporter-confirm route handler
After the transporter confirms payment receipt, notify the next party (either tshogpas or farmer depending on the flow) that they should expect payment.

**Payment Confirmation by Tshogpas:**
Location: Around line 1972, in the POST /:orderId/payment/tshogpa-confirm route handler
After tshogpas confirms payment, notify the farmer that payment is coming their way and they should prepare to confirm final receipt.

**Payment Confirmation by Farmer:**
Location: Around line 2198, in the POST /:orderId/payment/farmer-confirm route handler
After the farmer confirms final payment receipt, send completion notifications to all parties confirming the entire payment workflow is successfully completed.

---

### Products Route Modifications
**File Location:** server/routes/products.js

**Product Update Endpoint:**
Location: Around line 316, in the PUT /:id route handler
After updating a product's stock quantity, check if the product was previously out of stock (stockQuantity was 0 or very low) and is now back in stock. If so, query the Wishlist collection to find all users who have this product in their wishlist. Send a batch notification to these users informing them the product is available again.

**Stock Restock Monitoring:**
This requires checking the old stock quantity before the update. Fetch the product first, store the old stockQuantity, perform the update, then compare. If old quantity was 0 or less than 3, and new quantity is greater than 3, trigger wishlist notifications.

---

### Reviews Route Modifications
**File Location:** server/routes/reviews.js

**New Review Creation:**
Location: Around line 50-80, in the POST / route handler
After successfully creating a review, send a notification to the product seller. Query the Product collection to find the product's createdBy CID. Send a notification with the review rating (show stars visually like "4⭐") and a preview of the review title or comment. Include the product name so sellers can identify which product received feedback.

**Review Update:**
Location: Around line 275, in the PUT /:reviewId route handler
When a review is edited, optionally send a notification to the seller that the review has been updated. This helps sellers stay aware of changes that might affect their product perception.

---

### Wishlist Route Modifications
**File Location:** server/routes/wishlist.js

**Add to Wishlist:**
Location: In the POST /add or similar endpoint
Optionally track wishlist additions in a daily digest. Instead of sending immediate notifications (which could be spammy), store wishlist events and use a scheduled job to send sellers a daily summary of how many users added their products to wishlists.

---

### Users Route Extensions
**File Location:** server/routes/users.js

**New Endpoints Required:**

**Token Registration Endpoint:**
Create a new POST /:cid/fcm-token route handler. This endpoint receives the user's CID from the URL parameter and the FCM token from the request body. Validate that the CID matches the authenticated user. Use Mongoose's updateOne method to set the fcmToken field for the user. Return a success response. This endpoint is called when users log in and grant notification permissions.

**Token Deletion Endpoint:**
Create a new DELETE /:cid/fcm-token route handler. This endpoint removes the FCM token when users log out or revoke notification permissions. Use updateOne with the $unset operator to remove the fcmToken field. Return a success response.

**Notification Settings Update:**
Extend the existing PUT /:cid endpoint to handle notificationSettings updates. When the request body includes notificationSettings, validate the structure and update the user document. This allows users to control their notification preferences from the mobile app settings.

**User Registration:**
Location: In the POST /register route handler
After successfully creating a new user account, send a welcome notification if the user registered with an FCM token (unlikely on first registration but possible if they grant permissions during signup). Alternatively, send this notification when they first log in and grant permissions.

---

## Mobile Application Integration Points

### App Entry Point
**File Location:** mobile/App.js

**Current State:**
The App.js file initializes the application, sets up navigation, and configures the SafeAreaProvider. It imports all screens and components and defines the navigation stack structure.

**Required Changes:**
Near the top of the component, after the API initialization, add notification setup. Import the notification manager functions. Create a useEffect hook that runs once when the app loads. Inside this hook, call the notification registration function to request permissions and obtain the FCM token. Also call the function to set up notification listeners, passing the navigation reference so notifications can trigger navigation to specific screens.

Store the navigation reference using useRef so it's accessible in the notification listener callbacks. This allows deep linking to work correctly when users tap notifications.

---

### Authentication Flow
**File Location:** mobile/screens/Login.jsx

**Current State:**
The login screen handles user authentication by collecting CID and password, sending them to the backend, and storing the user information in local auth state.

**Required Changes:**
After successful login and before navigating to the main app, trigger notification permission request and token registration. Import the notification registration function. Call it after setting the current user in auth state. This is the ideal time to request permissions because the user is actively engaging with the app and understands they will receive updates.

Handle the async nature of token registration appropriately - don't block the login flow if token registration fails. Allow users to proceed even if they deny permissions, but show a friendly message explaining they can enable notifications later in settings.

---

### Notification Manager Module
**File Location:** mobile/lib/notifications.js (new file to create)

**Purpose:**
This new module centralizes all notification-related functionality for the mobile app, providing clean functions that other components can import and use.

**Module Structure:**

**Permission Request Function:**
Create a function called registerForPushNotifications that handles the entire notification setup process. First check if running on a physical device (notifications don't work in simulators). Request notification permissions using the Expo Notifications API. If permissions are granted, obtain the Expo push token which works with FCM. Configure Android notification channels with appropriate importance and styling. Send the token to the backend by calling the users FCM token registration endpoint. Return the token for potential local storage or logging.

**Notification Listener Setup Function:**
Create a function called setupNotificationListeners that accepts the navigation object. Set up two listeners: one for notifications received while the app is in the foreground, and one for notification responses (when users tap notifications). The foreground listener can display the notification or update an in-app notification center. The response listener handles deep linking by examining the notification's data payload and navigating to the appropriate screen.

For deep linking, check the notification type field in the data. If it's "order", navigate to MyOrders screen. If it's "product", navigate to ProductDetail screen with the product ID. If it's "payment", navigate to the appropriate payment screen based on user role.

Return a cleanup function that removes both listeners when the component unmounts, preventing memory leaks.

**Notification Handler Configuration:**
Configure how notifications are displayed when the app is in the foreground using setNotificationHandler. Set shouldShowAlert to true so users see notifications even when using the app. Enable sound and badge updates. This configuration applies globally to all notifications.

---

### Settings Screen Extension
**File Location:** mobile/components/setting/AccountSettings.jsx

**Current State:**
The account settings screen allows users to view and edit their profile information, manage addresses, and configure other account preferences.

**Required Changes:**
Add a new section for notification preferences. Create a list of toggleable options for each notification category: Order Updates, Payment Notifications, Product Alerts, and Marketing Messages. Each toggle should be connected to the user's notification settings stored in the backend.

When users toggle a preference, make an API call to update their notificationSettings in the backend. Use optimistic UI updates so the toggle responds immediately, then synchronize with the server. If the server update fails, revert the toggle and show an error message.

Include a master toggle at the top to enable or disable all notifications at once. When disabled, this should remove the FCM token from the backend while keeping the preference settings intact for when they re-enable.

Add a "Test Notification" button for debugging purposes that sends a test notification to verify the system is working correctly.

---

### Orders Screen Enhancement
**File Location:** mobile/screens/MyOrders.jsx

**Current State:**
The My Orders screen displays a list of the user's orders with status indicators and basic order information. Users can view order details and track their deliveries.

**Required Changes:**
When the screen loads (in useEffect), check if the navigation came from a notification by examining the route parameters. If a specific order ID is passed, automatically open that order's details or highlight it in the list.

Add visual indicators for orders that have unread updates. This could be a small dot or badge on orders that have status changes the user hasn't seen yet. Track "last viewed" timestamps for each order and compare with the last update timestamp.

Optionally add a "Notification History" button in the header that opens an in-app notification center showing all past notifications related to orders.

---

### Notification Center Component
**File Location:** mobile/components/NotificationCenter.jsx (new file to create)

**Purpose:**
This component provides an in-app notification inbox where users can review past notifications they may have missed or dismissed.

**Component Structure:**
Create a screen component with a FlatList displaying notification items. Each notification should show an icon based on type, title, body text, timestamp, and read/unread status. Store notifications in local state using AsyncStorage for persistence.

When users open the notification center, mark all notifications as read. Provide swipe-to-delete functionality for individual notifications. Include a "Clear All" button to remove old notifications.

Listen for incoming notifications using an event listener and add them to the local notification history. This creates a permanent record even if the system notification is dismissed.

Tapping a notification in the center should trigger the same deep linking behavior as tapping a system notification, navigating to the relevant screen.

---

### Deep Linking Configuration
**File Location:** mobile/App.js and relevant screen components

**Implementation:**
Deep linking requires matching notification data to navigation actions. In the navigation configuration, ensure all target screens are properly named and can accept parameters.

For the MyOrders screen, ensure it can accept an orderId parameter and automatically scroll to or highlight that specific order. For ProductDetail screen, ensure it accepts a productId parameter. For payment-related screens, ensure they can accept orderId and display payment status.

Test deep linking thoroughly by sending notifications with various data payloads and verifying the app opens to the correct screen with correct data displayed.

---

## Scheduled Tasks and Background Jobs

### Cron Job Setup
**File Location:** server/utils/cronJobs.js (new file to create)

**Purpose:**
This file sets up scheduled tasks that run periodically to send batch notifications, clean up data, and perform maintenance.

**Job Definitions:**

**Daily Seller Summary:**
Schedule a job to run every morning at 8 AM local time. Query the Orders collection for orders created in the past 24 hours, grouped by seller CID. For each seller with pending orders, send a single notification summarizing how many orders they need to process. This prevents notification fatigue while keeping sellers informed.

**Wishlist Stock Alerts:**
Schedule a job to run every few hours checking for products that were recently restocked. Query products with recent stock quantity increases, then find wishlists containing those products. Send batch notifications to all interested users about the restock.

**Token Cleanup:**
Schedule a weekly job to clean up FCM tokens that haven't been used in over 30 days. This keeps the database lean and removes tokens from inactive users or uninstalled apps.

**Engagement Reminders:**
Schedule a job to identify users who haven't opened the app in over a week but have active orders or products in their wishlist. Send gentle reminder notifications encouraging them to check their orders or complete their purchases.

---

## Database Query Patterns

### Finding Users for Notifications

**Single User by CID:**
Use User.findOne with the cid field to look up a specific user when sending individual notifications. Always check if the user exists and has an fcmToken before attempting to send.

**Multiple Users by CIDs:**
Use User.find with the $in operator when sending to multiple specific users. For example, when notifying all parties in an order (buyer, seller, transporter).

**Users by Role:**
Use User.find with role filter when broadcasting to a user category. For example, notifying all transporters about available delivery jobs.

**Wishlist Users for Product:**
Use Wishlist.find with a filter on items.productId to find all users who have a specific product in their wishlist. Extract the userCid from each wishlist document, then query User collection for FCM tokens.

---

## Error Handling Strategies

### Notification Failures
When a notification fails to send, log the error with context (user CID, notification type, error message). Don't throw exceptions that would break the main request flow - notifications should fail gracefully.

If Firebase returns an invalid token error, automatically remove that token from the user's record to prevent future attempts.

For temporary network errors, implement retry logic with exponential backoff. Attempt up to 3 times before giving up.

### Permission Denials
Handle cases where users deny notification permissions gracefully. Store a preference indicating permissions were denied so the app doesn't repeatedly prompt. Provide UI in settings to re-enable with clear instructions on how to grant permissions at the system level.

### Rate Limiting
Implement application-level rate limiting to prevent notification spam. Track how many notifications each user has received in the past hour. If the count exceeds a threshold (like 10), queue additional notifications for later or batch them together.

---

## Testing Integration Points

### Backend Testing

**Unit Tests for Notification Service:**
Test the notification service methods in isolation using mocked Firebase Admin SDK. Verify that correct messages are constructed with proper payload structure. Test token validation logic and error handling paths.

**Integration Tests for Routes:**
Test complete request flows that trigger notifications. For example, test the order creation endpoint and verify the notification service was called with correct parameters. Use spies or mocks to intercept notification calls without actually sending to Firebase.

### Mobile Testing

**Permission Flow Testing:**
Test the notification permission request flow on both iOS and Android. Verify graceful handling when users deny permissions. Test re-requesting permissions through settings.

**Deep Linking Testing:**
Send test notifications with various data payloads and verify navigation works correctly. Test scenarios when the app is in foreground, background, and completely closed. Verify the correct screen opens with correct data.

**Notification Display Testing:**
Test how notifications appear on different devices and OS versions. Verify custom sounds, icons, and colors display correctly. Test notification grouping when multiple arrive simultaneously.

---

## Deployment Checklist

### Before Deploying

**Backend:**
- Firebase Admin SDK credentials added to environment variables
- Notification service module created and tested
- All route handlers updated with notification calls
- Error handling and logging in place
- Rate limiting configured

**Mobile:**
- expo-notifications package installed and configured
- Firebase configuration files added (google-services.json, GoogleService-Info.plist)
- Notification permissions handled properly
- Deep linking tested and working
- Settings UI for preferences completed

**Testing:**
- All notification types tested end-to-end
- Permission flows tested on real devices
- Error scenarios tested and handled
- Load testing completed for high-volume scenarios

### During Deployment

**Gradual Rollout:**
Deploy backend changes first, but don't activate notifications immediately. Deploy mobile app update to a small percentage of users first (10%). Monitor for crashes or issues. Gradually increase rollout as confidence grows.

**Monitoring:**
Watch error logs for any notification-related issues. Monitor Firebase console for delivery metrics. Track user feedback and support tickets related to notifications.

### After Deployment

**Verification:**
Send test notifications to verify the production system works. Check that all notification types are being triggered appropriately. Verify deep linking works in production environment.

**Optimization:**
Monitor notification delivery rates and optimize as needed. Adjust notification timing based on user engagement patterns. Refine notification content based on user feedback.

---

## Summary

This document has provided comprehensive guidance on where and how to integrate push notifications throughout the DrukFarm application. Each integration point has been identified with specific file locations, existing code context, and detailed instructions for implementation. Following this guide ensures consistent, complete integration of the notification system across all features.
