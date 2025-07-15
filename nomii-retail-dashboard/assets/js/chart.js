// assets/js/chart.js
import DataManager from './data-manager.js';

class ChartManager {
    constructor() {
        this.charts = {};
        this.dataManager = dataManager;
    }

    init() {
        this.dataManager.init();
    }

    renderSalesChart(ctx, period = 'monthly') {
        // Sample sales data - in real app, this would come from backend
        const salesData = {
            monthly: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                data: [65000, 59000, 80000, 81000, 56000, 75000, 92000, 98000, 87000, 85000, 92000, 105000]
            },
            quarterly: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                data: [204000, 212000, 277000, 282000]
            },
            yearly: {
                labels: ['2020', '2021', '2022', '2023'],
                data: [820000, 950000, 1120000, 1250000]
            }
        };

        const data = salesData[period] || salesData.monthly;

        if (this.charts.salesChart) {
            this.charts.salesChart.destroy();
        }

        this.charts.salesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Sales (₹)',
                    data: data.data,
                    backgroundColor: 'rgba(67, 97, 238, 0.7)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `₹${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    renderProfitChart(ctx, view = 'category') {
        const inventory = this.dataManager.getInventory();
        
        let labels, data;
        if (view === 'category') {
            // Aggregate profit by category
            const profitByCategory = {};
            inventory.forEach(item => {
                const profit = (item.SellingPrice - item.PurchasePrice) * item.Quantity;
                if (!profitByCategory[item.Category]) {
                    profitByCategory[item.Category] = 0;
                }
                profitByCategory[item.Category] += profit;
            });
            
            labels = Object.keys(profitByCategory);
            data = Object.values(profitByCategory);
        } else {
            // Top 10 profitable products
            const productsWithProfit = inventory.map(item => ({
                name: item.Name,
                profit: (item.SellingPrice - item.PurchasePrice) * item.Quantity
            })).sort((a, b) => b.profit - a.profit).slice(0, 10);
            
            labels = productsWithProfit.map(p => p.name);
            data = productsWithProfit.map(p => p.profit);
        }

        if (this.charts.profitChart) {
            this.charts.profitChart.destroy();
        }

        this.charts.profitChart = new Chart(ctx, {
            type: view === 'category' ? 'pie' : 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Profit (₹)',
                    data: data,
                    backgroundColor: view === 'category' ? [
                        'rgba(67, 97, 238, 0.7)',
                        'rgba(114, 9, 183, 0.7)',
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(249, 65, 68, 0.7)',
                        'rgba(46, 204, 113, 0.7)'
                    ] : 'rgba(67, 97, 238, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: view === 'category' ? 'right' : 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `₹${context.parsed.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: view === 'category' ? undefined : {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    renderInventoryHealthChart(ctx) {
        const inventory = this.dataManager.getInventory();
        
        const stockHealth = {
            critical: 0,
            low: 0,
            healthy: 0,
            overstock: 0
        };
        
        inventory.forEach(item => {
            const ratio = item.Quantity / item.MinStock;
            if (item.Quantity === 0) {
                stockHealth.critical++;
            } else if (ratio < 0.5) {
                stockHealth.critical++;
            } else if (ratio < 1) {
                stockHealth.low++;
            } else if (ratio <= 2) {
                stockHealth.healthy++;
            } else {
                stockHealth.overstock++;
            }
        });

        if (this.charts.inventoryHealthChart) {
            this.charts.inventoryHealthChart.destroy();
        }

        this.charts.inventoryHealthChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Critical Stock', 'Low Stock', 'Healthy Stock', 'Overstock'],
                datasets: [{
                    data: [
                        stockHealth.critical,
                        stockHealth.low,
                        stockHealth.healthy,
                        stockHealth.overstock
                    ],
                    backgroundColor: [
                        'rgba(249, 65, 68, 0.7)',
                        'rgba(241, 196, 15, 0.7)',
                        'rgba(46, 204, 113, 0.7)',
                        'rgba(52, 152, 219, 0.7)'
                    ],
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed} items`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderSupplierPerformanceChart(ctx) {
        const suppliers = this.dataManager.getSuppliers();
        
        // Get top 10 suppliers by TruScore
        const sortedSuppliers = [...suppliers]
            .sort((a, b) => b.TruScore - a.TruScore)
            .slice(0, 10);
        
        const labels = sortedSuppliers.map(s => s.Name);
        const scores = sortedSuppliers.map(s => s.TruScore);
        const deliveryTimes = sortedSuppliers.map(s => s.DeliveryTime);
        const orderAccuracy = sortedSuppliers.map(s => s.OrderAccuracy);

        if (this.charts.supplierPerformanceChart) {
            this.charts.supplierPerformanceChart.destroy();
        }

        this.charts.supplierPerformanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'TruScore',
                        data: scores,
                        backgroundColor: 'rgba(67, 97, 238, 0.7)',
                        borderColor: 'rgba(67, 97, 238, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Delivery Time (days)',
                        data: deliveryTimes,
                        backgroundColor: 'rgba(114, 9, 183, 0.7)',
                        borderColor: 'rgba(114, 9, 183, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Order Accuracy (%)',
                        data: orderAccuracy,
                        backgroundColor: 'rgba(76, 201, 240, 0.7)',
                        borderColor: 'rgba(76, 201, 240, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + (value === 100 ? '' : '%');
                            }
                        }
                    }
                }
            }
        });
    }

    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    }
}

// Create singleton instance
const chartManager = new ChartManager();
export default chartManager;