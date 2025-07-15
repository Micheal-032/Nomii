// =============================================
// AI LOGIC CALCULATIONS - ai-logic.js
// =============================================

// AI Business Alerts
function generateBusinessAlerts() {
    const alerts = [];
    
    // 1. Low Profit Margin Alert
    const lowMarginItems = getLowMarginItems();
    if (lowMarginItems.length > 0) {
        alerts.push({
            type: 'danger',
            icon: '⚠️',
            title: 'Low Profit Margins Detected',
            message: `${lowMarginItems.length} products have profit margins below 15%. Review pricing strategy.`
        });
    }
    
    // 2. Expiring Products Alert
    const expiringItems = getExpiringItems();
    if (expiringItems.length > 0) {
        alerts.push({
            type: 'warning',
            icon: '⏳',
            title: 'Expiry Alerts',
            message: `${expiringItems.length} products are expiring within the next week. Take action to avoid losses.`
        });
    }
    
    // 3. Low Stock Alert
    const lowStockItems = getLowStockItems();
    if (lowStockItems.length > 0) {
        alerts.push({
            type: 'warning',
            icon: '📦',
            title: 'Low Stock Alert',
            message: `${lowStockItems.length} products are below minimum stock levels. Consider reordering.`
        });
    }
    
    // 4. High Performing Category
    const topCategory = getTopPerformingCategory();
    if (topCategory) {
        alerts.push({
            type: 'info',
            icon: '📈',
            title: 'Top Performing Category',
            message: `${topCategory.category} products are performing 35% better than others. Consider increasing stock.`
        });
    }
    
    // 5. Profit Trend Alert
    const profitTrend = calculateProfitTrend();
    if (profitTrend < -5) {
        alerts.push({
            type: 'danger',
            icon: '📉',
            title: 'Profit Decline Detected',
            message: `Your profits have decreased by ${Math.abs(profitTrend)}% compared to last month. Investigate causes.`
        });
    }
    
    return alerts;
}

// AI Business Tips
function generateBusinessTips() {
    const tips = [];
    
    // 1. Seasonal Promotion Tip
    tips.push({
        type: 'info',
        title: 'Seasonal Promotion Opportunity',
        message: 'Festive season is approaching. Create bundled offers for snacks and beverages to increase average order value.'
    });
    
    // 2. Supplier Negotiation Tip
    const supplierToNegotiate = getSupplierForNegotiation();
    if (supplierToNegotiate) {
        tips.push({
            type: 'success',
            title: 'Supplier Negotiation Opportunity',
            message: `Negotiate with ${supplierToNegotiate.name} for better pricing. They've increased prices by 5% recently.`
        });
    }
    
    // 3. Discontinue Low Margin Products
    const lowMarginItems = getLowMarginItems();
    if (lowMarginItems.length > 3) {
        tips.push({
            type: 'warning',
            title: 'Optimize Product Portfolio',
            message: 'Consider discontinuing low-margin products and focus on higher-performing categories.'
        });
    }
    
    // 4. Inventory Optimization Tip
    const slowMovingItems = getSlowMovingItems();
    if (slowMovingItems.length > 5) {
        tips.push({
            type: 'warning',
            title: 'Inventory Optimization',
            message: `${slowMovingItems.length} items are moving slowly. Run promotions to clear stock and free up capital.`
        });
    }
    
    // 5. Payment Terms Tip
    tips.push({
        type: 'info',
        title: 'Payment Terms Optimization',
        message: 'Negotiate extended payment terms with suppliers to improve cash flow.'
    });
    
    return tips;
}

// Smart Reordering System
function calculateReorderScore(item) {
    const stockRatio = item.quantity / item.minStock;
    const salesVelocity = item.salesVelocity;
    const expiryRisk = getDaysUntilExpiry(item.expiryDate) < 30 ? 1.5 : 1;
    const marginFactor = (item.sellingPrice - item.purchasePrice) / item.sellingPrice;
    
    return (salesVelocity * marginFactor * expiryRisk) / stockRatio;
}

// TruScore Calculation
function calculateTruScore(supplier) {
    const weights = {
        deliveryTimeliness: 0.25,
        orderAccuracy: 0.25,
        stockAvailability: 0.15,
        retailerFeedback: 0.20,
        priceCompetitiveness: 0.15
    };
    
    // Simulated metrics
    const metrics = {
        deliveryTimeliness: supplier.performance.onTime / 100,
        orderAccuracy: supplier.performance.accuracy / 100,
        stockAvailability: supplier.performance.stockAvailability / 100,
        retailerFeedback: (supplier.trustScore - 70) / 30, // Convert 70-100 to 0-1
        priceCompetitiveness: 0.8 + (Math.random() * 0.2) // Simulated
    };
    
    return Math.round(
        (metrics.deliveryTimeliness * weights.deliveryTimeliness) +
        (metrics.orderAccuracy * weights.orderAccuracy) +
        (metrics.stockAvailability * weights.stockAvailability) +
        (metrics.retailerFeedback * weights.retailerFeedback) +
        (metrics.priceCompetitiveness * weights.priceCompetitiveness)
    ) * 100;
}

