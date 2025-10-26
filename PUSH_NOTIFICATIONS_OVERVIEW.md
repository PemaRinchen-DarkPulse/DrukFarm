# Push Notifications Implementation Overview

## Document Purpose
This document provides a high-level overview of the push notifications system for DrukFarm, describing the architecture, integration points, and implementation strategy without diving into code details.

---

## Current System Analysis

### Mobile Application Architecture
The DrukFarm mobile app is built using React Native with Expo SDK version 54. It uses React Navigation for screen management and has a custom authentication system based on CID (Citizen ID numbers). The app communicates with the backend through REST API calls using a custom fetch-based API client located in the lib folder.

### Backend Architecture
The server runs on Node.js with Express framework and uses MongoDB as the database. Authentication is handled through a simple CID-based system where users pass their CID in headers or request body. The backend is deployed on Vercel as a serverless application but also supports local development. Currently, there is no real-time communication infrastructure like WebSockets or Socket.io.

### User Roles Identified
The system has multiple user roles including consumers (buyers), farmers (sellers), transporters (delivery personnel), tshogpas (cooperative managers), and restaurants. Each role has different notification needs based on their interactions with orders, payments, and products.

---

## Technology Selection

### Recommended Solution: Firebase Cloud Messaging (FCM)

**Why Firebase Cloud Messaging:**
- Native integration with Expo through the expo-notifications package
- Completely free with unlimited notifications
- Works across iOS, Android, and web platforms
- Handles both background and foreground notifications
- Supports rich data payloads for deep linking into specific app screens
- Allows topic-based subscriptions for broadcasting to user groups
- Has built-in analytics for tracking delivery and engagement

**Alternative Considered:**
OneSignal was evaluated as an alternative. While it offers simpler initial setup, Firebase provides better flexibility, deeper integration with Expo, and is more future-proof for additional features like analytics and remote config.

---

## Notification Trigger Points

### Order Lifecycle Notifications

**Order Placed:**
When a customer completes a purchase through the buy now or cart checkout endpoints, the seller (farmer or tshogpas) should receive an immediate notification informing them of the new order. This notification should include the product name, quantity, and buyer information.

**Order Confirmed:**
When the seller accepts an order using the confirm endpoint, the buyer should receive a notification that their order has been accepted and will be processed. This reassures the customer and sets expectations.

**Order Shipped:**
When the seller marks an order as shipped, both the buyer and any assigned transporter should be notified. This triggers the next phase of delivery and lets the customer know their order is on the way.

**Transporter Assignment:**
When a transporter is assigned to deliver an order (out-for-delivery endpoint), the buyer, seller, and transporter should all receive notifications with relevant details about the pickup and delivery locations.

**Order Delivered:**
Upon successful delivery, both the buyer and seller should receive confirmation notifications. This also triggers the ability for the buyer to leave a review.

**Order Cancelled:**
If a buyer cancels their order, the seller should be notified immediately so they can restock the product and adjust their fulfillment plans.

**Low Stock Alert:**
When a product's stock quantity drops below a defined threshold (for example, 5 units), the seller should receive a notification to restock before the product becomes unavailable.

### Payment Workflow Notifications

The system has a complex three-step payment flow involving consumers, transporters, tshogpas, and farmers.

**Payment Initialized:**
When the payment workflow begins for an order, all involved parties should receive a notification explaining their role in the payment chain and what actions they need to take.

**Payment Step Completed:**
As each payment step is completed (consumer to transporter, transporter to tshogpas, tshogpas to farmer), the next party in the chain should receive a notification prompting them to confirm receipt and continue the process.

**Payment Failed:**
If any payment step fails, all parties involved should be notified so they can coordinate to resolve the issue or cancel the transaction appropriately.

**Payment Workflow Completed:**
When the final payment confirmation is received, all parties should get a completion notification confirming the transaction is fully settled.

### Product and Engagement Notifications

**Product Wishlisted:**
Sellers can optionally receive batched daily notifications when users add their products to wishlists. This helps sellers understand demand and interest.

**Product Back in Stock:**
When a previously out-of-stock product is restocked, all users who have that product in their wishlist should receive a notification encouraging them to complete their purchase.

**New Review Received:**
When a buyer leaves a review for a product, the seller should be notified along with the rating and review summary so they can respond or improve their offerings.

**Review Response (Future):**
Once implemented, when sellers respond to reviews, the original reviewer should receive a notification bringing them back to continue the conversation.

### Account and Security Notifications

**Welcome Notification:**
New users should receive a welcome notification after registration, guiding them to explore products and set up their profile.

**Profile Updated:**
After significant profile changes, users should receive a confirmation notification for security and peace of mind.

**Password Changed (Future):**
When implemented, password changes should trigger security notifications so users can detect unauthorized access.

---

## System Architecture

### Backend Components

