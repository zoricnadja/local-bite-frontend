import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { describe, it, expect } from 'vitest';
import { FieldErrorsDirective } from './field-errors.directive';

@Component({ imports: [ReactiveFormsModule, FieldErrorsDirective], template: `<form [formGroup]="form"><input formControlName="email" /><input formControlName="password" /></form>` })
class FormHost {
  form = new FormGroup({ email: new FormControl('', [Validators.required, Validators.email]), password: new FormControl('', [Validators.required, Validators.minLength(6)]) });
}
describe('Inline field errors', () => {
  it('shows required errors after submit and clears errors when the fields are valid', async () => {
    await TestBed.configureTestingModule({ imports: [FormHost] }).compileComponents();
    const fixture = TestBed.createComponent(FormHost); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeNull();
    fixture.componentInstance.form.markAllAsTouched(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This field is required.');
    fixture.componentInstance.form.setValue({ email: 'wrong', password: 'abc' }); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enter a valid email address.');
    expect(fixture.nativeElement.textContent).toContain('at least 6 characters');
    fixture.componentInstance.form.setValue({ email: 'person@example.com', password: 'abcdef' }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[aria-invalid="true"]').length).toBe(0);
    expect(fixture.nativeElement.textContent).not.toContain('Enter a valid');
  });
});
