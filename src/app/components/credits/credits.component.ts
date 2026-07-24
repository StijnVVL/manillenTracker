import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PageTitleService } from '../../services/page-title.service';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './credits.component.html',
  styleUrl: './credits.component.css'
})
export class CreditsComponent implements OnInit, OnDestroy {
  constructor(private pageTitleService: PageTitleService) {}

  ngOnInit(): void {
    this.pageTitleService.setTitle('Credits');
  }

  ngOnDestroy(): void {
    this.pageTitleService.clearTitle();
  }
}