// Profit Alert System
function checkProfitHealth() {
    const lowMarginThreshold = 15; // 15% margin
    const decliningTrendThreshold = -5; // 5% decline
    
    inventory.forEach(item => {
        const margin = calculateMargin(item.purchasePrice, item.sellingPrice);
        const trend = calculateMarginTrend(item.id);
        
        if (margin < lowMarginThreshold) {
            triggerAlert('low_margin', item);
        }
        
        if (trend < decliningTrendThreshold) {
            triggerAlert('declining_margin', item);
        }
    });
}

// Generate reorder suggestions
function generateReorderSuggestions() {
    const suggestions = [];
    const threshold = 0.7; // Reorder threshold
    
    inventory.forEach(item => {
        const score = calculateReorderScore(item);
        if (score > threshold) {
            const suggestedQty = Math.max(
                item.minStock * 2 - item.quantity, 
                Math.ceil(item.salesVelocity * 14) // 2 weeks of sales
            );
            
            suggestions.push({
                product: item.name,
                category: item.category,
                currentStock: item.quantity,
                minStock: item.minStock,
                salesVelocity: item.salesVelocity,
                suggestedQty: suggestedQty,
                urgency: score > 1.5 ? 'High' : score > 1 ? 'Medium' : 'Low',
                supplier: item.supplierName,
                unitCost: item.purchasePrice
            });
        }
    });
    
    // Sort by urgency (highest first)
    return suggestions.sort((a, b) => {
        const urgencyOrder = { High: 3, Medium: 2, Low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
}

// Get low margin items
function getLowMarginItems() {
    const threshold = 15; // 15% margin
    return inventory.filter(item => 
        calculateMargin(item.purchasePrice, item.sellingPrice) < threshold
    );
}

// Get expiring items
function getExpiringItems() {
    return inventory.filter(item => {
        const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
        return daysUntilExpiry <= 7;
    });
}

// Get low stock items
function getLowStockItems() {
    return inventory.filter(item => item.quantity < item.minStock);
}

// Get top performing category
function getTopPerformingCategory() {
    const categorySales = {};
    
    inventory.forEach(item => {
        if (!categorySales[item.category]) {
            categorySales[item.category] = 0;
        }
        categorySales[item.category] += item.salesVelocity * item.sellingPrice;
    });
    
    let topCategory = null;
    let maxSales = 0;
    
    for (const category in categorySales) {
        if (categorySales[category] > maxSales) {
            maxSales = categorySales[category];
            topCategory = {
                category: category,
                sales: categorySales[category]
            };
        }
    }
    
    return topCategory;
}

// Calculate profit trend
function calculateProfitTrend() {
    // Simulated profit data for last 3 months
    const profits = [125000, 132000, 124500]; // Last 3 months
    const currentMonth = 118000; // Current month
    
    if (profits.length < 2) return 0;
    
    const lastMonthProfit = profits[profits.length - 1];
    const change = ((currentMonth - lastMonthProfit) / lastMonthProfit) * 100;
    return parseFloat(change.toFixed(1));
}

// Get supplier for negotiation
function getSupplierForNegotiation() {
    // Find suppliers with recent price increases
    return suppliers.find(supplier => {
        // Simulated: 30% chance a supplier has increased prices
        return Math.random() > 0.7;
    });
}

// Get slow moving items
function getSlowMovingItems() {
    const threshold = 0.5; // Sales velocity threshold
    return inventory.filter(item => item.salesVelocity < threshold);
}

// Calculate margin trend for an item
function calculateMarginTrend(productId) {
    // Simulated margin history
    const marginHistory = [18.5, 17.8, 16.2, 15.5]; // Last 4 weeks
    
    if (marginHistory.length < 2) return 0;
    
    const currentMargin = marginHistory[marginHistory.length - 1];
    const lastMargin = marginHistory[marginHistory.length - 2];
    const change = ((currentMargin - lastMargin) / lastMargin) * 100;
    return parseFloat(change.toFixed(1));
}

// Trigger alert for a product
function triggerAlert(alertType, product) {
    // In a real implementation, this would create an alert in the system
    console.log(`Alert: ${alertType} for product ${product.name}`);
}

// Get days until expiry (helper function)
function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// =============================================
// Additional AI functions would go here
// =============================================