**Notification Service Module:**
A dedicated notification service will be created as a separate module in the server services folder. This service will encapsulate all Firebase Admin SDK interactions, including sending single notifications, batch notifications, and handling token management. It will provide clean, reusable methods that other parts of the application can call.

**User Model Extensions:**
The User model in MongoDB will be extended to store FCM tokens for each user's device. Additionally, it will store notification preferences allowing users to control which types of notifications they want to receive (orders, payments, products, marketing).

**Token Management Endpoints:**
New API endpoints will be created in the users route to handle FCM token registration when users log in, token updates when devices change, and token deletion when users log out.

**Integration Points:**
Notification calls will be added at strategic points throughout the orders, products, and payment routes. These will be non-blocking asynchronous calls to avoid slowing down the main request-response cycle.

### Mobile Application Components

**Notification Manager Module:**
A new notifications module will be created in the mobile app's lib folder to handle all notification-related functionality including permission requests, token registration, foreground notification handling, and background notification handling.

**Permission Handling:**
The app will request notification permissions at the appropriate time (typically after login) with clear explanations of the benefits. It will gracefully handle permission denials and allow users to enable notifications later in settings.

**Deep Linking System:**
When users tap on notifications, the app will navigate them to the appropriate screen based on the notification type. For example, order notifications will open the My Orders screen with the specific order highlighted, while product notifications will open the product detail page.

**In-App Notification Center:**
A notification history screen will be added where users can review past notifications they may have missed, similar to a notification inbox.

**Settings Integration:**
The existing account settings screen will be extended to include notification preferences, allowing users to toggle different notification categories on or off.

---

## Implementation Phases

### Phase One: Foundation (Week 1)

**Backend Setup:**
Install Firebase Admin SDK and necessary dependencies on the server. Set up Firebase project in the Firebase console and obtain service account credentials. Create the notification service module with basic send functionality. Update the User model schema to include FCM token and preference fields. Create API endpoints for token registration and management.

**Mobile Setup:**
Install expo-notifications and related Expo packages. Configure the app.json file with notification settings for iOS and Android. Download and add Firebase configuration files (google-services.json for Android, GoogleService-Info.plist for iOS). Create the notification manager module with permission requesting and token registration logic. Integrate notification setup into the main App component.

**Testing:**
Send test notifications manually from Firebase console to verify end-to-end connectivity. Test permission flows on both iOS and Android devices. Verify token registration is working by checking the database.

### Phase Two: Core Integration (Week 2)

**Order Notifications:**
Add notification calls to all order lifecycle endpoints including order creation, confirmation, shipping, delivery, and cancellation. Include relevant order details and user information in each notification payload. Implement deep linking so tapping notifications opens the correct order detail screen.

**Payment Notifications:**
Integrate notifications into the payment workflow endpoints, ensuring each party receives timely updates as payments progress through the system. Include payment amounts and party names for clarity.

**Testing:**
Perform end-to-end order flows while monitoring notification delivery. Test with multiple user roles to ensure each receives appropriate notifications. Verify deep linking navigates to correct screens with correct data.

### Phase Three: Advanced Features (Week 3)

**Batch and Scheduled Notifications:**
Set up cron jobs for daily summary notifications sent to sellers about pending orders. Implement wishlist stock alerts checking for restocked products and notifying interested users. Create weekly engagement notifications for users who haven't visited recently.

**User Preference Management:**
Build the notification settings UI in the mobile app allowing users to control notification categories. Connect the UI to the backend API to save preferences. Implement preference checking in the notification service to respect user choices.

**Notification History:**
Create an in-app notification center that stores received notifications locally for user review. Add unread indicators and mark-as-read functionality. Implement notification archiving for older items.

### Phase Four: Polish and Optimization (Week 4)

**Performance Optimization:**
Implement connection pooling for Firebase Admin SDK to handle high notification volumes efficiently. Add caching for frequently accessed user tokens. Optimize database queries for batch notification scenarios.

**Error Handling:**
Implement robust error handling for failed notifications with automatic retry logic. Set up logging for notification failures to monitor system health. Create alerts for critical notification failures affecting many users.

**Analytics Integration:**
Add custom analytics events to track notification delivery rates, open rates, and user engagement. Create dashboards to visualize notification performance over time.

---

## Security and Privacy Considerations

### Token Security
FCM tokens are sensitive and should be treated like passwords. Store them encrypted in the database. Implement automatic token invalidation after a period of inactivity. Clean up stale tokens regularly to maintain database efficiency.

### Permission Validation
Before sending any notification, validate that the requesting user has permission to trigger that notification. For example, only order participants should receive order notifications. This prevents notification spam and unauthorized access to order information.

### Content Sanitization
All user-generated content included in notifications (names, product titles, messages) must be sanitized to prevent injection attacks or inappropriate content delivery.

### Rate Limiting
Implement rate limiting to prevent abuse, limiting notifications to a reasonable number per user per time period (for example, 10 per minute). This protects users from notification spam and reduces server load.

