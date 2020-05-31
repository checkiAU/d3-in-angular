import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class DrillDownService  {

  public x = 0;
  public y = 0;
  public scale = 0;
  public date;
  public tab;

  constructor() {

  }
}
