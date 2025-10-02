import { Injectable, signal, inject } from '@angular/core';
import { DataHubService } from './data-hub.service';
import { Employee } from './hr.service';
import { Client } from './client.service';
import { Router } from '@angular/router';

// A unified user type for the logged-in user
type User = (Employee | Client) & { userType: 'Employee' | 'Client' };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private dataHub = inject(DataHubService);
  // FIX: Explicitly type `router` to resolve a potential type inference issue where it was being treated as 'unknown'.
  private router: Router = inject(Router);
  
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<User | null>(null);

  constructor() {
    // This is a simple check. A real app would use a token from localStorage.
    const loggedInUser = sessionStorage.getItem('currentUser');
    if (loggedInUser) {
        this.currentUser.set(JSON.parse(loggedInUser));
        this.isAuthenticated.set(true);
    }
  }

  // Simulates a login request
  async login(username: string, password: string): Promise<boolean> {
    // In a real app, this would be an HTTP call to the backend.
    // The password check is simplified for this demo.
    
    const employees = this.dataHub.hr.employees();
    const clients = this.dataHub.clients.clients();
    
    const employeeUser = employees.find(e => String(e.id) === username);
    if (employeeUser) {
      // Mock password check
      if (password === 'password123') { 
        const user: User = { ...employeeUser, userType: 'Employee' };
        this.setCurrentUser(user);
        return true;
      }
    }
    
    const clientUser = clients.find(c => c.username === username);
    if (clientUser) {
        // Mock password check for clients with portal access
        if (clientUser.loginEnabled && password === 'password123') {
            const user: User = { ...clientUser, userType: 'Client', name: clientUser.nameAr, role: clientUser.classification };
            this.setCurrentUser(user);
            return true;
        }
    }
    
    return false;
  }
  
  private setCurrentUser(user: User) {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  }

  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    sessionStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}