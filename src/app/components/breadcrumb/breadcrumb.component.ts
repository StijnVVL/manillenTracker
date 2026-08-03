import { Component, Input, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { L10nService } from '../../services/l10n.service';
import { TournamentService } from '../../services/tournament.service';

export type PageType = 'play' | 'scoring' | 'round-winner';

interface PageOption {
  key: PageType;
  labelKey: string;
  route: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, L10nPipe],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent implements OnInit {
  @Input() roundNumber: number = 1;
  @Input() pageType: PageType = 'play';

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
    private tournamentService: TournamentService
  ) {}

  ngOnInit(): void {
    // Get total rounds from tournament state
    const totalRounds = this.tournamentService.state.totalRounds;
    this.rounds = Array.from({ length: totalRounds }, (_, i) => i + 1);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close popups when clicking outside
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
    this.router.navigate(['/tournament/round', round, 'play']);
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
