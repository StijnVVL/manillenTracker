import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Directive({
  selector: '[modalDialog]',
  standalone: true,
  host: {
    'role': 'dialog',
    'aria-modal': 'true'
  }
})
export class ModalDialogDirective implements OnInit, OnDestroy {
  private inertedElements: HTMLElement[] = [];
  private previouslyFocused: HTMLElement | null = null;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const host = this.elementRef.nativeElement;
    this.previouslyFocused = document.activeElement as HTMLElement | null;

    let node: HTMLElement | null = host;
    while (node && node !== document.body) {
      const parent: HTMLElement | null = node.parentElement;
      if (!parent) break;
      for (const sibling of Array.from(parent.children) as HTMLElement[]) {
        if (sibling !== node && !sibling.inert) {
          sibling.inert = true;
          this.inertedElements.push(sibling);
        }
      }
      node = parent;
    }

    setTimeout(() => {
      if (!host.contains(document.activeElement)) {
        host.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
      }
    });
  }

  ngOnDestroy(): void {
    for (const element of this.inertedElements) {
      element.inert = false;
    }
    this.inertedElements = [];
    if (this.previouslyFocused?.isConnected) {
      this.previouslyFocused.focus();
    }
  }
}
