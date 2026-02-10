// Utility functions for formatting and common operations

// Format currency as Indonesian Rupiah
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format number with thousand separators
function formatNumber(num) {
  if (num === null || num === undefined) return '0';

  return new Intl.NumberFormat('id-ID').format(num);
}

// Format date as YYYY-MM-DD
function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Show toast notification
function showToast(message, type = 'info') {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast-notification');
  existingToasts.forEach(toast => toast.remove());

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 max-w-sm ${type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;

  toast.textContent = message;

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Show loading spinner
function showLoading(show = true) {
  const loader = document.getElementById('loading-spinner');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

// Get query parameters
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Set query parameters
function setUrlParameter(key, value) {
  const url = new URL(window.location);
  url.searchParams.set(key, value);
  window.history.replaceState({}, '', url);
}

// Remove query parameters
function removeUrlParameter(key) {
  const url = new URL(window.location);
  url.searchParams.delete(key);
  window.history.replaceState({}, '', url);
}

// Export utility functions
export {
  formatCurrency,
  formatNumber,
  formatDate,
  debounce,
  showToast,
  showLoading,
  getUrlParameter,
  setUrlParameter,
  removeUrlParameter
};