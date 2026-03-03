import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { AuthService } from './core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  private auth = inject(AuthService);

  readonly isLoggedIn = this.auth.isLoggedIn;
  readonly user       = this.auth.currentUser;

  private readonly NAV: NavItem[] = [
    { label: 'Dashboard',     icon: '📊', route: '/dashboard'     },
    { label: 'Profile',       icon: '👤', route: '/profile'       , roles: ['SystemAdmin', 'FarmOwner', 'Worker', 'Customer']},
    { label: 'Employees',     icon: '👤', route: '/farm/workers'  , roles: ['SystemAdmin', 'FarmOwner']},
    { label: 'Raw Materials', icon: '🌾', route: '/raw-materials' , roles: ['SystemAdmin', 'FarmOwner', 'Worker']},
    { label: 'Production',    icon: '⚙️', route: '/production'    , roles: ['SystemAdmin', 'FarmOwner', 'Worker']},
    { label: 'Products',      icon: '📦', route: '/products'      , roles: ['SystemAdmin', 'FarmOwner', 'Worker', 'Customer']},
    { label: 'Orders',        icon: '🛒', route: '/orders'        , roles: ['SystemAdmin', 'FarmOwner', 'Worker', 'Customer']},
  ];

  readonly visibleNav = computed(() => {
    const role = this.auth.role();
    return this.NAV.filter(item =>
      !item.roles || (role && item.roles.includes(role))
    );
  });

  logout() { this.auth.logout(); }
}
