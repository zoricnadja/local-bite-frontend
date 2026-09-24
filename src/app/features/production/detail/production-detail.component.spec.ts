import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { ProductionDetailComponent } from './production-detail.component';
import { ProductionService } from '../../../core/services/production.service';
import { RawMaterialsService } from '../../../core/services/raw-materials.service';
import { ProductionBatch, ProcessStep } from '../../../shared/models/production.models';

describe('Production step workflow', () => {
  let component: ProductionDetailComponent;
  const service = { updateStep: vi.fn() };
  const batch = (statuses: ProcessStep['status'][]): ProductionBatch => ({
    id: 'batch', farm_id: 'farm', name: 'Batch', status: 'IN_PROGRESS',
    start_date: null, end_date: null, notes: null, created_at: '', updated_at: '',
    outputs: [], raw_materials: [],
    steps: statuses.map((status, i) => ({ id: `${i}`, step_order: i + 1, status, name: `Step ${i}`, description: null, variables: [] })),
  });
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [FormBuilder,
      { provide: ProductionService, useValue: service },
      { provide: RawMaterialsService, useValue: {} },
      { provide: ActivatedRoute, useValue: {} },
      { provide: Router, useValue: {} },
    ] });
    component = TestBed.runInInjectionContext(() => new ProductionDetailComponent());
  });

  it('allows completion only for a non-empty set of completed steps', () => {
    for (const statuses of [[], ['PLANNED'], ['COMPLETED', 'IN_PROGRESS'], ['COMPLETED', 'PLANNED']] as ProcessStep['status'][][]) {
      component.batch.set(batch(statuses));
      expect(component.canComplete()).toBe(false);
    }
    component.batch.set(batch(['COMPLETED', 'COMPLETED']));
    expect(component.canComplete()).toBe(true);
  });

  it('starts the selected step and reloads the batch to show its automatic status change', () => {
    const data = batch(['PLANNED']);
    data.status = 'PLANNED';
    component.batch.set(data);
    expect(component.nextStatuses()).not.toContain('IN_PROGRESS');
    service.updateStep.mockReturnValue(of({ data: {} }));
    const reload = vi.spyOn(component, 'load').mockImplementation(() => {});
    component.advanceStep(data.steps[0]);
    expect(service.updateStep).toHaveBeenCalledWith('', '0', { status: 'IN_PROGRESS' });
    expect(reload).toHaveBeenCalledOnce();
    expect(component.stepSaving()).toBe(false);
  });
});
