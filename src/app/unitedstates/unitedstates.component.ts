import { Component, OnInit, OnDestroy, AfterContentInit, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { ViewChild } from '@angular/core';

import { UnitedStatesMapComponent } from '../unitedstates-map/unitedstates-map.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MetricSummaryComponent } from '../metric-summary/metric-summary.component';
import { MetricTableComponent } from '../metric-table/metric-table.component';


@Component({
  selector: 'app-unitedstates',
  templateUrl: './unitedstates.component.html',
  styleUrls: ['./unitedstates.component.scss']
})
export class UnitedStatesComponent implements OnInit, OnDestroy, AfterContentInit {

  @ViewChild('unitedStatesMap', { static: true }) unitedStatesMap: UnitedStatesMapComponent;
  @ViewChild('metricSummary', { static: true }) metricSummary: MetricSummaryComponent;
  @ViewChild('metricTable', { static: true }) metricTable: MetricTableComponent;

  private _routerSub = Subscription.EMPTY;
  public metric = "Total Cases";
  public icon = "place";
  constructor(private router: Router, public route: ActivatedRoute) {

    this._routerSub = router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.route.params.subscribe(params => {
        if (this.route.snapshot.params['selectedMetric']) {
          this.metric = this.route.snapshot.params['selectedMetric'];
          switch (this.metric) {
            case "Daily Cases":
              this.icon = "place";
              break;
            case "Total Cases":
              this.icon = "place";
              break;
            case "Daily Deaths":
              this.icon = "warning";
              break;
            case "Total Deaths":
              this.icon = "warning";
              break;
          }
        }
      });
    });

  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  ngAfterContentInit() {
  }

  navigateLeft() {
  }

  navigateRight() {
  }

  dateChanged(date) {
    if (date) {
      this.metricSummary.date = date;
      this.metricSummary.updateSummary();
      this.metricTable.date = date;
      this.metricTable.updateSummary();
    }
  }
}

 
