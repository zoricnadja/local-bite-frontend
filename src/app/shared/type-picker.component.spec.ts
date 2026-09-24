import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TypePickerComponent } from './type-picker.component';

describe('Type picker', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TypePickerComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function setup() {
    const fixture = TestBed.createComponent(TypePickerComponent);
    fixture.componentRef.setInput('endpoint', '/types');
    fixture.componentRef.setInput('control', new FormControl('legacy'));
    fixture.detectChanges();
    return fixture;
  }

  it('loads persisted options and selects a new type only after the server saves it', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    http.expectOne('/types').flush({ data: ['meat'] });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('legacy');
    component.newName.setValue(' Custom ');
    component.save();
    expect(component.control.value).toBe('legacy');
    const request = http.expectOne('/types');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Custom' });
    request.flush({ data: 'Custom' });
    expect(component.control.value).toBe('Custom');
    expect(component.types()).toEqual(['Custom', 'meat']);
  });

  it('keeps the current selection and entered name when saving fails', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    http.expectOne('/types').flush({ data: [] });
    component.newName.setValue('Custom');
    component.save();
    http.expectOne('/types').flush({ error: 'Unavailable' }, { status: 503, statusText: 'Unavailable' });
    expect(component.control.value).toBe('legacy');
    expect(component.newName.value).toBe('Custom');
    expect(component.types()).toEqual([]);
    expect(component.saving()).toBe(false);
    expect(component.error()).toBe('Unavailable');
  });
});
