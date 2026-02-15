import { supabase } from './supabase.js';
import { formatCurrency, formatNumber } from './utils.js';

// Chart management class
class ChartManager {
  constructor() {
    this.charts = {};
    this.chartOptions = {};
    this.receivingDatasets = [];
    this.currentReceivingIndex = 0;

    // Register the DataLabels plugin
    if (typeof ChartDataLabels !== 'undefined') {
      Chart.register(ChartDataLabels);
    }
  }

  // Common datalabels config
  get defaultDataLabelsConfig() {
    const fontSize = window.innerWidth < 640 ? 9 : 10;
    return {
      anchor: 'end',
      align: 'top',
      display: true,
      font: { weight: 'bold', size: fontSize },
      formatter: (value) => formatNumber(value),
      color: '#4b5563', // gray-600
      clip: true // Don't show if outside the chart area
    };
  }

  // Helper to get date ranges for a month across multiple years
  getMonthRanges(m) {
    if (!m) return null;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const idx = months.indexOf(m);
    if (idx === -1) return null;

    // Support years 2023-2027
    const years = [2023, 2024, 2025, 2026, 2027];
    return years.map(year => {
      const start = `${year}-${String(idx + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, idx + 1, 0).getDate();
      const end = `${year}-${String(idx + 1).padStart(2, '0')}-${lastDay}`;
      return { start, end };
    });
  }

  // Create bar chart for stock per warehouse (inventory_stock)
  async createStockPerOutletChart(selectedDate = null, warehouseName = null) {
    // Query base table directly for accurate daily snapshot
    let dailyQuery = supabase
      .from('inventory_stock')
      .select('stock, item_cost, warehouse_name, date_stock')
      .not('warehouse_name', 'is', null)

    if (selectedDate) {
      dailyQuery = dailyQuery.eq('date_stock', selectedDate);
    }

    if (warehouseName) {
      dailyQuery = dailyQuery.ilike('warehouse_name', warehouseName);
    }

    const { data, error } = await dailyQuery;

    if (error) {
      console.error('Error fetching stock per warehouse data:', error);
      return;
    }

    const groupedData = {};
    if (data) {
      data.forEach(item => {
        const warehouse = item.warehouse_name;
        if (!groupedData[warehouse]) {
          groupedData[warehouse] = 0;
        }
        // Use item_cost instead of price/total_value
        // Handle potential nulls
        groupedData[warehouse] += (parseFloat(item.stock || 0) * parseFloat(item.item_cost || 0));
      });
    }

    // Stable sort: Primary by value (desc), Secondary by name (asc)
    const sortedWarehouses = Object.entries(groupedData)
      .sort((a, b) => {
        const diff = b[1] - a[1];
        if (Math.abs(diff) > 0.001) return diff;
        return a[0].localeCompare(b[0]);
      })
      .slice(0, 5);

    const labels = sortedWarehouses.map(item => item[0]);
    const values = sortedWarehouses.map(item => item[1]);

    if (this.charts.stockPerOutlet) {
      this.charts.stockPerOutlet.destroy();
    }

    const ctx = document.getElementById('stock-per-outlet-chart');
    if (!ctx) return;

    const stockPerOutletOptions = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Stock Value',
          data: values,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: false, text: 'Top 5 Warehouse Stock Value', font: { size: 16 } },
          legend: { display: false },
          datalabels: {
            ...this.defaultDataLabelsConfig,
            formatter: (value) => formatCurrency(value)
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatCurrency(value),
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            },
            grace: '10%'
          },
          x: {
            ticks: {
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            }
          }
        }
      }
    };

    this.charts.stockPerOutlet = new Chart(ctx, stockPerOutletOptions);
    this.chartOptions.stockPerOutlet = stockPerOutletOptions;
  }

  // Create line chart for receiving quantity by date (receiving_daily_summary)
  async createReceivingByDateChart(selectedDate = null, warehouseName = null) {
    let query = supabase
      .from('receiving_daily_summary')
      .select('receiving_date, total_value, unit, warehouse_name')
      .not('receiving_date', 'is', null)
      .order('receiving_date')

    if (selectedDate) {
      // Show trend for 7 days ending on selectedDate for better context than a single point
      const endDateObj = new Date(selectedDate);
      const startDateObj = new Date(endDateObj);
      startDateObj.setDate(endDateObj.getDate() - 7);

      const start = startDateObj.toISOString().split('T')[0];
      const end = selectedDate;

      query = query.gte('receiving_date', start).lte('receiving_date', end);
    }

    if (warehouseName) {
      query = query.ilike('warehouse_name', warehouseName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching receiving by date data:', error);
      return;
    }

    // Group by Date AND Unit (or just Date if we want total value)
    const groupedByDateAndUnit = {};
    const allDatesSet = new Set();
    const allUnitsSet = new Set();

    data.forEach((item) => {
      let dateStr;
      try {
        const dateObj = new Date(item.receiving_date);
        dateStr = dateObj.toISOString().split('T')[0];
      } catch (e) {
        dateStr = String(item.receiving_date).split('T')[0];
      }

      const unit = item.unit || 'Unknown';
      allDatesSet.add(dateStr);
      allUnitsSet.add(unit);

      if (!groupedByDateAndUnit[unit]) {
        groupedByDateAndUnit[unit] = {};
      }
      if (!groupedByDateAndUnit[unit][dateStr]) {
        groupedByDateAndUnit[unit][dateStr] = 0;
      }
      groupedByDateAndUnit[unit][dateStr] += parseFloat(item.total_value || 0);
    });

    const dates = Array.from(allDatesSet).sort();
    const units = Array.from(allUnitsSet).sort();

    const colors = [
      'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(255, 99, 132)',
      'rgb(255, 205, 86)', 'rgb(153, 102, 255)'
    ];

    const datasets = units.map((unit, index) => {
      const unitData = dates.map(date => groupedByDateAndUnit[unit]?.[date] || 0);
      const color = colors[index % colors.length];
      return {
        label: `Value (${unit})`,
        data: unitData,
        fill: true,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        borderColor: color,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    if (this.charts.receivingByDate) {
      this.charts.receivingByDate.destroy();
    }

    const ctx = document.getElementById('receiving-by-date-chart');
    if (!ctx) return;

    const receivingByDateOptions = {
      type: 'line',
      data: {
        labels: dates,
        datasets: datasets.length > 0 ? [datasets[0]] : []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          title: { display: false, text: 'Daily Receiving Value', font: { size: 16 } },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}` }
          },
          datalabels: {
            ...this.defaultDataLabelsConfig,
            formatter: (value) => formatCurrency(value),
            display: (ctx) => ctx.dataset.data.length < 15 // Only show if not too many points
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatCurrency(value),
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            },
            grace: '15%'
          },
          x: {
            ticks: {
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            }
          }
        }
      }
    };

    this.charts.receivingByDate = new Chart(ctx, receivingByDateOptions);
    this.chartOptions.receivingByDate = receivingByDateOptions;

    this.receivingDatasets = datasets;
    this.currentReceivingIndex = 0;
    this.setupReceivingDropdown();
  }

  // Update the line chart to show only one dataset (unit) based on dropdown selection
  updateReceivingChart(index) {
    if (!this.charts.receivingByDate || !this.receivingDatasets || !this.receivingDatasets[index]) return;

    this.currentReceivingIndex = index;
    const selectedDataset = this.receivingDatasets[index];
    this.charts.receivingByDate.data.datasets = [selectedDataset];
    this.charts.receivingByDate.update('none');
  }

  // Setup dropdown for receiving chart unit selection
  setupReceivingDropdown() {
    const selector = document.getElementById('unit-selector');
    if (!selector) return;

    // Clear and re-populate dropdown
    selector.innerHTML = '';
    this.receivingDatasets.forEach((ds, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = ds.label.replace('Value (', '').replace(')', '');
      selector.appendChild(option);
    });

    // Set initial value
    selector.value = this.currentReceivingIndex;

    // Remove existing listeners by replacing the element or using a flag
    if (!selector.dataset.hasListener) {
      selector.addEventListener('change', (e) => {
        this.updateReceivingChart(parseInt(e.target.value));
      });
      selector.dataset.hasListener = "true";
    }

    // Hide if only one unit
    const nav = document.getElementById('receiving-chart-nav');
    if (nav) {
      if (this.receivingDatasets.length <= 1) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
    }

    // Trigger initial render of the first dataset
    this.updateReceivingChart(this.currentReceivingIndex);
  }

  // Create bar chart for transfer value by warehouse (transfer_warehouse_summary)
  async createTransferByWarehouseChart(selectedDate = null, warehouseName = null) {
    let query = supabase
      .from('transfer_warehouse_summary')
      .select('warehouse_name, total_value, unit, document_date')
      .not('warehouse_name', 'is', null)
      .not('document_date', 'is', null)
      .order('document_date')

    if (selectedDate) {
      // Filter by specific date
      query = query.eq('document_date', selectedDate);
    } else {
      // If no date, maybe show latest? 
    }

    if (warehouseName) {
      query = query.ilike('warehouse_name', warehouseName);
    }
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transfer by warehouse data:', error);
      return;
    }

    const groupedData = {};
    data.forEach(item => {
      const warehouse = item.warehouse_name;
      const unit = item.unit || 'Unknown';
      const key = `${warehouse} (${unit})`;

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += parseFloat(item.total_value || 0);
    });

    const sortedWarehouses = Object.entries(groupedData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const labels = sortedWarehouses.map(item => item[0]);
    const values = sortedWarehouses.map(item => item[1]);

    if (this.charts.transferByWarehouse) {
      this.charts.transferByWarehouse.destroy();
    }

    const ctx = document.getElementById('transfer-by-warehouse-chart');
    if (!ctx) return;

    const transferByWarehouseOptions = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Transfer Value',
          data: values,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: false, text: 'Top 10 Transfer Value by Warehouse', font: { size: 16 } },
          datalabels: {
            ...this.defaultDataLabelsConfig,
            formatter: (value) => formatCurrency(value)
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatCurrency(value),
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            },
            grace: '10%'
          },
          x: {
            ticks: {
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            }
          }
        }
      }
    };

    this.charts.transferByWarehouse = new Chart(ctx, transferByWarehouseOptions);
    this.chartOptions.transferByWarehouse = transferByWarehouseOptions;
  }

  // Create bar chart for top 5 suppliers by volume (receiving_supplier_summary)
  async createTopSuppliersChart(selectedDate = null, warehouseName = null) {
    let query = supabase
      .from('receiving_supplier_summary')
      .select('receiving_date, supplier, total_value, unit, warehouse_name')
      .not('supplier', 'is', null)
      .not('receiving_date', 'is', null)
      .order('receiving_date')

    if (selectedDate) {
      query = query.eq('receiving_date', selectedDate);
    }

    if (warehouseName) {
      query = query.ilike('warehouse_name', warehouseName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching top suppliers data:', error);
      return;
    }

    const groupedData = {};
    data.forEach(item => {
      const supplier = item.supplier;
      const unit = item.unit || 'Unknown';
      const key = `${supplier} (${unit})`;

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += parseFloat(item.total_value || 0);
    });

    const sortedSuppliers = Object.entries(groupedData).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const suppliers = sortedSuppliers.map(item => item[0]);
    const values = sortedSuppliers.map(item => item[1]);

    if (this.charts.topSuppliers) {
      this.charts.topSuppliers.destroy();
    }

    const ctx = document.getElementById('top-suppliers-chart');
    if (!ctx) return;

    const topSuppliersOptions = {
      type: 'bar',
      data: {
        labels: suppliers,
        datasets: [{
          label: 'Total Value',
          data: values,
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: { display: false, text: 'Top 5 Suppliers by Value', font: { size: 16 } },
          legend: { display: false },
          datalabels: {
            ...this.defaultDataLabelsConfig,
            anchor: 'end',
            align: 'right',
            formatter: (value) => formatCurrency(value)
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatCurrency(value),
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            },
            grace: '15%'
          },
          y: {
            ticks: {
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            }
          }
        }
      }
    };

    this.charts.topSuppliers = new Chart(ctx, topSuppliersOptions);
    this.chartOptions.topSuppliers = topSuppliersOptions;
  }

  // Create doughnut chart for warehouse utilization
  async createWarehouseUtilizationChart(selectedDate = null, warehouseName = null) {
    // Switch to inventory_stock for date accuracy
    let query = supabase.from('inventory_stock').select('stock, item_cost, warehouse_name, date_stock');

    if (selectedDate) {
      query = query.eq('date_stock', selectedDate);
    }
    if (warehouseName) {
      query = query.ilike('warehouse_name', warehouseName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching warehouse utilization data:', error);
      return;
    }

    const groupedData = {};
    if (data) {
      data.forEach(item => {
        const warehouse = item.warehouse_name;
        if (!groupedData[warehouse]) {
          groupedData[warehouse] = 0;
        }
        // Use item_cost
        groupedData[warehouse] += (parseFloat(item.stock || 0) * parseFloat(item.item_cost || 0));
      });
    }

    const sortedWarehouses = Object.entries(groupedData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const warehouses = sortedWarehouses.map(item => item[0]);
    const values = sortedWarehouses.map(item => item[1]);

    const colors = [
      'rgba(59, 130, 246, 0.8)', 'rgba(34, 197, 94, 0.8)', 'rgba(251, 146, 60, 0.8)',
      'rgba(168, 85, 247, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(14, 165, 233, 0.8)',
      'rgba(132, 204, 22, 0.8)', 'rgba(234, 88, 12, 0.8)', 'rgba(107, 114, 128, 0.8)',
      'rgba(244, 63, 94, 0.8)'
    ];

    if (this.charts.warehouseUtilization) {
      this.charts.warehouseUtilization.destroy();
    }

    const ctx = document.getElementById('warehouse-utilization-chart');
    if (!ctx) return;

    const warehouseUtilizationOptions = {
      type: 'doughnut',
      data: {
        labels: warehouses,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, warehouses.length),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          title: { display: false, text: 'Stock Value Distribution', font: { size: 16 } },
          legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } },
          datalabels: {
            formatter: (value, ctx) => {
              const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / sum) * 100).toFixed(1) + "%";
              return percentage;
            },
            color: '#fff',
            font: { weight: 'bold', size: 11 },
            display: (ctx) => {
              const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
              return (ctx.dataset.data[ctx.dataIndex] / sum) > 0.05; // Only show if > 5%
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.charts.warehouseUtilization = new Chart(ctx, warehouseUtilizationOptions);
    this.chartOptions.warehouseUtilization = warehouseUtilizationOptions;
  }

  // Create bar chart for stock value by warehouse group (inventory_stock)
  async createStockValueBywarehouseChart(selectedDate = null, warehouseName = null) {
    // Switch to inventory_stock for date accuracy
    let query = supabase.from('inventory_stock').select('stock, item_cost, warehouse_name, date_stock');

    if (selectedDate) {
      query = query.eq('date_stock', selectedDate);
    }
    if (warehouseName) {
      query = query.ilike('warehouse_name', warehouseName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stock value by warehouse data:', error);
      return;
    }

    const groupedData = {};
    if (data) {
      data.forEach(item => {
        const warehouse = item.warehouse_name;
        if (!groupedData[warehouse]) {
          groupedData[warehouse] = 0;
        }
        // Use item_cost
        groupedData[warehouse] += (parseFloat(item.stock || 0) * parseFloat(item.item_cost || 0));
      });
    }

    const sortedwarehouse = Object.entries(groupedData).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const labels = sortedwarehouse.map(item => item[0]);
    const values = sortedwarehouse.map(item => item[1]);

    if (this.charts.stockValueBywarehouse) {
      this.charts.stockValueBywarehouse.destroy();
    }

    const ctx = document.getElementById('stock-value-by-warehouse-chart');
    if (!ctx) return;

    const stockValueBywarehouseOptions = {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Stock Value',
          data: values,
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: false, text: 'Top 10 Warehouse Stock Value Detail', font: { size: 16 } },
          legend: { display: false },
          datalabels: {
            ...this.defaultDataLabelsConfig,
            formatter: (value) => formatCurrency(value)
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => formatCurrency(value),
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            },
            grace: '10%'
          },
          x: {
            ticks: {
              font: { size: window.innerWidth < 640 ? 9 : 11 }
            }
          }
        }
      }
    };

    this.charts.stockValueBywarehouse = new Chart(ctx, stockValueBywarehouseOptions);
    this.chartOptions.stockValueBywarehouse = stockValueBywarehouseOptions;
  }

  // Destroy all charts
  destroyAllCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};
  }

  // Update chart data without recreating the chart
  updateChart(chartKey, newData) {
    const chart = this.charts[chartKey];
    if (chart) {
      chart.data.labels = newData.labels;
      chart.data.datasets[0].data = newData.data;
      chart.update('active');
    }
  }
}

// Export ChartManager
export { ChartManager };