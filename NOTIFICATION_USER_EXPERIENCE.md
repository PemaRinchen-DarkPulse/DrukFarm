# Push Notifications User Experience Design

## Document Purpose
This document describes the user-facing aspects of the push notifications system for DrukFarm. It covers the notification messages users will see, when they'll receive them, how to control their preferences, and best practices for creating a positive notification experience.

---

## Notification Design Principles

### Be Timely
Notifications should arrive at the moment they're most relevant. Order status changes should notify users immediately, not hours later. Payment confirmations should arrive as soon as transactions complete. Timing is critical for maintaining trust and utility.

### Be Specific
Generic messages like "You have an update" are frustrating. Every notification should clearly state what happened, who was involved, and what action (if any) is required. Include relevant details like order numbers, product names, and seller names.

### Be Actionable
When possible, notifications should enable users to take immediate action. Tapping a notification should take users directly to the relevant screen where they can respond, review details, or complete tasks.

### Respect User Attention
Notifications interrupt users, so each one must justify that interruption. Avoid sending redundant notifications about the same event. Group related updates when appropriate. Allow users granular control over what they receive.

### Maintain Consistency
Use consistent language, tone, and structure across all notification types. Users should be able to quickly scan and understand notifications without confusion about format or meaning.

---

## Notification Categories and Messages

### Order Status Notifications

**Order Placed Confirmation (Buyer):**
Title: Order Placed Successfully
Message: Your order for [quantity] [product name] has been placed. The seller will confirm shortly.
When: Immediately after order creation
Action: Tapping opens My Orders screen showing the new order

**New Order Alert (Seller):**
Title: New Order Received
Message: [Buyer name] ordered [quantity] [product name] for Nu. [total price]
When: Immediately when buyer places order
Action: Tapping opens Dashboard showing pending orders

**Order Confirmed (Buyer):**
Title: Order Confirmed
Message: [Seller name] confirmed your order for [product name]. It will be shipped soon.
When: When seller confirms the order
Action: Tapping opens order details showing updated status

**Order Shipped (Buyer):**
Title: Order Shipped
Message: Your order for [product name] has been shipped and is on its way.
When: When seller marks order as shipped
Action: Tapping opens order tracking details

**Order Shipped Alert (Seller):**
Title: Order Shipped Successfully
Message: Your order for [buyer name] has been marked as shipped.
When: After seller marks order as shipped
Action: Tapping opens order details with shipping status

**Transporter Assigned (Buyer):**
Title: Out for Delivery
Message: [Transporter name] is delivering your order. Contact: [phone number]
When: When transporter is assigned to deliver order
Action: Tapping opens order details with transporter information

**Transporter Assigned Alert (Seller):**
Title: Order Picked Up
Message: [Transporter name] picked up your order for delivery to [buyer name].
When: When transporter accepts delivery
Action: Tapping opens order details showing delivery status

**Delivery Instructions (Transporter):**
Title: New Delivery Assignment
Message: Deliver [product name] to [buyer name] at [location]. Contact: [phone number]
When: When assigned to deliver an order
Action: Tapping opens delivery details with map and contact info

**Order Delivered (Buyer):**
Title: Order Delivered
Message: Your order for [product name] has been delivered. How was your experience?
When: When transporter marks order as delivered
Action: Tapping opens order details with option to leave review

**Order Delivered Confirmation (Seller):**
Title: Order Delivered Successfully
Message: Your order to [buyer name] has been delivered. Payment processing will begin.
When: When order is marked as delivered
Action: Tapping opens order details showing completion

**Order Cancelled (Seller):**
Title: Order Cancelled
Message: [Buyer name] cancelled the order for [product name].
When: When buyer cancels order
Action: Tapping opens order details showing cancellation

**Order Cancelled Confirmation (Buyer):**
Title: Order Cancelled
Message: Your order for [product name] has been cancelled. Any payment will be refunded.
When: After buyer cancels order
Action: Tapping opens My Orders screen

---

### Payment Notifications

**Payment Workflow Started:**
Title: Payment Processing Started
Message: Payment workflow initiated for order [order number]. You'll be notified when action is needed.
When: When payment workflow is initialized
Action: Tapping opens payment status screen

**Payment Received (Transporter from Consumer):**
Title: Payment Received
Message: Nu. [amount] received from [consumer name] for order [order number]. Please confirm receipt.
When: When consumer payment is recorded
Action: Tapping opens payment confirmation screen

