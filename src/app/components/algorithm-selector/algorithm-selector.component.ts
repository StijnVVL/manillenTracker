import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';
import { EXCLUSION_PICKERS } from '../../logic/matchup-algorithm';

export interface AlgorithmOption {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
}

@Component({
  selector: 'app-algorithm-selector',
  standalone: true,
  imports: [L10nPipe, ClickOutsideDirective, SvgIconComponent],
  templateUrl: './algorithm-selector.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './algorithm-selector.component.css',
})
export class AlgorithmSelectorComponent {
  @Input() options: AlgorithmOption[] = EXCLUSION_PICKERS;
  @Input() selectedId: string = EXCLUSION_PICKERS[0].id;
  @Input() disabled: boolean = false;
  @Output() selectedIdChange = new EventEmitter<string>();

  isOpen = false;

  get currentOption(): AlgorithmOption | undefined {
    return this.options.find(o => o.id === this.selectedId);
  }

  toggleDropdown(): void {
    if (!this.disabled) this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  select(option: AlgorithmOption): void {
    this.selectedIdChange.emit(option.id);
    this.isOpen = false;
  }
}
