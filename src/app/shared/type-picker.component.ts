import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiResponse } from './models/api.models';

@Component({
  selector: 'app-type-picker',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <select class="form-control" [formControl]="control" [attr.aria-label]="label">
      <option value="">{{ loading() ? 'Loading types…' : 'Select type…' }}</option>
      @if (control.value && !types().includes(control.value)) {
        <option [value]="control.value">{{ control.value }}</option>
      }
      @for (type of types(); track type) { <option [value]="type">{{ type }}</option> }
    </select>
    @if (!adding()) {
      <button type="button" class="btn btn-secondary btn-sm" (click)="adding.set(true)">New type</button>
    } @else {
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <input class="form-control" style="flex:1" [formControl]="newName" maxlength="100" aria-label="New type name" placeholder="Type name" (keydown.enter)="$event.preventDefault(); save()" />
        <button type="button" class="btn btn-primary btn-sm" [disabled]="saving() || !newName.value.trim()" (click)="save()">{{ saving() ? 'Saving…' : 'Add type' }}</button>
        <button type="button" class="btn btn-secondary btn-sm" [disabled]="saving()" (click)="adding.set(false)">Cancel</button>
      </div>
    }
    @if (error()) { <p class="error-msg" role="alert">{{ error() }} <button type="button" class="btn btn-secondary btn-sm" (click)="load()">Reload types</button></p> }
  `,
})
export class TypePickerComponent implements OnInit {
  @Input({ required: true }) endpoint!: string;
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() label = 'Type';
  private http = inject(HttpClient);
  types = signal<string[]>([]);
  loading = signal(false);
  saving = signal(false);
  adding = signal(false);
  error = signal('');
  newName = new FormControl('', { nonNullable: true });

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.http.get<ApiResponse<string[]>>(this.endpoint).subscribe({
      next: r => { this.types.set(r.data); this.loading.set(false); },
      error: () => { this.error.set('Could not load types.'); this.loading.set(false); },
    });
  }
  save() {
    const name = this.newName.value.trim();
    if (!name || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.http.post<ApiResponse<string>>(this.endpoint, { name }).subscribe({
      next: r => {
        this.types.update(types => [...new Set([...types, r.data])].sort((a,b) => a.localeCompare(b)));
        this.control.setValue(r.data);
        this.control.markAsDirty();
        this.newName.reset();
        this.adding.set(false);
        this.saving.set(false);
      },
      error: e => { this.error.set(e.error?.error ?? 'Could not save type.'); this.saving.set(false); },
    });
  }
}
