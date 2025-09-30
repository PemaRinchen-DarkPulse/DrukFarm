const mongoose = require('mongoose');
const Order = require('../models/Order');

// Test script for payment workflow
async function testPaymentWorkflow() {
    try {
        // Connect to MongoDB (adjust connection string as needed)
        await mongoose.connect('mongodb://localhost:27017/drukfarm');
        console.log('Connected to MongoDB');

        // Find an existing order or create test order
        const order = await Order.findOne();
        if (!order) {
            console.log('No orders found. Please create an order first.');
            return;
        }

        console.log(`\n=== Testing Payment Workflow for Order: ${order._id} ===`);
        console.log(`Order status: ${order.status}`);
        console.log(`Has transporter: ${!!order.transporter?.cid}`);
        console.log(`Has tshogpa: ${!!order.tshogpasCid}`);
        console.log(`Farmer CID: ${order.product.sellerCid}`);
        console.log(`Tshogpa is seller: ${order.tshogpasCid === order.product.sellerCid}`);

        // Test delivery status requirement
        console.log('\n1. Testing delivery status requirement...');
        if (order.status !== 'delivered') {
            console.log('⚠️ Order is not delivered. Setting status to delivered for testing...');
            order.status = 'delivered';
            await order.save();
        }

        // Initialize payment flow
        console.log('\n2. Initializing payment flow...');
        try {
            await order.initializePaymentFlow();
            console.log('✅ Payment flow initialized successfully');
        } catch (error) {
            console.log('⚠️ Payment flow initialization:', error.message);
        }

        // Show detected flow
        const flow = order.detectPaymentFlow();
        console.log('\n3. Detected payment flow:');
        flow.forEach((step, index) => {
            console.log(`   Step ${index + 1}: ${step.step} (${step.fromCid} → ${step.toCid})`);
        });

        // Get initial payment status
        let paymentStatus = order.getPaymentStatus();
        console.log('\n4. Initial payment status:');
        console.log(JSON.stringify(paymentStatus, null, 2));

        // Test each step completion based on flow
        console.log('\n5. Testing step completions...');
        
        for (const step of order.paymentFlow) {
            console.log(`\n   Testing step: ${step.step}`);
            
            // Determine who should complete this step (the receiver)
            const receiver = step.toCid;
            let role = 'unknown';
            
            if (receiver === order.userCid) role = 'consumer';
            else if (receiver === order.transporter?.cid) role = 'transporter';
            else if (receiver === order.tshogpasCid) role = 'tshogpa';
            else if (receiver === order.product.sellerCid) role = 'farmer';
            
            try {
                await order.updatePaymentStep(
                    step.step,
                    'completed',
                    {
                        cid: receiver,
                        role: role,
                        name: `Test ${role}`
                    },
                    `Payment confirmed by ${role}`
                );
                console.log(`   ✅ ${step.step} completed by ${role}`);
            } catch (error) {
                console.log(`   ❌ Failed to complete ${step.step}: ${error.message}`);
            }
        }

        // Test special case: tshogpa is seller
        if (order.tshogpasCid === order.product.sellerCid) {
            console.log('\n6. Testing special case: Tshogpa is seller');
            try {
                await order.completePaymentForTshogpaSeller({
                    cid: order.tshogpasCid,
                    role: 'tshogpa',
                    name: 'Test Tshogpa-Seller'
                });
                console.log('   ✅ Tshogpa-seller payment completed');
            } catch (error) {
                console.log(`   ⚠️ Tshogpa-seller completion: ${error.message}`);
            }
        }

        // Get final payment status
        await order.reload(); // Refresh order from database
        paymentStatus = order.getPaymentStatus();
        console.log('\n7. Final payment status:');
        console.log(JSON.stringify(paymentStatus, null, 2));

        console.log('\n8. Payment status history:');
        order.paymentStatusHistory.forEach((entry, index) => {
            console.log(`   ${index + 1}. ${entry.step}: ${entry.previousStatus} → ${entry.newStatus} by ${entry.changedBy.role}`);
        });

        console.log(`\n✅ Order isPaid: ${order.isPaid}`);
        console.log(`✅ Payment completed at: ${order.paymentCompletedAt}`);

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

// Test dynamic flow detection
async function testFlowDetection() {
    try {
        await mongoose.connect('mongodb://localhost:27017/drukfarm');
        console.log('\n=== Testing Dynamic Flow Detection ===');

        // Create mock orders to test different flows
        const testScenarios = [
            {
                name: 'Full Flow: Consumer → Transporter → Tshogpa → Farmer',
                order: {
                    userCid: '12345678901',
                    transporter: { cid: '12345678902' },
                    tshogpasCid: '12345678903',
                    product: { sellerCid: '12345678904' }
                }
            },
            {
                name: 'No Transporter: Consumer → Tshogpa → Farmer',
                order: {
                    userCid: '12345678901',
                    transporter: null,
                    tshogpasCid: '12345678903',
                    product: { sellerCid: '12345678904' }
                }
            },
            {
                name: 'No Tshogpa: Consumer → Transporter → Farmer',
                order: {
                    userCid: '12345678901',
                    transporter: { cid: '12345678902' },
                    tshogpasCid: null,
                    product: { sellerCid: '12345678904' }
                }
            },
            {
                name: 'Tshogpa is Seller: Consumer → Transporter → Tshogpa-Seller',
                order: {
                    userCid: '12345678901',
                    transporter: { cid: '12345678902' },
                    tshogpasCid: '12345678903',
                    product: { sellerCid: '12345678903' } // Same as tshogpa
                }
            },
            {
                name: 'Direct: Consumer → Farmer',
                order: {
                    userCid: '12345678901',
                    transporter: null,
                    tshogpasCid: null,
                    product: { sellerCid: '12345678904' }
                }
            }
        ];

        for (const scenario of testScenarios) {
            console.log(`\n${scenario.name}:`);
            
            // Create a temporary order object with mock data
            const mockOrder = {
                ...scenario.order,
                detectPaymentFlow() {
                    const hasTransporter = this.transporter && this.transporter.cid;
                    const hasTshogpa = this.tshogpasCid;
                    const farmer = this.product.sellerCid;
                    const consumer = this.userCid;
                    const tshogpaIsSeller = hasTshogpa && this.tshogpasCid === farmer;
                    
                    let flow = [];
                    
                    if (hasTransporter && hasTshogpa) {
                        flow.push({ step: 'consumer_to_transporter', fromCid: consumer, toCid: this.transporter.cid });
                        flow.push({ step: 'transporter_to_tshogpa', fromCid: this.transporter.cid, toCid: this.tshogpasCid });
                        if (!tshogpaIsSeller) {
                            flow.push({ step: 'tshogpa_to_farmer', fromCid: this.tshogpasCid, toCid: farmer });
                        }
                    } else if (hasTransporter && !hasTshogpa) {
                        flow.push({ step: 'consumer_to_transporter', fromCid: consumer, toCid: this.transporter.cid });
                        flow.push({ step: 'transporter_to_farmer', fromCid: this.transporter.cid, toCid: farmer });
                    } else if (!hasTransporter && hasTshogpa) {
                        flow.push({ step: 'consumer_to_tshogpa', fromCid: consumer, toCid: this.tshogpasCid });
                        if (!tshogpaIsSeller) {
                            flow.push({ step: 'tshogpa_to_farmer', fromCid: this.tshogpasCid, toCid: farmer });
                        }
                    } else {
                        flow.push({ step: 'consumer_to_farmer', fromCid: consumer, toCid: farmer });
                    }
                    
                    return flow;
                }
            };
            
            const flow = mockOrder.detectPaymentFlow();
            flow.forEach((step, index) => {
                console.log(`   Step ${index + 1}: ${step.step} (${step.fromCid} → ${step.toCid})`);
            });
        }

    } catch (error) {
        console.error('❌ Flow detection test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Test error scenarios
async function testErrorScenarios() {
    try {
        await mongoose.connect('mongodb://localhost:27017/drukfarm');
        console.log('\n=== Testing Error Scenarios ===');

        const order = await Order.findOne();
        if (!order) {
            console.log('No orders found for error testing.');
            return;
        }

        // Test delivery status requirement
        console.log('\n1. Testing non-delivered order rejection...');
        const originalStatus = order.status;
        order.status = 'shipped';
        await order.save();

        // This should fail
        try {
            await order.updatePaymentStep(
                order.paymentFlow[0]?.step || 'consumer_to_transporter',
                'completed',
                { cid: '12345678901', role: 'test', name: 'Test User' }
            );
            console.log('❌ Should have failed for non-delivered order');
        } catch (error) {
            console.log('✅ Correctly rejected non-delivered order:', error.message);
        }

        // Restore status
        order.status = originalStatus;
        await order.save();

        // Test invalid step
        console.log('\n2. Testing invalid step error...');
        try {
            await order.updatePaymentStep(
                'invalid_step',
                'completed',
                { cid: '12345678901', role: 'test', name: 'Test User' }
            );
        } catch (error) {
            console.log('✅ Correctly caught invalid step error:', error.message);
        }

        // Test unauthorized user
        console.log('\n3. Testing unauthorized user...');
        if (order.paymentFlow.length > 0) {
            const step = order.paymentFlow[0];
            try {
                await order.updatePaymentStep(
                    step.step,
                    'completed',
                    { cid: '99999999999', role: 'unauthorized', name: 'Unauthorized User' }
                );
            } catch (error) {
                console.log('✅ Correctly handled unauthorized user:', error.message);
            }
        }

        console.log('✅ Error scenario testing completed');

    } catch (error) {
        console.error('❌ Error testing failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run tests based on command line argument
const testType = process.argv[2] || 'workflow';

if (testType === 'workflow') {
    testPaymentWorkflow();
} else if (testType === 'flows') {
    testFlowDetection();
} else if (testType === 'errors') {
    testErrorScenarios();
} else {
    console.log('Usage: node testPaymentWorkflow.js [workflow|flows|errors]');
}