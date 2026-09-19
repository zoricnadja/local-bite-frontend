import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../shared/models/api.models';
export interface Producer { id:string; name:string; }
@Injectable({providedIn:'root'})
export class ProducerService {
  private http=inject(HttpClient);
  list(){ return this.http.get<ApiResponse<Producer[]>>('/api/queries/producers'); }
}
