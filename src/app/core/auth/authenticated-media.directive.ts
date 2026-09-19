import { Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

/** Fetch private media with the same bearer interceptor as other API requests. */
@Directive({ selector: '[authenticatedMedia]', standalone: true })
export class AuthenticatedMediaDirective implements OnDestroy {
  private http = inject(HttpClient);
  private element = inject<ElementRef<HTMLImageElement | HTMLAnchorElement>>(ElementRef);
  private request?: Subscription;
  private objectUrl?: string;
  @Input() set authenticatedMedia(url: string) {
    this.release();
    const element = this.element.nativeElement;
    const attribute = element.tagName === 'IMG' ? 'src' : 'href';
    element.removeAttribute(attribute);
    if (url) this.request = this.http.get(url, { responseType: 'blob' }).subscribe({
      next: blob => { this.objectUrl = URL.createObjectURL(blob); element.setAttribute(attribute, this.objectUrl); },
      error: () => element.removeAttribute(attribute),
    });
  }
  private release(): void { this.request?.unsubscribe(); if (this.objectUrl) URL.revokeObjectURL(this.objectUrl); this.objectUrl = undefined; }
  ngOnDestroy(): void { this.release(); }
}
