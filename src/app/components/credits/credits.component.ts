import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { L10nPipe } from '../../pipes/l10n.pipe';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [L10nPipe],
  templateUrl: './credits.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './credits.component.css'
})
export class CreditsComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
