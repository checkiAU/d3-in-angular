import { Component, OnInit, OnDestroy, AfterContentInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { ViewChild } from '@angular/core';

import { ChartControlsService } from '../chart-controls.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { UnitedStatesMapComponent } from '../unitedstates-map/unitedstates-map.component';

 
@Component({
  selector: 'app-unitedstates',
  templateUrl: './unitedstates.component.html',
  styleUrls: ['./unitedstates.component.scss']
})
export class UnitedStatesComponent implements OnInit, OnDestroy, AfterContentInit {

  @ViewChild('UnitedStatesMapComponent', { static: true }) map: UnitedStatesMapComponent;

 
  chartData: number[] = [];

  displayedColumns = ['legend', 'orderStatus', 'total'];

  refreshInterval;

  constructor(private router: Router, public chartControlsService: ChartControlsService) { 
    this.chartControlsService.fullScreen = false;

  }

  ngOnInit() {
  }

  initialize() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.refreshInterval = setInterval(() => {
      if (document.hasFocus()) {
      }
    }, 1000);

  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  ngAfterContentInit() {
    this.initialize();
  }





  navigateLeft() {
    this.router.navigate(['/delivery']);
  }

  navigateRight() {
    this.router.navigate(['/status']);
  }

  toggleData(event: MatSlideToggleChange) {
    this.chartControlsService.showData = event.checked;
  }
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
