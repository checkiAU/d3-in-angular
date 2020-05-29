import { Component, OnInit, Input } from '@angular/core';

import * as d3 from "d3";
import * as statedata from "../data/states-historical.json";
import countydata from "../data/counties-historical.json";
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
 

@Component({
  selector: 'app-metric-summary',
  templateUrl: './metric-summary.component.html',
  styleUrls: ['./metric-summary.component.scss']
})
export class MetricSummaryComponent implements OnInit {

  public baseUnit = 'days';

  covid: any[] = [];
 
  cases;
  deaths;
  date = "2020-05-27";
  selectedState;

  private _routerSub = Subscription.EMPTY;

  constructor(public router: Router,
    public route: ActivatedRoute,
 ) {

    this._routerSub = router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.route.params.subscribe(params => {
          if (this.route.snapshot.params['selectedState']) {
            this.selectedState = this.route.snapshot.params['selectedState'];
          }
          else {
            this.selectedState = 'United States';
          }
          
          if (this.route.snapshot.params['selectedDate']) {
            this.date = this.route.snapshot.params['selectedDate'];
          }

        });
      });
  }

  ngOnInit(): void {
    this.updateSummary();
  }

  public updateSummary() {

    that = this;

    if (this.selectedState == 'United States') {
      this.covid = statedata.states;
    }
    else {
      this.covid = countydata.counties;
      this.covid = this.covid.filter(function (d) {
        return d.state === that.selectedState
      });
    }
    
   
    var that = this;
    var covidSelected = this.covid.filter(function (d) {
      return d.date === that.date
    });

    this.cases = d3.sum(covidSelected, function (d: any) {
      return d.cases;
    });

    this.deaths = d3.sum(covidSelected, function (d: any) {
      return d.deaths;
    });

    this.covid.forEach((element) => {
      element.dateTime = new Date(element.date);
    });
  }

}
