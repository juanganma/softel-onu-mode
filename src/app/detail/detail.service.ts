import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DetailService
{
  public output$: BehaviorSubject<string>;

  constructor() 
  { 
    this.output$ = new BehaviorSubject<string>('');
  }

  public clear(): void
  {
    this.output$.next('');
  }

  public append(string: string): void
  {
    this.output$.next(string);
  }
}