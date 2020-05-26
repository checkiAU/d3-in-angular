import { Component, OnInit, OnDestroy, AfterContentInit, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { ViewChild } from '@angular/core';

import { DonutChartComponent } from './../donut-chart/donut-chart.component';
import { ChartControlsService } from '../chart-controls.service';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CountiesMapComponent } from '../counties-map/counties-map.component';

export class OrderState {
  state: string;
  stateDisplayValue: string;
  count: number;
}


@Component({
  selector: 'app-counties',
  templateUrl: './counties.component.html',
  styleUrls: ['./counties.component.scss']
})
export class CountiesComponent implements OnInit, OnDestroy, AfterContentInit {

  @ViewChild('countiesMap', { static: true }) countiesMap: CountiesMapComponent;

 
 
 
  refreshInterval;
  selectedState = "United States"; 

  private _routerSub = Subscription.EMPTY;

  constructor(public router: Router, public route: ActivatedRoute, public chartControlsService: ChartControlsService) { 
    this.chartControlsService.fullScreen = false;

    this._routerSub = router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.route.params.subscribe(params => {
        this.selectedState = this.route.snapshot.params['selectedState'];
      });
    });

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
    this.router.navigate(['/unitedstates' + "/" + this.countiesMap.type + "/" + this.countiesMap.scale]);
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
