// assets/js/data-manager.js
const XLSX = window.XLSX;

class DataManager {
    constructor() {
        this.inventoryData = [];
        this.suppliersData = [];
        this.ordersData = [];
        this.invoicesData = [];
    }

    async init() {
        await this.loadData();
        this.setupAutoSave();
    }

    async loadData() {
        try {
            // Try loading from localStorage first
            const savedInventory = localStorage.getItem('inventoryData');
            const savedSuppliers = localStorage.getItem('suppliersData');
            
            if (savedInventory && savedSuppliers) {
                this.inventoryData = JSON.parse(savedInventory);
                this.suppliersData = JSON.parse(savedSuppliers);
                return;
            }

            // Load from Excel files if no localStorage data
            await this.loadExcelData();
        } catch (error) {
            console.error('Data loading error:', error);
            this.generateSampleData();
        }
    }

    async loadExcelData() {
        try {
            // Load inventory data
            const inventoryResponse = await fetch('data/inventory.xlsx');
            const inventoryBuffer = await inventoryResponse.arrayBuffer();
            const inventoryWorkbook = XLSX.read(inventoryBuffer, { type: 'array' });
            const inventorySheet = inventoryWorkbook.Sheets[inventoryWorkbook.SheetNames[0]];
            this.inventoryData = XLSX.utils.sheet_to_json(inventorySheet);

            // Load suppliers data
            const suppliersResponse = await fetch('data/suppliers.xlsx');
            const suppliersBuffer = await suppliersResponse.arrayBuffer();
            const suppliersWorkbook = XLSX.read(suppliersBuffer, { type: 'array' });
            const suppliersSheet = suppliersWorkbook.Sheets[suppliersWorkbook.SheetNames[0]];
            this.suppliersData = XLSX.utils.sheet_to_json(suppliersSheet);

            // Save to localStorage
            this.saveToLocalStorage();
        } catch (error) {
            console.error('Excel loading error:', error);
            this.generateSampleData();
        }
    }

    generateSampleData() {
        // Generate sample inventory data
        this.inventoryData = Array.from({ length: 100 }, (_, i) => ({
            ProductID: `PROD${i.toString().padStart(5, '0')}`,
            Name: `Product ${i + 1}`,
            Category: ['Dairy', 'Bakery', 'Beverages', 'Snacks'][i % 4],
            PurchasePrice: (Math.random() * 100 + 10).toFixed(2),
            SellingPrice: (Math.random() * 150 + 15).toFixed(2),
            Quantity: Math.floor(Math.random() * 100),
            MinStock: Math.floor(Math.random() * 10 + 5),
            SalesVelocity: (Math.random() * 10).toFixed(2),
            Margin: (Math.random() * 50).toFixed(1),
            ExpiryDate: new Date(Date.now() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            SupplierID: `SUP${Math.floor(Math.random() * 20).toString().padStart(4, '0')}`,
            LastRestocked: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            DaysUntilExpiry: Math.floor(Math.random() * 365),
            ReorderScore: (Math.random() * 100).toFixed(1)
        }));

        // Generate sample suppliers data
        this.suppliersData = Array.from({ length: 20 }, (_, i) => ({
            SupplierID: `SUP${i.toString().padStart(4, '0')}`,
            Name: `Supplier ${i + 1}`,
            ProductType: ['Dairy', 'Bakery', 'Beverages', 'Snacks'][i % 4],
            Contact: `contact@supplier${i}.com`,
            DeliveryTime: Math.floor(Math.random() * 5 + 1),
            TruScore: Math.floor(Math.random() * 30 + 70),
            PriceIndex: (Math.random() * 0.4 + 0.8).toFixed(2),
            StockAvailability: Math.floor(Math.random() * 15 + 85),
            OrderAccuracy: Math.floor(Math.random() * 10 + 90),
            LastOrderDate: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            Rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            MOQ: [10, 20, 50, 100][Math.floor(Math.random() * 4)],
            Location: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'][i % 4]
        }));

        this.saveToLocalStorage();
    }

    saveToLocalStorage() {
        localStorage.setItem('inventoryData', JSON.stringify(this.inventoryData));
        localStorage.setItem('suppliersData', JSON.stringify(this.suppliersData));
    }

    setupAutoSave() {
        // Auto-save data every 5 minutes
        setInterval(() => {
            this.saveToLocalStorage();
        }, 5 * 60 * 1000);
    }

    getInventory() {
        return this.inventoryData;
    }

    getSuppliers() {
        return this.suppliersData;
    }

    getSupplierById(supplierId) {
        return this.suppliersData.find(s => s.SupplierID === supplierId);
    }

    getProductsBySupplier(supplierId) {
        return this.inventoryData.filter(item => item.SupplierID === supplierId);
    }

    updateInventoryItem(updatedItem) {
        const index = this.inventoryData.findIndex(item => item.ProductID === updatedItem.ProductID);
        if (index !== -1) {
            this.inventoryData[index] = updatedItem;
            this.saveToLocalStorage();
            return true;
        }
        return false;
    }

    addInventoryItem(newItem) {
        // Generate a new ProductID
        const maxId = Math.max(...this.inventoryData.map(item => 
            parseInt(item.ProductID.replace('PROD', ''))
        ));
        newItem.ProductID = `PROD${(maxId + 1).toString().padStart(5, '0')}`;
        
        this.inventoryData.push(newItem);
        this.saveToLocalStorage();
        return newItem;
    }

    exportToExcel(data, fileName, sheetName = 'Sheet1') {
        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, fileName);
            return true;
        } catch (error) {
            console.error('Excel export error:', error);
            return false;
        }
    }

    generateInvoice(invoiceData) {
        // Add to invoice history
        invoiceData.InvoiceID = `INV-${Date.now()}`;
        invoiceData.CreatedAt = new Date().toISOString();
        this.invoicesData.push(invoiceData);
        
        // Save to localStorage
        localStorage.setItem('invoicesData', JSON.stringify(this.invoicesData));
        
        return invoiceData;
    }

    getInvoices() {
        return this.invoicesData;
    }
}

// Create singleton instance
const dataManager = new DataManager();
export default dataManager;