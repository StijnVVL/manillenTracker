import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from '../../../assets/icons/icons';

@Component({
  selector: 'app-svg-icon',
  standalone: true,
  template: `<span class="svg-icon" [innerHTML]="svgContent" [attr.aria-hidden]="ariaHidden"></span>`,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .svg-icon { display: inline-flex; }
    .svg-icon ::ng-deep svg { display: block; }
  `],
})
export class SvgIconComponent implements OnChanges {
  @Input() name = '';
  @Input() width: number | string = 24;
  @Input() height: number | string = 24;
  @Input() ariaHidden = 'true';

  svgContent: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    const raw = ICONS[this.name];
    if (!raw) {
      this.svgContent = '';
      return;
    }
    const sized = raw
      .replace(/(<svg[^>]*?)(\swidth="[^"]*")?(\s|>)/, `$1 width="${this.width}"$3`)
      .replace(/(<svg[^>]*?)(\sheight="[^"]*")?(\s|>)/, `$1 height="${this.height}"$3`);
    this.svgContent = this.sanitizer.bypassSecurityTrustHtml(sized);
  }
}
