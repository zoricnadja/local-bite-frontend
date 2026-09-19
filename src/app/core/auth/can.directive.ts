import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from './auth.service';
import { hasPermission, Permission } from './permissions';

@Directive({ selector: '[appCan]', standalone: true })
export class CanDirective {
  readonly appCan = input.required<Permission>();
  private auth = inject(AuthService);
  private template = inject(TemplateRef);
  private container = inject(ViewContainerRef);
  constructor() {
    effect(() => {
      this.container.clear();
      if (hasPermission(this.auth.role(), this.appCan())) this.container.createEmbeddedView(this.template);
    });
  }
}
