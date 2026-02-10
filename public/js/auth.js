import { supabase } from './supabase.js';

// Authentication helper functions
class AuthManager {
  constructor() {
    this.user = null;
    this.role = null;
    this.supabase = supabase;
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }

    this.user = session.user;
    
    // Get user role from the database
    await this.fetchUserRole();
    
    return true;
  }

  // Fetch user role from the database
  async fetchUserRole() {
    if (!this.user) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', this.user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    this.role = data?.role || 'user';
    return this.role;
  }

  // Get current user role
  getUserRole() {
    return this.role;
  }

  // Check if user is admin
  isAdmin() {
    return this.role === 'admin';
  }

  // Login user
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if it's an API key issue
        if (error.status === 401) {
          throw new Error('Invalid API key. Please update your Supabase URL and ANON_KEY in public/js/supabase.js');
        }
        throw new Error(error.message);
      }

      this.user = data.user;
      await this.fetchUserRole();
      
      return data;
    } catch (err) {
      console.error('Login error details:', err);
      throw err;
    }
  }

  // Logout user
  async logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error logging out:', error);
    }
    
    this.user = null;
    this.role = null;
  }

  // Redirect to login if not authenticated
  async requireAuth(allowedRoles = ['user', 'admin']) {
    // Prevent multiple simultaneous auth checks
    if (this._authCheckInProgress) {
      return false;
    }
    
    this._authCheckInProgress = true;
    
    try {
      const isAuthenticated = await this.isAuthenticated();
      
      if (!isAuthenticated) {
        window.location.href = 'login.html';
        return false;
      }
      
      if (!allowedRoles.includes(this.role)) {
        // Redirect to dashboard if user doesn't have required role
        window.location.href = 'dashboard.html';
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      window.location.href = 'login.html';
      return false;
    } finally {
      this._authCheckInProgress = false;
    }
  }
}

// Create global auth instance
const auth = new AuthManager();

// Export the auth instance
export { auth, AuthManager };