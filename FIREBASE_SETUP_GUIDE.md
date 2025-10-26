# Firebase Setup and Configuration Guide

## Document Purpose
This guide walks through the complete process of setting up Firebase Cloud Messaging for the DrukFarm push notifications system. It covers creating the Firebase project, obtaining necessary credentials, and configuring both the backend server and mobile application.

---

## Prerequisites

Before beginning Firebase setup, ensure you have:
- A Google account (personal or organizational)
- Admin access to the DrukFarm backend repository
- Access to the Apple Developer account (for iOS push notifications)
- Access to Google Play Console (for Android push notifications)
- Node.js and npm installed on your development machine
- Expo CLI installed globally

---

## Part 1: Creating the Firebase Project

### Step 1: Access Firebase Console

Open your web browser and navigate to the Firebase Console at console.firebase.google.com. Sign in with your Google account. If this is your first time using Firebase, you may need to accept terms of service and complete initial setup.

### Step 2: Create New Project

Click the "Add project" or "Create a project" button on the Firebase console homepage. You will be guided through a three-step project creation wizard.

**Project Name:**
Enter "DrukFarm" as your project name. Firebase will automatically generate a unique project ID based on this name, which might look like "drukfarm-a1b2c" with a random suffix. This project ID is permanent and will be used in configuration files.

**Google Analytics:**
On the second screen, you can choose whether to enable Google Analytics for the project. For a production application, enabling Analytics is recommended as it provides valuable insights into notification performance and user behavior. However, it's optional and can be added later if needed.

**Analytics Account:**
If you enabled Analytics, select an existing Google Analytics account or create a new one. For most cases, creating a new account specific to DrukFarm is the cleanest approach.

Click "Create project" and wait for Firebase to initialize your project. This typically takes 30 seconds to a minute.

### Step 3: Project Overview

Once creation completes, you'll be taken to your project dashboard. This is the main control panel for all Firebase services. Take note of your Project ID displayed at the top of the page - you'll need this later.

---

## Part 2: Enable Cloud Messaging

### Step 1: Navigate to Cloud Messaging

From the Firebase project dashboard, look at the left sidebar menu. Click on the gear icon next to "Project Overview" and select "Project settings" from the dropdown.

In the project settings page, you'll see several tabs at the top: General, Service accounts, Cloud Messaging, Integrations, and more. Click on the "Cloud Messaging" tab.

### Step 2: Enable Cloud Messaging API

If this is a new project, you may see a notice that the Cloud Messaging API needs to be enabled. Click the button or link to enable it. This will open Google Cloud Console in a new tab.

In Google Cloud Console, you'll see the Firebase Cloud Messaging API page. Click the "Enable" button. Wait for the API to be enabled - this usually takes just a few seconds.

### Step 3: Note Configuration Values

Return to the Firebase Console Cloud Messaging tab. You'll see several important values:

**Server Key (Legacy):**
This is shown but should not be used for new implementations. It's maintained only for backward compatibility.

**Sender ID:**
This is a numeric ID used for Android configuration. Copy this value and save it in a secure note for later use.

The newer Cloud Messaging configuration uses service account credentials instead of the legacy server key, which is more secure and flexible.

---

## Part 3: Generate Service Account Credentials

### Step 1: Access Service Accounts

From the Firebase project settings page (gear icon), click on the "Service accounts" tab at the top.

### Step 2: Generate Private Key

You'll see information about the Firebase Admin SDK with a code example. Below the code example, there's a button labeled "Generate new private key". Click this button.

A dialog will appear warning you that the private key should be kept confidential and never checked into version control. Read the warning carefully - these credentials provide full administrative access to your Firebase project.

Click "Generate key" to confirm. A JSON file will immediately download to your computer. The filename will be something like "drukfarm-a1b2c-firebase-adminsdk-xyz123-a1b2c3d4e5.json".

### Step 3: Secure the Credentials File

**IMPORTANT SECURITY NOTE:**
This JSON file contains sensitive credentials that grant full access to your Firebase project. Never commit it to version control, share it publicly, or store it in unsecured locations.

Move the downloaded JSON file to a secure location on your development machine. For local development, you might place it in a secure folder outside your project directory. For production deployment, you'll extract values from this file into environment variables.

### Step 4: Extract Key Values

Open the JSON file in a text editor. It contains several fields you'll need:

**project_id:** The unique identifier for your Firebase project
**private_key:** A long string starting with "-----BEGIN PRIVATE KEY-----"
**client_email:** An email address ending with @iam.gserviceaccount.com

Copy these three values into a secure note. You'll use them to configure the backend server.

---

## Part 4: Configure Android Application

### Step 1: Register Android App

Return to the Firebase Console project overview page (click "Project Overview" in the left sidebar). In the main panel, you'll see options to add Firebase to your app. Click the Android icon.

