import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';

import {
  SPONSOR_IMAGE_BASE_PATH,
  SPONSOR_MANIFEST_PATH,
  SPONSOR_CAROUSEL_INTERVAL_SECONDS,
} from '../../data/sponsor-images';

@Component({
  selector: 'app-sponsor-carousel',
  standalone: true,
  imports: [],
  templateUrl: './sponsor-carousel.component.html',
  styleUrl: './sponsor-carousel.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SponsorCarouselComponent implements OnInit, OnDestroy {
  images: string[] = [];
  currentIndex: number = 0;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  async ngOnInit(): Promise<void> {
    const filenames = await this.loadManifest();
    this.images = filenames.map(name => `${SPONSOR_IMAGE_BASE_PATH}${name}`);

    if (this.images.length > 1) {
      this.intervalId = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
      }, SPONSOR_CAROUSEL_INTERVAL_SECONDS * 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async loadManifest(): Promise<string[]> {
    try {
      const response = await fetch(SPONSOR_MANIFEST_PATH, { cache: 'no-cache' });
      if (!response.ok) return [];
      const filenames = await response.json();
      return Array.isArray(filenames) ? filenames : [];
    } catch {
      return [];
    }
  }
}
