import { auth } from './auth.js';
import { formatCurrency, formatNumber } from './utils.js';

class AnalyticsManager {
    constructor() {
        this.supabase = auth.supabase;
    }

    /**
     * Perform ABC Analysis based on Stock Value
     * A: Top 80% of total value (Vital)
     * B: Next 15% of total value (Essential)
     * C: Remaining 5% of total value (Auxiliary)
     */
    async getABCAnalysis(selectedDate = null, warehouseName = null) {
        // Query stock data based on date
        // Use the 'total' column directly
        let query = this.supabase.from('inventory_stock').select('item_code, item_name, total, date_stock, warehouse_name');

        if (selectedDate) query = query.eq('date_stock', selectedDate);
        if (warehouseName) query = query.ilike('warehouse_name', warehouseName);

        const { data, error } = await query;
        if (error || !data) {
            console.error('Error fetching ABC data:', error);
            return { A: [], B: [], C: [] };
        }

        // Calculate value per item
        // Use the 'total' column directly as 'value'
        const itemValues = data.map(item => ({
            ...item,
            value: parseFloat(item.total) || 0
        })).sort((a, b) => b.value - a.value); // Sort descending by value

        if (itemValues.length === 0) return { A: [], B: [], C: [] };

        const grandTotal = itemValues.reduce((sum, item) => sum + item.value, 0);

        let runningTotal = 0;
        const result = { A: [], B: [], C: [] };

        itemValues.forEach(item => {
            runningTotal += item.value;
            const percentage = (runningTotal / grandTotal) * 100;

            if (percentage <= 80) {
                result.A.push(item);
            } else if (percentage <= 95) {
                result.B.push(item);
            } else {
                result.C.push(item);
            }
        });

        return result;
    }

    /**
         * Calculate Stock Health & Reorder Recommendations
         * Uses dummy Lead Time and Safety Stock assumptions for academic DSS
         */
    async getStockRecommendations(selectedDate = null, warehouseName = null) {
        // 1. Get current stock based on Selected Date
        // Removed pack_size as it likely causes error if column doesn't exist
        let stockQuery = this.supabase.from('inventory_stock').select('item_code, item_name, stock, unit, warehouse_name, item_group, date_stock');

        if (selectedDate) {
            stockQuery = stockQuery.eq('date_stock', selectedDate);
        }

        if (warehouseName) stockQuery = stockQuery.ilike('warehouse_name', warehouseName);

        const { data: stockData } = await stockQuery;

        // 2. Get usage velocity (from transfers)
        // Filter ONLY transfers FROM the selected warehouse (usage)
        let transferQuery = this.supabase.from('internal_transfer').select('item_code, quantity, document_date, from_warehouse_name');

        let daysInPeriod = 30;
        if (selectedDate) {
            // Calculate Start Date (Selected Date - 30 Days)
            const endDateObj = new Date(selectedDate);
            const startDateObj = new Date(endDateObj);
            startDateObj.setDate(endDateObj.getDate() - 30);

            const startDateStr = startDateObj.toISOString().split('T')[0];
            const endDateStr = selectedDate;

            transferQuery = transferQuery.gte('document_date', startDateStr).lte('document_date', endDateStr);

            // Recalculate actual days just in case (though logic above is roughly 30)
            const diffTime = Math.abs(endDateObj - startDateObj);
            daysInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 30;
        }

        if (warehouseName) {
            transferQuery = transferQuery.ilike('from_warehouse_name', warehouseName);
        }

        const { data: usageData } = await transferQuery;

        const totalUsage = {};
        if (usageData) {
            usageData.forEach(u => {
                const key = u.item_code;
                if (!totalUsage[key]) totalUsage[key] = 0;
                totalUsage[key] += (parseFloat(u.quantity) || 0);
            });
        }

        const recommendations = [];
        stockData.forEach(item => {
            const usage = totalUsage[item.item_code] || 0;
            const velocity = usage / daysInPeriod; // Average usage per day

            // Get Defaults (Hardcoded since no param table)
            const group = item.item_group || 'General';

            const defaultLeadTime = (group.toLowerCase().includes('food')) ? 2 : 3;
            const defaultMultiplier = (group.toLowerCase().includes('food')) ? 1.5 : 2;
            const fastMovingThreshold = 0.5; // Example threshold

            const leadTime = defaultLeadTime;

            // Dynamic Safety Stock Multiplier based on Velocity (Fast/Slow)
            let safetyMultiplier = defaultMultiplier;
            // Simple logic: if fast moving, maybe lower safety stock? Or higher? 
            // Usually fast moving -> more predictable? Let's keep simple defaults.

            const safetyStock = velocity * safetyMultiplier;
            const reorderPoint = (velocity * leadTime) + safetyStock;
            const currentStock = parseFloat(item.stock) || 0;
            const packSize = 1; // Default to 1 as column missing

            // Status Logic
            let status = 'Normal';
            let suggestion = '';
            let orderQty = 0;

            if (velocity === 0 && currentStock > 0 && daysInPeriod >= 30) {
                status = 'Dead Stock';
                suggestion = 'Tidak ada penggunaan akhir-akhir ini. Cek permintaan.';
            } else if (currentStock === 0 && velocity > 0) {
                status = 'Out of Stock';
                // Order Qty Calculation
                let rawOrderQty = (reorderPoint + safetyStock) - currentStock;
                // Ensure min 1 and round up
                if (rawOrderQty > 0) {
                    orderQty = Math.ceil(rawOrderQty / packSize) * packSize;
                    if (orderQty < 1) orderQty = 1;
                }
                suggestion = `Pesan minimal ${orderQty} ${item.unit}`;
            } else if (currentStock <= reorderPoint && velocity > 0) {
                status = 'Critical';
                // Order Qty Calculation
                let rawOrderQty = (reorderPoint + safetyStock) - currentStock;
                if (rawOrderQty > 0) {
                    orderQty = Math.ceil(rawOrderQty / packSize) * packSize;
                    if (orderQty < 1) orderQty = 1;
                }
                suggestion = `Pesan minimal ${orderQty} ${item.unit}`;
            } else if (currentStock > (reorderPoint * 3) && velocity > 0) { // Overstock threshold logic (e.g. > 3x ROP)
                status = 'Overstock';
                suggestion = 'Kurangi pesanan mendatang';
            }

            if (status !== 'Normal') {
                recommendations.push({
                    ...item,
                    velocity: velocity.toFixed(2),
                    reorderPoint: reorderPoint.toFixed(2),
                    status: status,
                    suggestion: suggestion,
                    currentStock: currentStock // Ensure field name matches user request
                });
            }
        });

        return recommendations.sort((a, b) => {
            const priority = { 'Out of Stock': 4, 'Critical': 3, 'Overstock': 2, 'Dead Stock': 1 };
            return (priority[b.status] || 0) - (priority[a.status] || 0);
        });
    }
}


export { AnalyticsManager };