**Android Package Name:**
Enter the package name from your app.json file. For DrukFarm, this is "com.pemarinchen12.drukfarm". This must exactly match the package field in your app configuration.

**App Nickname (Optional):**
Enter a friendly name like "DrukFarm Android". This is just for your reference in the Firebase Console.

**Debug Signing Certificate (Optional):**
For development, you can skip this. For production releases with advanced features, you may need to add your SHA-1 certificate fingerprint.

Click "Register app" to continue.

### Step 2: Download google-services.json

After registering the app, Firebase will generate a configuration file for Android. Click the "Download google-services.json" button. This file contains API keys and configuration needed for your Android app to communicate with Firebase.

### Step 3: Place Configuration File

Move the downloaded google-services.json file to the root directory of your mobile app folder. It should be at the same level as your app.json file. The exact path should be: mobile/google-services.json

This file is safe to commit to version control as it only contains public API keys that are meant to be bundled with your app. The actual security comes from Firebase Security Rules and backend validation.

### Step 4: Add to Gitignore (Optional)

While google-services.json is generally safe to commit, some organizations prefer to keep it out of version control and provide it during the build process. If you choose this approach, add google-services.json to your .gitignore file and document how to obtain it for new developers.

---

## Part 5: Configure iOS Application

### Step 1: Register iOS App

From the Firebase Console project overview page, click the iOS icon to add an iOS app.

**iOS Bundle ID:**
Enter the bundle identifier from your app.json file. For DrukFarm, this is "com.pemarinchen12.drukfarm". This must exactly match the bundleIdentifier field in your iOS configuration.

**App Nickname (Optional):**
Enter a friendly name like "DrukFarm iOS".

**App Store ID (Optional):**
If your app is already on the App Store, you can enter its App Store ID. Otherwise, skip this field.

Click "Register app" to continue.

### Step 2: Download GoogleService-Info.plist

Firebase will generate an iOS configuration file. Click "Download GoogleService-Info.plist" to download this file. It contains similar configuration to the Android file but in Apple's property list format.

### Step 3: Place Configuration File

Move the downloaded GoogleService-Info.plist file to the root directory of your mobile app folder, next to app.json. The path should be: mobile/GoogleService-Info.plist

Like the Android configuration file, this is safe to commit to version control.

### Step 4: Apple Push Notification Setup

To enable push notifications on iOS, you need to configure Apple Push Notification service (APNs) certificates in Firebase.

**Upload APNs Certificate or Key:**
Firebase needs either an APNs certificate (.p12 file) or APNs authentication key (.p8 file) to send notifications to iOS devices. The authentication key method is newer and simpler.

**Obtaining APNs Key:**
Log into your Apple Developer account at developer.apple.com. Navigate to Certificates, Identifiers & Profiles, then Keys. Create a new key, enable Apple Push Notifications service (APNs), and download the .p8 file. Note the Key ID and your Team ID.

**Upload to Firebase:**
In the Firebase Console, go to Project Settings, Cloud Messaging tab. Scroll down to the iOS app configuration section. Under APNs Authentication Key, click "Upload" and provide your .p8 file, Key ID, and Team ID.

This completes the iOS configuration in Firebase.

---

## Part 6: Backend Environment Configuration

### Step 1: Understand Environment Variables

The backend server needs three pieces of information from the Firebase service account JSON file you downloaded earlier. These should be stored as environment variables, never hardcoded in the source code.

### Step 2: Local Development Setup

For local development, create or update the .env file in your server directory. Add these three lines:

FIREBASE_PROJECT_ID equals your project ID from the JSON file
FIREBASE_CLIENT_EMAIL equals the client_email from the JSON file  
FIREBASE_PRIVATE_KEY equals the private_key from the JSON file

**Special Handling for Private Key:**
The private key contains newline characters which can cause issues in environment files. When copying the private key value, keep it as-is including the \n escape sequences. The backend code will handle converting these to actual newlines.

Alternatively, wrap the entire private key in double quotes to preserve formatting.

### Step 3: Vercel Deployment Configuration

For production deployment on Vercel, environment variables are configured through the Vercel dashboard.

**Access Project Settings:**
Log into Vercel and navigate to your DrukFarm backend project. Click on the Settings tab.

**Add Environment Variables:**
In the left sidebar, click "Environment Variables". For each of the three Firebase variables, click "Add" and enter:
- The variable name (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY)
- The value from your Firebase service account JSON
- Select which environments it applies to (Production, Preview, Development)

**Private Key Special Handling:**
For the FIREBASE_PRIVATE_KEY on Vercel, you may need to format it carefully. Some developers find it easier to encode the entire private key in base64 and decode it in the application, though the direct approach with preserved newlines usually works.

**Redeploy:**
After adding environment variables, redeploy your application for the changes to take effect.

### Step 4: Security Verification

