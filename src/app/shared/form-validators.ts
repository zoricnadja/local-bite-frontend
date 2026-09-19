import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const requiredText: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

export const websiteUrl: ValidatorFn = control => {
  if (!control.value) return null;
  try { const url = new URL(control.value); return ['http:', 'https:'].includes(url.protocol) && !!url.hostname ? null : { url: true }; }
  catch { return { url: true }; }
};

export const dateOrder = (start: string, end: string): ValidatorFn => group => {
  const from = group.get(start)?.value, to = group.get(end)?.value;
  return from && to && to < from ? { dateOrder: end } : null;
};
