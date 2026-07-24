import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { L10nService, SupportedLanguage, LanguageOption, LANGUAGES } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [FormsModule, L10nPipe, ClickOutsideDirective],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.css'
})
export class LanguageSelectorComponent {
  languages: LanguageOption[] = LANGUAGES;
  isOpen = false;

  constructor(public l10n: L10nService) {}

  get currentLanguage(): SupportedLanguage {
    return this.l10n.currentLanguage;
  }

  get currentLanguageOption(): LanguageOption | undefined {
    return this.languages.find(l => l.code === this.currentLanguage);
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  selectLanguage(lang: LanguageOption): void {
    this.l10n.setLanguage(lang.code);
    this.isOpen = false;
  }
}