**Payment Confirmation Needed (Tshogpas from Transporter):**
Title: Payment Incoming
Message: [Transporter name] is sending Nu. [amount] for order [order number]. Confirm when received.
When: After transporter confirms their payment receipt
Action: Tapping opens payment confirmation screen

**Payment Confirmation Needed (Farmer from Tshogpas):**
Title: Payment Incoming
Message: [Tshogpas name] is sending Nu. [amount] for order [order number]. Confirm when received.
When: After tshogpas confirms their payment receipt
Action: Tapping opens payment confirmation screen

**Payment Workflow Complete (All Parties):**
Title: Payment Complete
Message: All payments for order [order number] have been successfully processed.
When: After farmer confirms final payment receipt
Action: Tapping opens order details showing payment completion

**Payment Failed:**
Title: Payment Issue
Message: Payment failed at [step] for order [order number]. Please contact support.
When: If any payment step fails
Action: Tapping opens support screen with order details

---

### Product Notifications

**Low Stock Alert (Seller):**
Title: Low Stock Alert
Message: [Product name] has only [quantity] units left. Consider restocking soon.
When: When product stock falls below threshold (5 units)
Action: Tapping opens product edit screen

**Product Back in Stock (Wishlist Users):**
Title: Back in Stock
Message: [Product name] is now available again! Limited stock, order now.
When: When wishlisted product is restocked
Action: Tapping opens product detail page

**New Review Received (Seller):**
Title: New Review
Message: [Reviewer name] left a [rating] star review for [product name].
When: When buyer submits product review
Action: Tapping opens review details

**Review Response (Reviewer):**
Title: Seller Responded
Message: [Seller name] responded to your review of [product name].
When: When seller responds to review (future feature)
Action: Tapping opens review conversation

---

### Engagement Notifications

**Welcome Message (New Users):**
Title: Welcome to DrukFarm!
Message: Discover fresh, local products from Bhutanese farmers. Start exploring now.
When: After successful registration or first login with notifications enabled
Action: Tapping opens home screen with featured products

**Daily Summary (Sellers with Pending Orders):**
Title: Daily Order Summary
Message: You have [count] pending orders waiting for confirmation.
When: Daily at 8:00 AM if seller has pending orders
Action: Tapping opens Dashboard showing pending orders

**Wishlist Reminder (Users with Items):**
Title: Don't Miss Out
Message: You have [count] products in your wishlist. Some may sell out soon!
When: Weekly if user hasn't opened app in 7 days and has wishlist items
Action: Tapping opens Wishlist screen

**Order Followup (Delivered Orders):**
Title: How Was Your Order?
Message: Share your experience with [product name] to help other buyers.
When: 2 days after order delivery if no review submitted
Action: Tapping opens review submission screen

---

## Notification Timing Strategy

### Immediate Notifications
These require instant delivery as they represent critical status changes or time-sensitive information:
- Order placed (both buyer and seller)
- Order confirmed by seller
- Order shipped
- Transporter assigned
- Order delivered
- Payment received requiring confirmation
- Payment workflow completed
- Order cancelled

### Scheduled Notifications
These are batched or scheduled for optimal timing:
- Daily seller summaries (8:00 AM local time)
- Weekly wishlist reminders (Sunday evenings)
- Review followups (48 hours after delivery)
- Low stock alerts (checked hourly, sent once per day maximum)

### Event-Driven Notifications
These depend on specific conditions being met:
- Product back in stock (when stock increases above threshold)
- Low stock alerts (when stock decreases below threshold)
- Review responses (when seller responds to existing review)

---

## Quiet Hours and Notification Timing

### Respecting User Time
Avoid sending non-urgent notifications during typical sleeping hours (10 PM to 7 AM local time). Order status changes are exempt as they're time-sensitive, but marketing and engagement messages should wait until morning.

### Timezone Considerations
Bhutan uses Bhutan Time (BTT), UTC+6. Ensure the server respects this timezone when scheduling notifications. Users traveling abroad should receive notifications based on their account's primary location, not their current timezone.

### Batch Windowing
When sending batch notifications (like daily summaries), spread them across a window rather than sending all at once. For example, send daily summaries between 8:00 and 9:00 AM, distributed evenly to avoid server load spikes.

---

## User Control and Preferences

### Notification Categories
Users should be able to control notifications at a granular level through app settings:

**Order Updates:**
All notifications related to their orders (placed, confirmed, shipped, delivered, cancelled). Default: Enabled. Most users want order updates.

**Payment Notifications:**
All notifications about payment workflow steps. Default: Enabled. Critical for users involved in payment processing.

