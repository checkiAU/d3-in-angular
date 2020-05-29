import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import d3 from 'd3';
import * as statedata from "../data/states-historical.json";
import countydata from "../data/counties-historical.json";
import { filter } from 'rxjs/operators';
import { SortDescriptor, orderBy } from '@progress/kendo-data-query';

@Component({
  selector: 'app-metric-table',
  templateUrl: './metric-table.component.html',
  styleUrls: ['./metric-table.component.scss']
})
export class MetricTableComponent implements OnInit {

 
  covid: any[] = [];

  date = "2020-05-27";
  selectedState;

  public sort: SortDescriptor[] = [{
    field: 'location',
    dir: 'asc'
  }];

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
    this.covid = this.covid.filter(function (d) {
      return d.date === that.date
    });

    this.covid = orderBy(this.covid, this.sort);

    this.covid.forEach((element) => {
      element.dateTime = new Date(element.date);
      if (this.selectedState == 'United States') {
        element.location = element.state;
      }
      else {
        element.location = element.county;
      }
    });
  }

  public sortChange(sort: SortDescriptor[]): void {
    this.sort = sort;
    this.updateSummary();
  }

}