Verify that your Firebase credentials are never logged, committed to version control, or exposed through API responses. Review your .gitignore file to ensure .env is listed. Check that no console.log statements print the credentials during debugging.

---

## Part 7: Mobile App Configuration

### Step 1: Update app.json

The app.json file needs several modifications to support push notifications.

**Add Notification Plugin:**
In the plugins array, add an entry for expo-notifications. This plugin configuration should include the path to your notification icon image file, the notification color in hex format (DrukFarm's green is #059669), and optionally custom notification sounds.

**Update Android Permissions:**
In the android section, ensure the permissions array includes "android.permission.POST_NOTIFICATIONS". This is required for Android 13 and higher to show notifications.

**Update iOS Configuration:**
In the ios section's infoPlist object, add UIBackgroundModes array with "remote-notification" as a value. This allows the app to wake up when notifications arrive in the background.

**Verify Google Services File Path:**
Ensure the app.json android section has a googleServicesFile field pointing to "./google-services.json". Expo will automatically include this file during Android builds.

### Step 2: Install Dependencies

Open a terminal and navigate to your mobile directory. Run the following command to install notification-related packages:

npx expo install expo-notifications expo-device expo-constants

This installs three packages: expo-notifications for notification handling, expo-device for detecting whether the app is running on a real device, and expo-constants for accessing Expo configuration values.

Wait for the installation to complete, then verify the packages appear in your package.json file.

### Step 3: Prepare Notification Assets

**Notification Icon:**
Create a notification icon for Android. This should be a simple, white-on-transparent PNG image. The recommended size is 96x96 pixels. Save it as mobile/assets/notification-icon.png.

Android uses this icon in the notification tray. Keep the design simple as it will be rendered as a small monochrome icon.

**Notification Sound (Optional):**
If you want a custom notification sound, prepare a WAV or MP3 file. Keep it short (1-3 seconds) and not too loud. Save it as mobile/assets/notification-sound.wav.

Update the notification plugin configuration in app.json to reference these asset files.

### Step 4: Verify EAS Configuration

If you're using EAS Build for creating production builds, verify your eas.json file is properly configured. Ensure the build profiles include the correct bundle identifiers and that credentials are set up for both iOS and Android.

For iOS, EAS will need access to your Apple Developer account to manage push notification certificates. Follow the EAS prompts to grant access when you run your first build.

---

## Part 8: Testing Configuration

### Step 1: Test Backend Connection

Before integrating notifications into your full application, test that the backend can connect to Firebase.

Create a simple test script in your server directory that imports the Firebase Admin SDK, initializes it with your environment variables, and attempts to send a test notification to a dummy token. Run this script locally.

If initialization succeeds without errors, your backend Firebase configuration is correct. If you see credential errors, double-check your environment variables match the values from the service account JSON.

### Step 2: Test Mobile Permissions

Build a development version of your mobile app and install it on a physical device (notifications don't work in simulators).

Add temporary code to request notification permissions when the app opens. Run the app and grant permissions when prompted. Check that the app successfully obtains an Expo push token.

Log the token to the console. You'll use this token for end-to-end testing.

### Step 3: End-to-End Test

With a valid device token from the previous step, use the Firebase Console to send a test notification.

Navigate to Firebase Console, select your project, and find "Cloud Messaging" in the left sidebar (not to be confused with the Cloud Messaging tab in Settings). Click "Send your first message".

Compose a test notification with a title and body. In the target selection, choose "Single device" and paste your device token. Send the notification.

If configured correctly, the notification should appear on your device within seconds. Test both while the app is open (foreground) and closed (background).

### Step 4: Troubleshooting Common Issues

**No notification received:**
Check that the device has internet connectivity. Verify the token is valid and hasn't expired. Ensure the app has notification permissions enabled in device settings.

**Invalid token errors:**
Tokens can expire or become invalid. Request a new token and try again. Ensure you're using the Expo push token, not the raw FCM token.

**iOS notifications not working:**
Verify APNs certificate is uploaded to Firebase. Check that your iOS bundle identifier exactly matches between app.json, Firebase, and Apple Developer account. Test on a physical device (iOS simulator doesn't support notifications).

**Android notifications not working:**
Verify google-services.json is in the correct location. Check that the package name in Firebase matches app.json exactly. Ensure POST_NOTIFICATIONS permission is granted for Android 13+.

---

## Part 9: Production Considerations

### Step 1: Separate Environments

For production applications, it's best practice to have separate Firebase projects for development, staging, and production environments.

Create three Firebase projects: "DrukFarm Dev", "DrukFarm Staging", and "DrukFarm Production". Repeat the setup process for each, generating separate configuration files and credentials.

Use environment-specific configuration in your mobile app. Expo supports this through different app.json configurations or build profiles in eas.json.

On the backend, use different environment variable values depending on which environment is deployed.

### Step 2: Security Rules

Even though this setup focuses on Cloud Messaging which doesn't use Firebase Security Rules, if you expand to use other Firebase services (like Firestore), set up proper security rules to protect data.

Review Firebase's security documentation and implement rules that restrict access appropriately.

### Step 3: Monitoring and Alerts

Set up monitoring for your Firebase project. Enable Firebase Cloud Messaging diagnostics to track delivery rates, failures, and other metrics.

Configure alerts in Google Cloud Console to notify you if there are significant drops in notification delivery rates or if quota limits are approaching.

### Step 4: Cost Management

While Firebase Cloud Messaging is free, monitor your usage to ensure you stay within expected ranges. Set up budget alerts in Google Cloud Console to be notified of unexpected charges from other Firebase services you might use in the future.

Review Firebase pricing documentation periodically as pricing can change.

---

## Part 10: Documentation and Team Access

### Step 1: Document Configuration

Create internal documentation for your team explaining:
- Which Firebase project is used for which environment
- Where to find the service account JSON files (in secure storage, not version control)
- How to obtain configuration files for new team members
- Who has admin access to the Firebase Console

### Step 2: Team Access Management

In the Firebase Console, go to Project Settings and click on the "Users and permissions" tab. Add team members who need access to Firebase Console for debugging, monitoring, or configuration changes.

Assign appropriate roles: Editor for developers who need to modify settings, Viewer for those who only need to monitor metrics, Admin for project leads who manage team access.

### Step 3: Secure Credential Storage

Store the service account JSON file and other credentials in your organization's secure credential management system (like HashiCorp Vault, AWS Secrets Manager, or a secured internal wiki).

Never store credentials in Slack messages, email, or other unsecured communication channels.

Document the process for rotating credentials if they're ever compromised.

### Step 4: Backup Configuration

Export your current Firebase configuration periodically. While Firebase stores your settings, having backups ensures you can quickly restore if something goes wrong.

Document the configuration of APNs certificates, API keys, and other settings that might need to be recreated if starting over.

---

## Configuration Checklist

Use this checklist to ensure all configuration steps are complete:

**Firebase Project:**
- [ ] Firebase project created with appropriate name
- [ ] Cloud Messaging API enabled
- [ ] Service account credentials generated and securely stored
- [ ] Android app registered in Firebase
- [ ] iOS app registered in Firebase

**Credentials and Keys:**
- [ ] Service account JSON file downloaded and secured
- [ ] APNs authentication key uploaded for iOS
- [ ] google-services.json downloaded and placed in mobile directory
- [ ] GoogleService-Info.plist downloaded and placed in mobile directory

**Backend Configuration:**
- [ ] FIREBASE_PROJECT_ID environment variable set
- [ ] FIREBASE_CLIENT_EMAIL environment variable set
- [ ] FIREBASE_PRIVATE_KEY environment variable set
- [ ] Environment variables configured in production deployment platform
- [ ] Credentials never committed to version control

**Mobile Configuration:**
- [ ] expo-notifications and related packages installed
- [ ] app.json updated with notification plugin configuration
- [ ] Android permissions added to app.json
- [ ] iOS background modes configured
- [ ] Firebase configuration files placed correctly
- [ ] Notification icon created and referenced
- [ ] EAS build configuration updated if using EAS

**Testing:**
- [ ] Backend Firebase connection tested
- [ ] Mobile app permission request tested
- [ ] End-to-end notification test successful
- [ ] Foreground notification display tested
- [ ] Background notification delivery tested
- [ ] Deep linking from notifications tested

**Production Readiness:**
- [ ] Separate Firebase projects for dev/staging/production configured
- [ ] Team access properly configured
- [ ] Monitoring and alerts set up
- [ ] Documentation created for team
- [ ] Credential backup and rotation process documented

---

## Getting Help

If you encounter issues during Firebase setup:

**Firebase Documentation:**
Visit firebase.google.com/docs for comprehensive documentation on all Firebase services including Cloud Messaging.

**Expo Documentation:**
Visit docs.expo.dev for guides on expo-notifications and push notification configuration with Expo.

**Common Issues:**
Search the Firebase and Expo forums for similar issues. Many configuration problems have been solved by other developers and documented in forum posts.

**Support Channels:**
For Firebase-specific issues, use Firebase support through the Firebase Console. For Expo-related issues, use the Expo Discord community or GitHub issues.

**Testing Tools:**
Use the Firebase Console's Cloud Messaging test interface to isolate whether issues are with your app configuration or your server code.

---

## Next Steps

After completing Firebase setup and configuration, you're ready to implement the notification service and integrate it throughout your application. Refer to the Notification Integration Points document for detailed instructions on where and how to add notification triggers in your code.

Remember to test thoroughly at each stage of integration, starting with simple test notifications and gradually adding complexity as you verify each component works correctly.
