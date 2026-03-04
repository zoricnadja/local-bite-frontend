import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UpdateUserRequest } from '../../shared/models/auth.models';
import {ApiResponse} from "../../shared/models/api.models";

@Injectable({ providedIn: 'root' })
export class UserService {
    private http = inject(HttpClient);
    private readonly BASE = '/api/auth/users';

    update(id: string, req: UpdateUserRequest): Observable<ApiResponse<User>> {
        return this.http.put<ApiResponse<User>>(`${this.BASE}/${id}`, req);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.BASE}/${id}`);
    }
}