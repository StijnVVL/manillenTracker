import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { L10nService, SupportedLanguage, LanguageOption, LANGUAGES } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, L10nPipe],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.css'
})
export class LanguageSelectorComponent {
  languages: LanguageOption[] = LANGUAGES;

  constructor(public l10n: L10nService) {}

  get currentLanguage(): SupportedLanguage {
    return this.l10n.currentLanguage;
  }

  onLanguageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.l10n.setLanguage(select.value as SupportedLanguage);
  }
}
