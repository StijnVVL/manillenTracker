import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';
import { MATCHUP_ALGORITHMS, type MatchupAlgorithm } from '../../logic/matchup-algorithm';

@Component({
  selector: 'app-algorithm-selector',
  standalone: true,
  imports: [L10nPipe, ClickOutsideDirective, SvgIconComponent],
  templateUrl: './algorithm-selector.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './algorithm-selector.component.css',
})
export class AlgorithmSelectorComponent {
  @Input() selectedId: string = MATCHUP_ALGORITHMS[0].id;
  @Input() disabled: boolean = false;
  @Output() selectedIdChange = new EventEmitter<string>();

  readonly algorithms: MatchupAlgorithm[] = MATCHUP_ALGORITHMS;
  isOpen = false;

  get currentAlgorithm(): MatchupAlgorithm | undefined {
    return this.algorithms.find(a => a.id === this.selectedId);
  }

  toggleDropdown(): void {
    if (!this.disabled) this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  select(algo: MatchupAlgorithm): void {
    this.selectedIdChange.emit(algo.id);
    this.isOpen = false;
  }
}
