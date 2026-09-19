import { Directive, DoCheck, ElementRef, inject, OnDestroy, Renderer2 } from '@angular/core';
import { NgControl } from '@angular/forms';

/** Consistent inline feedback for every reactive input, including dynamically added forms. */
@Directive({ selector: '[formControlName]', standalone: true })
export class FieldErrorsDirective implements DoCheck, OnDestroy {
  private control = inject(NgControl, { self: true });
  private element = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private message: HTMLElement | null = null;
  private static nextId = 0;
  private id = `field-error-${FieldErrorsDirective.nextId++}`;
  ngDoCheck() {
    const c = this.control.control;
    const errors = c?.errors ?? (c?.parent?.errors?.['dateOrder'] === this.control.name ? { dateOrder: true } : null);
    let text = '';
    if (c && (c.touched || c.dirty) && errors) {
      if (errors['required']) text = 'This field is required.';
      else if (errors['email']) text = 'Enter a valid email address.';
      else if (errors['minlength']) text = `Use at least ${errors['minlength'].requiredLength} characters.`;
      else if (errors['maxlength']) text = `Use no more than ${errors['maxlength'].requiredLength} characters.`;
      else if (errors['min']) text = `Enter a value of at least ${errors['min'].min}.`;
      else if (errors['max']) text = `Enter a value no greater than ${errors['max'].max}.`;
      else if (errors['pattern']) text = 'Use the required format.';
      else if (errors['url']) text = 'Enter a valid URL starting with https:// or http://.';
      else if (errors['dateOrder']) text = 'End date must be on or after the start date.';
      else text = 'Enter a valid value.';
    }
    if (!this.message && text) {
      this.message = this.renderer.createElement('div');
      this.renderer.setAttribute(this.message, 'id', this.id);
      this.renderer.setAttribute(this.message, 'aria-live', 'polite');
      this.renderer.addClass(this.message, 'field-error');
      const el = this.element.nativeElement;
      this.renderer.insertBefore(el.parentNode, this.message, el.nextSibling);
      const describedBy = el.getAttribute('aria-describedby');
      this.renderer.setAttribute(el, 'aria-describedby', [describedBy, this.id].filter(Boolean).join(' '));
    }
    if (this.message) {
      this.renderer.setProperty(this.message, 'textContent', text);
      this.renderer.setProperty(this.message, 'hidden', !text);
    }
    this.renderer.setAttribute(this.element.nativeElement, 'aria-invalid', String(!!text));
  }
  ngOnDestroy() { if (this.message?.parentNode) this.renderer.removeChild(this.message.parentNode, this.message); }
}