### Opt-Out Compliance
Respect user notification preferences at all times. Provide clear opt-out mechanisms for each notification category. Never send marketing notifications to users who have opted out.

---

## Testing Strategy

### Unit Testing
Test the notification service in isolation with mocked Firebase Admin SDK. Verify token validation logic works correctly. Test preference checking ensures disabled notifications are not sent. Validate notification payload construction for all event types.

### Integration Testing
Test complete user flows from event trigger to notification delivery. Verify notifications reach the correct users with correct content. Test scenarios with multiple simultaneous notifications. Ensure database transactions remain consistent even if notifications fail.

### Device Testing
Test on physical iOS and Android devices, not just emulators. Verify background notification delivery when app is closed. Test foreground notification display and interaction. Verify notification sounds, vibrations, and visual styling. Test deep linking from various notification types.

### Load Testing
Simulate high-volume scenarios like a flash sale generating hundreds of orders. Test batch notification performance with thousands of recipients. Monitor server resource usage under notification load. Verify Firebase quota limits are not exceeded.

---

## Deployment Process

### Firebase Project Setup
Create a new Firebase project in the Firebase Console with a name matching your app. Enable Cloud Messaging API in the Firebase project settings. Generate and download service account credentials for the backend. Download platform-specific configuration files for mobile app.

### Environment Configuration
Add Firebase credentials to server environment variables using secure methods (never commit to version control). Configure different Firebase projects for development, staging, and production environments. Set up proper access controls and API key restrictions in Firebase Console.

### Mobile App Building
Build development versions first and test notification delivery thoroughly. Create production builds with proper release signing for both iOS and Android. Submit iOS app for Apple Push Notification service approval. Test production builds before releasing to users.

### Gradual Rollout Strategy
Release to a small percentage of users initially (10%) to catch any issues in production. Monitor crash reports, delivery rates, and user feedback closely. Gradually increase rollout percentage as confidence grows (50%, then 100%). Maintain ability to rollback if critical issues are discovered.

---

## Monitoring and Maintenance

### Key Performance Indicators
Track notification delivery rate (percentage successfully sent to FCM). Monitor open rate (percentage of delivered notifications that users tap). Measure conversion rate (notifications leading to desired actions). Watch opt-out rate to gauge user satisfaction with notifications.

### Health Monitoring
Set up alerts for sudden drops in delivery rate indicating system issues. Monitor Firebase quota usage to prevent service disruptions. Track error logs for patterns indicating bugs or integration problems. Monitor database growth from stored tokens and notification history.

### Regular Maintenance Tasks
Monthly: Review Firebase usage and costs. Clean up expired or invalid FCM tokens. Analyze notification performance metrics and adjust strategies. Update notification templates based on user feedback.

Quarterly: Conduct security audits of notification system. Review and optimize notification frequency to prevent fatigue. A/B test notification wording and timing for better engagement. Update documentation for any system changes.

---

## Cost Analysis

Firebase Cloud Messaging is completely free with unlimited notifications, making it ideal for this project. The only costs are minimal increases in MongoDB storage for FCM tokens (approximately 2KB per user) and potential increases in server compute time for notification processing. For a user base of thousands, total additional monthly costs should remain under one dollar.

---

## Success Metrics

The notification system will be considered successful when:
- At least 95% of triggered notifications are successfully delivered to user devices
- Notification latency from trigger event to device delivery is under 2 seconds
- Zero crashes or errors are attributed to notification handling
- At least 80% of users keep notifications enabled after one month
- Opt-out rate remains below 5% in the first month after launch
- Order completion time improves by at least 15% due to faster communication
- Customer satisfaction scores improve based on survey feedback

---

## Future Enhancements

### Rich Notifications
Add images to notifications showing product photos or order details. Include action buttons directly in notifications (Accept Order, View Details). Support expandable notifications with more detailed information.

### Notification Scheduling
Allow sellers to schedule promotional notifications for optimal times. Implement smart timing based on user activity patterns. Support recurring notifications for subscription-like features.

### Multi-Language Support
Translate notification content based on user language preferences. Support for Dzongkha (Bhutan's national language) and English. Ensure proper text rendering for all supported languages.

### Advanced Analytics
Track user journeys after notification interactions. Measure revenue directly attributed to notifications. Identify optimal notification frequency per user segment. Create predictive models for notification effectiveness.

---

## Conclusion

This push notifications system will significantly enhance user engagement and operational efficiency for DrukFarm. By providing timely updates about orders, payments, and products, users will have a more connected and responsive experience. The phased implementation approach ensures stability while the modular architecture allows for future enhancements without major refactoring.

The combination of Firebase Cloud Messaging and Expo makes this implementation straightforward and cost-effective while maintaining enterprise-grade reliability and scalability. With proper testing and gradual rollout, this feature can be launched with confidence and minimal risk to existing functionality.
