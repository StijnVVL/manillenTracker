import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterLink } from '@angular/router';
import { L10nPipe } from '../../pipes/l10n.pipe';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [RouterLink, L10nPipe],
  templateUrl: './credits.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './credits.component.css'
})
export class CreditsComponent {}
