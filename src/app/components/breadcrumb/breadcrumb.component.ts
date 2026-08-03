import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { L10nService } from '../../services/l10n.service';
import { TournamentService } from '../../services/tournament.service';

export type PageType = 'play' | 'scoring' | 'round-winner';

interface PageOption {
  key: PageType;
  labelKey: string;
  route: string;
}

type BreadcrumbMode = 'home' | 'tournament' | 'tournament-sub' | 'tournament-round' | 'other';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, L10nPipe, RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  private routerSub?: Subscription;

  currentUrl: string = '';
  roundNumber: number = 1;
  pageType: PageType = 'play';
  showRoundPopup: boolean = false;
  showPagePopup: boolean = false;
  popupX: number = 0;
  popupY: number = 0;
  rounds: number[] = [];

  pageOptions: PageOption[] = [
    { key: 'play', labelKey: 'breadcrumb.matchups', route: 'play' },
    { key: 'scoring', labelKey: 'breadcrumb.scoring', route: 'scoring' },
    { key: 'round-winner', labelKey: 'breadcrumb.roundWinner', route: 'round-winner' },
  ];

  constructor(
    private router: Router,
    public l10n: L10nService,
    private tournamentService: TournamentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.parseUrl(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.parseUrl(e.urlAfterRedirects);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private parseUrl(url: string): void {
    this.currentUrl = url;
    const roundMatch = url.match(/\/tournament\/round\/(\d+)\/(play|scoring|round-winner)/);
    if (roundMatch) {
      this.roundNumber = +roundMatch[1];
      this.pageType = roundMatch[2] as PageType;
      const totalRounds = this.tournamentService.state.totalRounds;
      this.rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
    }
    this.closePopups();
  }

  get mode(): BreadcrumbMode {
    const url = this.currentUrl;
    if (url === '/' || url === '') return 'home';
    if (/\/tournament\/round\/\d+\/(play|scoring|round-winner)/.test(url)) return 'tournament-round';
    if (url === '/tournament') return 'tournament';
    if (url.startsWith('/tournament/')) return 'tournament-sub';
    return 'other';
  }

  get subPageLabelKey(): string {
    const url = this.currentUrl;
    if (url.includes('/setup')) return 'menu.setup';
    if (url.includes('/teams')) return 'menu.teams';
    if (url.includes('/finished')) return 'pageTitle.finished';
    if (url.includes('/credits')) return 'pageTitle.credits';
    if (url.includes('/settings')) return 'pageTitle.settings';
    return '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.breadcrumb')) {
      this.closePopups();
    }
  }

  toggleRoundPopup(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.showRoundPopup) {
      this.popupX = event.clientX;
      this.popupY = event.clientY;
    }
    this.showRoundPopup = !this.showRoundPopup;
    this.showPagePopup = false;
  }

  togglePagePopup(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.showPagePopup) {
      this.popupX = event.clientX;
      this.popupY = event.clientY;
    }
    this.showPagePopup = !this.showPagePopup;
    this.showRoundPopup = false;
  }

  closePopups(): void {
    this.showRoundPopup = false;
    this.showPagePopup = false;
  }

  selectRound(round: number): void {
    this.router.navigate(['/tournament/round', round, this.pageType]);
    this.closePopups();
  }

  selectPage(option: PageOption): void {
    this.router.navigate(['/tournament/round', this.roundNumber, option.route]);
    this.closePopups();
  }

  getPageLabel(): string {
    const option = this.pageOptions.find(o => o.key === this.pageType);
    return option ? this.l10n.get(option.labelKey) : '';
  }
}
