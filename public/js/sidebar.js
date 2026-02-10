// Sidebar functionality
class Sidebar {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.toggleButton = document.getElementById('sidebar-toggle');
    this.init();
  }

  init() {
    // Add event listener to toggle button
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => {
        this.toggle();
      });
    }

    // Check if sidebar should be collapsed based on localStorage
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
      this.collapse();
    }
  }

  toggle() {
    this.sidebar.classList.toggle('collapsed');
    const isCollapsed = this.sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  }

  collapse() {
    this.sidebar.classList.add('collapsed');
    localStorage.setItem('sidebarCollapsed', 'true');
  }

  expand() {
    this.sidebar.classList.remove('collapsed');
    localStorage.setItem('sidebarCollapsed', 'false');
  }
}

// Initialize sidebar when DOM is loaded
// Auto-initialization removed to prevent duplicate instances
// document.addEventListener('DOMContentLoaded', () => {
//   new Sidebar();
// });

export { Sidebar };