**Product Alerts:**
Notifications about wishlist items back in stock and products they might like. Default: Enabled. Valuable for interested buyers.

**Marketing Messages:**
Promotional content, new features, and general engagement messages. Default: Disabled. Users should opt in to marketing.

### Master Toggle
A master switch at the top of notification settings allows users to disable all notifications at once. This is useful for users who need temporary peace or prefer checking the app manually.

When the master toggle is off, store the individual category preferences so they can be restored when users re-enable notifications.

### Turning Off Notifications
Provide clear instructions for users who want to disable notifications entirely:
- Open app settings by tapping profile icon
- Navigate to Notification Settings
- Toggle off desired categories or use master switch
- Changes take effect immediately

Also note that users can manage notifications at the device level through their phone's settings, which overrides app-level preferences.

---

## In-App Notification Center

### Purpose
An in-app notification inbox serves as a backup for users who dismiss notifications or want to review past updates. It ensures important information isn't lost even if system notifications are cleared.

### Features
- **Chronological List:** Display notifications in reverse chronological order (newest first)
- **Read/Unread Status:** Visual distinction between new and viewed notifications
- **Filtering:** Option to filter by category (orders, payments, products)
- **Persistence:** Store last 30 days of notifications locally
- **Action Shortcuts:** Tap any notification to navigate to relevant screen
- **Clear All:** Button to mark all notifications as read
- **Delete:** Swipe to delete individual notifications

### Access
Place a notification bell icon in the app header on main screens. Display a badge with unread count when new notifications arrive. Tapping the bell opens the full notification center.

---

## Visual Design Guidelines

### Notification Icons
Each notification category should have a recognizable icon:
- Orders: Shopping bag or receipt icon
- Payments: Currency or credit card icon
- Products: Tag or box icon
- Account: User or bell icon

Use consistent icons across system notifications, in-app notifications, and the notification center.

### Colors and Branding
System notifications should use DrukFarm's brand color (green #059669) as the accent color. This creates brand recognition even before users open the notification.

On Android, configure the notification channel to use green accent color, green LED light (if device supports), and the app logo as the notification icon.

### Notification Sounds
Use a pleasant, brief notification sound that's distinctive but not jarring. The sound should be recognizable as DrukFarm after users hear it a few times.

Provide options in settings to:
- Enable or disable notification sounds
- Choose between multiple sound options
- Set different sounds for different categories (future enhancement)

### Rich Notifications (Future)
Consider enhancing notifications with:
- Product images in product-related notifications
- Order summary images showing product photos
- Action buttons directly in notification (Accept Order, View Details, etc.)
- Progress indicators for multi-step processes like payment workflow

---

## Deep Linking Behavior

### Expected Navigation
When users tap notifications, the app should intelligently navigate to the most relevant screen:

**Order Notifications:**
Open My Orders screen with the specific order highlighted or expanded. If the app was already on a different screen, navigate back to orders first.

**Payment Notifications:**
Open the payment status screen for the specific order, showing the current payment workflow state and any actions needed.

**Product Notifications:**
Open the product detail page for the mentioned product, ready for purchase or wishlist addition.

**General Notifications:**
Open the home screen or the screen most relevant to the notification context.

### State Preservation
If users are in the middle of an action (filling a form, selecting products), ask before navigating away from notifications to avoid losing progress. Consider showing the notification in-app first with a "View" button rather than immediately redirecting.

### Cold Start vs Warm Start
Handle both scenarios:
- **Cold Start:** App is completely closed. Open app, show splash screen briefly, then navigate to notification target.
- **Warm Start:** App is in background. Resume app and navigate to target without showing splash screen.

---

## Notification Fatigue Prevention

### Frequency Caps
Limit notification frequency to prevent overwhelming users:
- Maximum 10 notifications per user per hour for transactional updates
- Maximum 1 marketing notification per user per day
- Maximum 3 engagement reminders per user per week

### Smart Grouping
Group related notifications when appropriate:
- Multiple orders from same seller arriving together: "You have 3 new orders from [seller]"
- Multiple payment confirmations: "2 payments processed for your orders"
- Multiple products restocked: "[Count] wishlisted products are back in stock"

### Progressive Quieting
If users repeatedly ignore certain notification types without opening them, gradually reduce frequency or ask if they want to adjust preferences.

### Unsubscribe Feedback
When users disable notification categories, optionally ask why:
- Too frequent
- Not relevant
- Wrong timing
- Prefer checking app manually
- Other reason

Use this feedback to improve notification strategy.

---

## Error States and Edge Cases

