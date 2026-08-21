import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';

export interface SelectDropdownOption {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey?: string;
}

@Component({
  selector: 'app-select-dropdown',
  standalone: true,
  imports: [L10nPipe, ClickOutsideDirective, SvgIconComponent],
  templateUrl: './select-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './select-dropdown.component.css',
})
export class SelectDropdownComponent {
  @Input() options: SelectDropdownOption[] = [];
  @Input() selectedId: string = '';
  @Input() disabled: boolean = false;
  @Output() selectedIdChange = new EventEmitter<string>();

  isOpen = false;

  get currentOption(): SelectDropdownOption | undefined {
    return this.options.find(o => o.id === this.selectedId);
  }

  toggleDropdown(): void {
    if (!this.disabled) this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  select(option: SelectDropdownOption): void {
    this.selectedIdChange.emit(option.id);
    this.isOpen = false;
  }
}
