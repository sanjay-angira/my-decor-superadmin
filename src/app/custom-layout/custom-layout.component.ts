import { Component, DestroyRef, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { BreakpointObserver } from '@angular/cdk/layout';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { LoginService } from '../core/services/login.service';
import { NavigationService } from '../core/services/navigation.service';
import { AdminMenuSection } from '../../static-data/admin-menu';
import { AuthBrandLogoComponent } from '../pages/auth/shared/auth-brand-logo.component';
import { ThemeToggleComponent } from '../pages/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-custom-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    ButtonModule,
    MenuModule,
    AuthBrandLogoComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './custom-layout.component.html',
  styleUrl: './custom-layout.component.scss',
})
export class CustomLayoutComponent implements OnInit {
  private readonly login = inject(LoginService);
  private readonly navigation = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly bp = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly sections = this.navigation.sections;
  readonly menuLoading = this.navigation.loading;
  readonly navSkeletonRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  readonly displayName = signal(this.login.displayName);
  readonly openTitles = signal<Set<string>>(new Set());
  readonly mobileNavOpen = signal(false);
  readonly desktopNavCollapsed = signal(false);
  readonly profileMenuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', routerLink: ['/admin/profile'] },
    { separator: true },
    { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.logout() },
  ];
  readonly isHandset = toSignal(
    this.bp.observe('(max-width: 767px)').pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  private readonly routeMatchOptions = {
    paths: 'subset' as const,
    queryParams: 'ignored' as const,
    fragment: 'ignored' as const,
    matrixParams: 'ignored' as const,
  };

  /** Keep Category Hierarchy nav active on nested attribute/guideline pages. */
  private readonly routeAliases: Record<string, string[]> = {
    '/admin/category-hierarchy': [
      '/admin/category-hierarchy/attribute-groups',
      '/admin/category-hierarchy/guidelines',
    ],
  };

  constructor() {
    effect(() => {
      const sections = this.sections();
      const searching = this.navigation.searchActive();
      untracked(() => this.syncAccordion(sections, searching));
    });
  }

  ngOnInit(): void {
    this.navigation.load();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.syncAccordion(this.sections(), this.navigation.searchActive()));

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const query = (value || '').trim();
        if (query.length > 3) {
          this.navigation.searchActive.set(true);
          this.navigation.load(query);
          return;
        }
        if (this.navigation.searchActive() || !query.length) {
          this.navigation.searchActive.set(false);
          this.navigation.load();
        }
      });
  }

  isOpen(title: string): boolean {
    return this.openTitles().has(title);
  }

  isSectionActive(section: AdminMenuSection): boolean {
    return this.sectionHasActiveChild(section);
  }

  navLinkActiveOptions(href: string) {
    const normalized = this.normalizeHref(href);
    if (normalized === '/admin/category-hierarchy') {
      return this.routeMatchOptions;
    }
    return { exact: true as const };
  }

  toggleSection(title: string): void {
    this.openTitles.update((current) => {
      if (current.has(title)) {
        const next = new Set(current);
        next.delete(title);
        return next;
      }

      const next = new Set<string>();
      const active = this.findActiveSectionTitle(this.sections());
      if (active) {
        next.add(active);
      }
      next.add(title);
      return next;
    });
  }

  private syncAccordion(sections: AdminMenuSection[], searching: boolean): void {
    if (searching) {
      this.openTitles.set(new Set(sections.filter((section) => section.items.length).map((section) => section.title)));
      return;
    }

    const active = this.findActiveSectionTitle(sections);
    this.openTitles.set(active ? new Set([active]) : new Set());
  }

  private findActiveSectionTitle(sections: AdminMenuSection[]): string | null {
    const match = sections.find((section) => this.sectionHasActiveChild(section));
    return match?.title ?? null;
  }

  private sectionHasActiveChild(section: AdminMenuSection): boolean {
    return section.items.some((item) => this.isNavItemActive(item.href));
  }

  private isNavItemActive(href: string): boolean {
    const normalized = this.normalizeHref(href);
    if (this.router.isActive(normalized, this.routeMatchOptions)) {
      return true;
    }
    const aliases = this.routeAliases[normalized] || [];
    const url = this.router.url.split('?')[0];
    return aliases.some(
      (alias) => url === alias || url.startsWith(`${alias}/`),
    );
  }

  private normalizeHref(href: string): string {
    if (!href) return '';
    const withSlash = href.startsWith('/') ? href : `/${href}`;
    return withSlash.replace(/\/+$/, '') || '/';
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  toggleNavigation(): void {
    if (this.isHandset()) {
      this.mobileNavOpen.update((open) => !open);
      return;
    }

    this.desktopNavCollapsed.update((collapsed) => !collapsed);
  }

  closeMobileNavigation(): void {
    this.mobileNavOpen.set(false);
  }

  primeIcon(icon: string | undefined): string {
    const icons: Record<string, string> = {
      dashboard: 'pi pi-chart-bar',
      home: 'pi pi-home',
      category: 'pi pi-sitemap',
      inventory_2: 'pi pi-box',
      shopping_cart: 'pi pi-shopping-cart',
      people: 'pi pi-users',
      person: 'pi pi-user',
      settings: 'pi pi-cog',
      image: 'pi pi-image',
      article: 'pi pi-file',
      campaign: 'pi pi-megaphone',
      local_offer: 'pi pi-tag',
      rate_review: 'pi pi-star',
      analytics: 'pi pi-chart-line',
      language: 'pi pi-globe',
      contact_support: 'pi pi-question-circle',
      expand_more: 'pi pi-chevron-down',
    };
    return icons[icon || ''] || 'pi pi-folder';
  }

  logout(): void {
    this.login.logout();
  }
}