### Permission Denied
If users deny notification permissions:
- Don't repeatedly ask
- Show a subtle banner in settings explaining benefits
- Provide clear instructions for enabling in device settings
- App should function fully without notifications

### Token Expiration
Device tokens can expire or become invalid:
- Refresh tokens automatically when app opens
- Remove invalid tokens from database when detected
- Don't show errors to users; handle silently

### Notification Delivery Failures
If notifications fail to send:
- Log failures for debugging
- Retry critical notifications (order status changes)
- Don't retry marketing notifications
- Ensure app shows latest state when opened regardless

### Offline Scenarios
When devices are offline:
- Notifications queue on Firebase and deliver when device reconnects
- App should sync state when reopened
- Show updated information even if notification was missed

---

## Accessibility Considerations

### Screen Readers
Ensure notification text is clear and makes sense when read aloud by screen readers. Avoid relying on visual formatting or emojis to convey meaning.

### Vibration Patterns
Configure distinct vibration patterns for different notification priorities:
- Standard: Short single vibration
- Important: Two quick vibrations
- Urgent: Three quick vibrations

### Visual Indicators
Don't rely solely on sound or vibration. Always provide visual confirmation through:
- Notification badge on app icon
- In-app notification center unread count
- Visual indicators on relevant screens

---

## Localization and Language

### Current Language Support
DrukFarm operates primarily in English, which is one of Bhutan's official languages. Notifications should use clear, simple English appropriate for all education levels.

### Future Dzongkha Support
When adding Dzongkha language support:
- Translate all notification templates
- Ensure proper text rendering for Tibetan script
- Test that messages fit within notification space constraints
- Consider that Dzongkha text may be longer than English equivalent

### Cultural Sensitivity
Notifications should be respectful of Bhutanese culture:
- Use appropriate titles and honorifics
- Avoid aggressive sales language
- Respect business hour norms
- Consider local holidays and festivals when scheduling marketing messages

---

## Testing Notification Experience

### Manual Testing Checklist
- [ ] Create test orders and verify all status notifications arrive
- [ ] Test notifications with long product names and user names
- [ ] Verify notifications appear correctly when app is closed, backgrounded, and active
- [ ] Test deep linking from each notification type
- [ ] Verify notification preferences save and apply correctly
- [ ] Test notification center displays history accurately
- [ ] Ensure notifications respect quiet hours settings
- [ ] Test with multiple rapid notifications to verify grouping
- [ ] Verify accessible by using device screen reader

### User Testing
Conduct user testing with real farmers, consumers, and transporters:
- Observe their notification preferences after one week of use
- Ask if notification timing feels appropriate
- Gather feedback on notification clarity and usefulness
- Test whether deep linking meets their expectations
- Identify any confusion or frustration points

### A/B Testing
Consider testing variations:
- Different notification wording for same events
- Different timing for engagement notifications
- With and without emoji in notification titles
- Short vs detailed notification messages

Measure open rates, action rates, and opt-out rates to determine optimal approach.

---

## Success Metrics

### Quantitative Metrics
- **Delivery Rate:** Target 95%+ of sent notifications successfully delivered
- **Open Rate:** Target 30%+ of notifications tapped by users
- **Conversion Rate:** Target 20%+ of order notifications leading to seller action
- **Opt-Out Rate:** Target less than 5% disabling notifications in first month

### Qualitative Metrics
- User feedback through in-app surveys
- Support ticket volume related to notifications
- User comments in app store reviews
- Seller feedback about order management efficiency

### Business Impact Metrics
- Order confirmation time (should decrease)
- Order completion rate (should increase)
- Customer satisfaction scores (should increase)
- Repeat purchase rate (should increase)

---

## Continuous Improvement

### Regular Reviews
Monthly review sessions should examine:
- Notification performance metrics
- User feedback and complaints
- Delivery failure rates and patterns
- Most and least effective notification types

### Iteration Cycle
Based on reviews, iterate on:
- Notification wording and tone
- Timing and frequency
- Notification priority levels
- Addition or removal of notification types

### User Feedback Integration
Create channels for users to provide feedback:
- In-app feedback form specifically for notifications
- Regular user surveys about notification quality
- Option to report problematic notifications
- Community forums for discussing notification preferences

---

## Conclusion

A well-designed notification system enhances user experience by keeping everyone informed without being intrusive. By following these guidelines, DrukFarm's notifications will add value to the platform while respecting user attention and preferences. Regular monitoring and iteration based on user feedback ensures the notification system continues to serve users effectively as the platform grows.
