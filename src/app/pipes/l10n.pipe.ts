import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { L10nService } from '../services/l10n.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'l10n',
  standalone: true,
  pure: false // Impure pipe to react to language changes
})
export class L10nPipe implements PipeTransform, OnDestroy {
  private subscription: Subscription;
  private lastKey: string = '';
  private lastParams: Record<string, string | number> | undefined;
  private lastValue: string = '';
  private lastLanguage: string = '';

  constructor(
    private l10nService: L10nService,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to language changes
    this.subscription = this.l10nService.language$.subscribe(() => {
      // Force re-evaluation on language change
      this.lastLanguage = '';
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Transform a translation key into its localized value.
   * Automatically updates when language changes.
   */
  transform(key: string, params?: Record<string, string | number>): string {
    const currentLang = this.l10nService.currentLanguage;

    // Check if we need to recalculate
    if (key === this.lastKey && 
        currentLang === this.lastLanguage && 
        JSON.stringify(params) === JSON.stringify(this.lastParams)) {
      return this.lastValue;
    }

    this.lastKey = key;
    this.lastParams = params;
    this.lastLanguage = currentLang;
    this.lastValue = this.l10nService.get(key, params);

    return this.lastValue;
  }
}
