# DrukFarm - Comprehensive Codebase Documentation

## Project Overview

DrukFarm is a comprehensive agricultural marketplace platform designed specifically for Bhutan, built as a full-stack application with multiple client interfaces. The platform connects farmers, consumers, transporters, and agricultural cooperatives (Tshogpas) in a unified ecosystem that facilitates the buying, selling, and delivery of agricultural products across different dzongkhags (districts) in Bhutan.

## Architecture & Technology Stack

### Backend (Server)
The server is built using **Node.js** with **Express.js** framework and **MongoDB** as the database. The backend follows a RESTful API architecture and is configured for both local development and serverless deployment on platforms like Vercel. The server implements a modular route structure with dedicated endpoints for users, products, categories, orders, cart management, wishlist functionality, and geographical features like drop-off locations and addresses.

The authentication system is stateless and uses a custom CID (Citizen ID) based authentication mechanism, where users authenticate using their 11-digit Bhutanese CID numbers along with passwords that must meet strict security requirements including uppercase, lowercase, numbers, and special characters. The system supports multiple user roles including consumers, farmers, transporters, and Tshogpas (agricultural cooperatives).

### Database Models & Data Structure
The MongoDB database implements a sophisticated schema design with eight core models. The **User model** stores comprehensive user profiles including CID validation, role-based permissions, location data with dzongkhag information, phone number validation, and binary image storage for profile pictures. The **Product model** features advanced image handling with both legacy URL-based and modern binary storage, automatic price and stock management, seller association via CID, rating and review systems, and category relationships.

The **Order model** implements a snapshot-based architecture that preserves historical data integrity by storing user, product, transporter, and delivery address information at the time of order creation. This ensures that even if underlying data changes, order history remains accurate. The order system supports complex status workflows including pending, confirmed, shipped, delivered, and cancelled states, with proper stock management and rollback mechanisms.

### Client Applications

#### Web Application (Client)
The web client is a modern **React** application built with **Vite** as the build tool and **Tailwind CSS** for styling. It implements a responsive design with **React Router** for navigation and features a comprehensive component library including reusable UI components from Radix UI. The application provides full marketplace functionality including product browsing, category-based shopping, cart management, order tracking, and user profile management. It includes advanced features like QR code scanning for product information and a complete management interface for farmers and administrators.

#### Mobile Application (Mobile)
The mobile application is built using **React Native** with **Expo** framework, providing native mobile experiences for both iOS and Android platforms. The mobile app implements the same core functionality as the web client but optimized for mobile interactions. It features **React Navigation** for screen management, **Expo Camera** for QR code scanning and image capture, **Expo Image Picker** for profile and product image selection, and comprehensive offline functionality for areas with limited connectivity.

The mobile app includes specialized dashboards for different user roles - a farmer dashboard for product management and order processing, a transporter dashboard for delivery coordination, and a Tshogpas dashboard for cooperative management. The interface uses **NativeWind** for Tailwind CSS styling in React Native and implements gesture handling for smooth user interactions.

## Core Features & Functionality

### User Management & Authentication
The platform implements a robust user management system that handles registration and authentication for multiple user types. The registration process validates Bhutanese CID numbers (exactly 11 digits) and phone numbers (exactly 8 digits), ensures password strength requirements, and validates dzongkhag selections against the official list of Bhutanese districts. Users can upload profile pictures which are stored as binary data in the database for optimal performance and security.

The authentication system maintains user sessions across both web and mobile platforms, with automatic role-based routing that directs users to appropriate dashboards based on their roles. The system includes password recovery mechanisms and account management features that allow users to update their profiles, change locations, and manage their agricultural operations.

### Product Catalog & Management
The product management system provides comprehensive tools for farmers to list and manage their agricultural products. Products are organized by categories with rich descriptions (70-180 characters), pricing in Bhutanese Ngultrum, unit specifications (per kg, per piece, etc.), and stock quantity tracking. The system supports high-quality product images with both legacy URL-based and modern binary storage options, ensuring compatibility across different client applications.

Product listings include detailed seller information, location data for local sourcing, and integration with the rating and review system. The catalog supports advanced filtering and search capabilities, category-based browsing, and featured product highlighting for promotional purposes. Stock management is handled automatically with real-time updates during order processing and inventory tracking for farmers.

### Shopping Cart & Order Processing
The shopping cart system implements persistent storage tied to user CIDs, allowing seamless cart synchronization across devices. The cart supports quantity adjustments, item removal, and automatic price calculations including any applicable taxes or fees. The system handles complex scenarios like product availability changes and price updates between cart addition and checkout.

Order processing implements a sophisticated workflow that begins with cart validation, proceeds through address selection and payment processing, and culminates in order confirmation with automatic stock deduction. The system creates detailed order snapshots that preserve all relevant information at the time of purchase, including user details, product specifications, delivery addresses, and transporter assignments. Order tracking provides real-time status updates and integrates with the transporter network for delivery coordination.

