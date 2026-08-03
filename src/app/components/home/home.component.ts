import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { L10nPipe } from '../../pipes/l10n.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [L10nPipe, RouterLink],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.component.css',
})
export class HomeComponent {}
