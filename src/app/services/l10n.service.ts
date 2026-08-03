import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Import JSON files directly
import enGB from '../../assets/i18n/en-GB.json';
import nlBE from '../../assets/i18n/nl-BE.json';

import {
  LANGUAGES,
  type LanguageOption,
  type SupportedLanguage,
} from '../models/settings.model';
import { SettingsService } from './settings.service';

export type { SupportedLanguage, LanguageOption };
export { LANGUAGES };

@Injectable({
  providedIn: 'root'
})
export class L10nService {
  private translations: Record<SupportedLanguage, Record<string, string>> = {
    'en-GB': enGB as Record<string, string>,
    'nl-BE': nlBE as Record<string, string>,
  };

  private fallbackLanguage: SupportedLanguage = 'en-GB';
  private currentLanguageSubject: BehaviorSubject<SupportedLanguage>;

  /** Observable for language changes */
  language$;

  /** Current language code */
  get currentLanguage(): SupportedLanguage {
    return this.currentLanguageSubject.value;
  }

  constructor(private settingsService: SettingsService) {
    this.currentLanguageSubject = new BehaviorSubject<SupportedLanguage>(settingsService.state.language);
    this.language$ = this.currentLanguageSubject.asObservable();
  }

  /**
   * Set the current language
   */
  setLanguage(language: SupportedLanguage): void {
    this.settingsService.dispatch({ type: 'SET_LANGUAGE', language });
    this.currentLanguageSubject.next(language);
  }

  /**
   * Get a translated string by key.
   * Falls back to en-GB if not found in current language.
   * Shows "NOT TRANSLATED: <key>" if not found in any language.
   * Supports parameter interpolation with {paramName} syntax.
   */
  get(key: string, params?: Record<string, string | number>): string {
    const lang = this.currentLanguage;
    let value = this.translations[lang]?.[key];

    // Fallback to default language if not found
    if (value === undefined && lang !== this.fallbackLanguage) {
      value = this.translations[this.fallbackLanguage]?.[key];
    }

    // Still not found - return error message
    if (value === undefined) {
      return `NOT TRANSLATED: ${key}`;
    }

    // Interpolate parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }

    return value;
  }

  /**
   * Check if a translation key exists in current or fallback language
   */
  has(key: string): boolean {
    const lang = this.currentLanguage;
    return this.translations[lang]?.[key] !== undefined ||
           this.translations[this.fallbackLanguage]?.[key] !== undefined;
  }

  /**
   * Get available languages
   */
  getLanguages(): LanguageOption[] {
    return LANGUAGES;
  }
}