### Delivery & Transportation Network
The platform includes a specialized transportation management system that connects orders with available transporters across different dzongkhags. Transporters can register on the platform, manage their delivery capacity, and accept orders based on their operational areas. The system automatically matches orders with suitable transporters based on geographical proximity and delivery preferences.

The delivery system supports multiple drop-off locations within each dzongkhag, allowing for flexible delivery options that accommodate Bhutan's unique geographical challenges. Orders can be tracked in real-time with status updates at each stage of the delivery process, and the system generates QR codes for order verification and pickup confirmation.

### Administrative & Management Features
The platform provides comprehensive administrative tools through specialized dashboards for different user roles. Farmers access a detailed management interface where they can add new products, update existing listings, manage inventory, process orders, and track sales performance. The dashboard includes tools for bulk product management, category creation, and integration with the transportation network.

Transporters have access to a dedicated dashboard for managing deliveries, tracking routes, updating order statuses, and coordinating with farmers and customers. The system provides tools for route optimization, delivery scheduling, and performance tracking. Tshogpas (agricultural cooperatives) have specialized interfaces for managing multiple farmers, coordinating bulk orders, and facilitating community-based agricultural activities.

### QR Code Integration & Scanning
Both web and mobile applications include QR code functionality that enhances the user experience and provides additional security features. Products can generate QR codes that contain detailed product information, seller contact details, and authenticity verification data. Users can scan QR codes using their mobile devices to quickly access product information, verify authenticity, and streamline the ordering process.

The QR code system integrates with the order management workflow, allowing for easy order verification during pickup and delivery. This feature is particularly valuable in rural areas where digital literacy may vary, providing a simple and intuitive way to access product and order information.

### Image Management & Storage
The platform implements a dual approach to image management that ensures compatibility with legacy systems while providing modern performance benefits. Product images and user profile pictures can be stored either as traditional URLs or as binary data directly in the database. The binary storage approach eliminates external dependencies, improves loading times, and provides greater control over image quality and security.

The system includes automatic image processing capabilities with validation for file sizes (maximum 10MB), format verification (JPEG, PNG, WebP), and optimization for different display contexts. Images are served through dedicated API endpoints that handle proper caching headers and content type management for optimal performance across both web and mobile clients.

## Technical Implementation Details

### API Architecture & Routes
The backend API follows RESTful principles with eight main route groups that handle different aspects of the platform. The `/api/users` endpoints manage user registration, authentication, profile updates, and role-based access control. The `/api/products` routes handle product CRUD operations, image serving, category filtering, and seller-specific product management.

Order management is handled through `/api/orders` with support for order creation, status updates, seller and buyer order queries, and transporter assignment. The `/api/cart` endpoints provide persistent cart storage with user-specific access control and automatic cleanup mechanisms. Additional routes handle categories, wishlists, addresses, and drop-off locations, each with comprehensive validation and error handling.

### Data Validation & Security
The platform implements comprehensive data validation at multiple levels including MongoDB schema validation, API route validation, and client-side validation. User inputs are sanitized and validated against specific patterns (CID format, phone number format, dzongkhag validation) to ensure data integrity and security.

Password security is handled through bcrypt hashing with salt rounds, and the system enforces strong password requirements. API endpoints implement proper error handling with informative error messages while avoiding information disclosure that could compromise security. The stateless authentication approach reduces session management complexity while maintaining security through proper CID validation.

### Performance Optimization & Scalability
The codebase includes several performance optimization strategies including database indexing on frequently queried fields (user CID, product categories, order status), efficient image storage and serving mechanisms, and proper pagination for large data sets. The MongoDB aggregation pipeline is used for complex queries that require data joining and filtering.

The serverless-ready architecture allows for easy scaling on cloud platforms, with proper separation of concerns between the Express app creation and server initialization. The system includes connection fallback mechanisms for database connectivity issues and implements proper error handling for network failures and service disruptions.

## Current Implementation Status

The DrukFarm platform represents a comprehensive implementation of an agricultural marketplace specifically designed for the Bhutanese market. The system successfully integrates traditional agricultural practices with modern e-commerce capabilities, providing a bridge between rural farmers and urban consumers while addressing the unique geographical and cultural challenges of Bhutan.

The platform currently supports the complete product lifecycle from farmer registration and product listing through consumer browsing, ordering, and delivery coordination. The multi-role system accommodates the diverse stakeholders in Bhutan's agricultural sector, including individual farmers, transportation services, and agricultural cooperatives.

The implementation demonstrates sophisticated understanding of both technical requirements and domain-specific needs, with features like dzongkhag-based organization, CID-based authentication, and QR code integration reflecting deep consideration of the Bhutanese context. The dual client approach (web and mobile) ensures accessibility across different devices and connectivity scenarios common in Bhutan's varied geographical landscape.

This comprehensive platform establishes a strong foundation for agricultural commerce in Bhutan while maintaining the flexibility to adapt and expand as the platform grows and user needs evolve. The clean architecture, robust data models, and thoughtful feature implementation position DrukFarm as a scalable solution that can support Bhutan's agricultural development goals while preserving the cultural and economic values that make Bhutanese agriculture unique.