import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageTitleService } from '../../services/page-title.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule, RouterLink, L10nPipe],
  templateUrl: './credits.component.html',
  styleUrl: './credits.component.css'
})
export class CreditsComponent implements OnInit, OnDestroy {
  private languageSubscription: Subscription | null = null;

  constructor(
    private pageTitleService: PageTitleService,
    private l10n: L10nService
  ) {}

  ngOnInit(): void {
    this.updatePageTitle();
    this.languageSubscription = this.l10n.language$.subscribe(() => {
      this.updatePageTitle();
    });
  }

  ngOnDestroy(): void {
    this.pageTitleService.clearTitle();
    this.languageSubscription?.unsubscribe();
  }

  private updatePageTitle(): void {
    this.pageTitleService.setTitle(this.l10n.get('pageTitle.credits'));
  }
}
