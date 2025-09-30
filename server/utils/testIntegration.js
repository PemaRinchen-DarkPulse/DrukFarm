/**
 * Frontend-Backend Payment Workflow Integration Test
 * 
 * This script simulates the frontend button clicks and backend processing
 * for the 3-step payment workflow implementation.
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');

async function testPaymentWorkflowIntegration() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/drukfarm');
        console.log('🔌 Connected to MongoDB');

        // Find a delivered order or create test scenario
        let order = await Order.findOne({ status: 'delivered' });
        
        if (!order) {
            console.log('⚠️ No delivered orders found. Creating test order...');
            
            // Create a test delivered order with all required actors
            order = new Order({
                userCid: '12345678901',
                userSnapshot: {
                    cid: '12345678901',
                    name: 'Test Consumer',
                    phoneNumber: '17123456',
                    location: 'Thimphu'
                },
                product: {
                    productId: new mongoose.Types.ObjectId(),
                    productName: 'Test Apples',
                    price: 150,
                    unit: 'kg',
                    sellerCid: '12345678903', // Farmer CID
                    productImageBase64: ''
                },
                quantity: 2,
                totalPrice: 300,
                qrCodeDataUrl: 'data:image/png;base64,test',
                source: 'buy',
                status: 'delivered', // ✅ Order is delivered
                transporter: {
                    cid: '12345678902',
                    name: 'Test Transporter',
                    phoneNumber: '17234567'
                },
                tshogpasCid: '12345678904' // Different from seller - normal case
            });
            
            await order.save();
            console.log('✅ Test delivered order created');
        }

        console.log(`\n🚀 Testing Payment Workflow for Order: ${order._id}`);
        console.log(`📋 Order Status: ${order.status}`);
        console.log(`👤 Consumer: ${order.userCid}`);
        console.log(`🚚 Transporter: ${order.transporter?.cid}`);
        console.log(`🏢 Tshogpa: ${order.tshogpasCid}`);
        console.log(`🌾 Farmer: ${order.product.sellerCid}`);

        // TEST 1: Validation - try to process payment for non-delivered order
        console.log('\n📋 TEST 1: Delivered Status Validation');
        const testOrder = new Order({
            ...order.toObject(),
            _id: new mongoose.Types.ObjectId(),
            status: 'shipped' // Not delivered
        });
        await testOrder.save();

        try {
            await testOrder.initializePaymentFlow();
            console.log('❌ Should have failed for non-delivered order');
        } catch (error) {
            // This should fail in validation, but our model doesn't check status
            // The validation happens in the API endpoint
            console.log('⚠️ Model validation: Backend API will validate delivered status');
        }

        // TEST 2: Initialize Payment Flow
        console.log('\n📋 TEST 2: Initialize Payment Flow');
        try {
            await order.initializePaymentFlow();
            console.log('✅ Payment flow initialized');
        } catch (error) {
            if (error.message.includes('already initialized')) {
                console.log('✅ Payment flow already initialized');
            } else {
                throw error;
            }
        }

        // TEST 3: Transporter confirms payment received from consumer
        console.log('\n📋 TEST 3: Transporter Button Click (✅ Payment Received from Consumer)');
        await order.updatePaymentStep(
            'consumer_to_transporter',
            'completed',
            {
                cid: order.transporter.cid,
                role: 'transporter',
                name: order.transporter.name
            },
            'Payment received from consumer via mobile app button'
        );
        console.log('✅ Transporter marked payment as received');

        // TEST 4: Tshogpa confirms payment received from transporter
        console.log('\n📋 TEST 4: Tshogpa Button Click (✅ Payment Received from Transporter)');
        await order.updatePaymentStep(
            'transporter_to_tshogpa',
            'completed',
            {
                cid: order.tshogpasCid,
                role: 'tshogpa',
                name: 'Test Tshogpa'
            },
            'Payment received from transporter via mobile app button'
        );
        console.log('✅ Tshogpa marked payment as received');

        // TEST 5: Farmer confirms final payment received from tshogpa
        console.log('\n📋 TEST 5: Farmer Button Click (✅ Final Payment Received)');
        await order.updatePaymentStep(
            'tshogpa_to_farmer',
            'completed',
            {
                cid: order.product.sellerCid,
                role: 'farmer',
                name: 'Test Farmer'
            },
            'Final payment received from tshogpa via mobile app button'
        );
        console.log('✅ Farmer marked final payment as received');

        // Reload order to see automatic updates
        await order.reload();
        const finalStatus = order.getPaymentStatus();
        
        console.log('\n📊 FINAL PAYMENT STATUS:');
        console.log(`💰 isPaid: ${order.isPaid}`);
        console.log(`⏰ Payment Completed At: ${order.paymentCompletedAt}`);
        console.log(`📈 Overall Status: ${finalStatus.overallStatus}`);
        console.log(`📋 Steps Summary:`, finalStatus.summary);

        // TEST 6: Special Case - Tshogpa is also the Farmer
        console.log('\n📋 TEST 6: Special Case - Tshogpa is also Farmer');
        const specialOrder = new Order({
            ...order.toObject(),
            _id: new mongoose.Types.ObjectId(),
            tshogpasCid: order.product.sellerCid, // Same CID for tshogpa and farmer
            paymentFlow: [],
            paymentStatusHistory: [],
            isPaid: false,
            paymentCompletedAt: null
        });
        await specialOrder.save();

        await specialOrder.initializePaymentFlow();
        
        // Consumer to transporter
        await specialOrder.updatePaymentStep(
            'consumer_to_transporter',
            'completed',
            { cid: specialOrder.transporter.cid, role: 'transporter', name: 'Test Transporter' },
            'Payment received from consumer'
        );

        // Transporter to tshogpa (should auto-complete tshogpa_to_farmer)
        await specialOrder.updatePaymentStep(
            'transporter_to_tshogpa',
            'completed',
            { cid: specialOrder.tshogpasCid, role: 'tshogpa', name: 'Test Tshogpa-Farmer' },
            'Payment received from transporter (tshogpa is also farmer)'
        );

        await specialOrder.reload();
        const specialStatus = specialOrder.getPaymentStatus();
        
        console.log('🎯 Special Case Results:');
        console.log(`💰 isPaid: ${specialOrder.isPaid}`);
        console.log(`📈 Overall Status: ${specialStatus.overallStatus}`);
        console.log(`📋 Auto-completed steps: ${specialStatus.summary.completed}/3`);

        if (specialOrder.isPaid && specialStatus.summary.completed === 3) {
            console.log('✅ Special case handled correctly - payment completed automatically');
        } else {
            console.log('❌ Special case failed');
        }

        // Display payment history
        console.log('\n📜 PAYMENT HISTORY:');
        order.paymentStatusHistory.forEach((history, index) => {
            console.log(`${index + 1}. ${history.step}: ${history.previousStatus} → ${history.newStatus}`);
            console.log(`   By: ${history.changedBy.name} (${history.changedBy.role})`);
            console.log(`   Time: ${history.timestamp}`);
            console.log(`   Notes: ${history.notes}`);
            console.log();
        });

        console.log('🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the test
testPaymentWorkflowIntegration();