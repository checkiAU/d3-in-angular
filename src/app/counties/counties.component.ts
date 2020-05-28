import { Component, OnInit, OnDestroy, AfterContentInit, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

import { ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CountiesMapComponent } from '../counties-map/counties-map.component';


@Component({
  selector: 'app-counties',
  templateUrl: './counties.component.html',
  styleUrls: ['./counties.component.scss']
})
export class CountiesComponent implements OnInit, OnDestroy, AfterContentInit {

  @ViewChild('countiesMap', { static: true }) countiesMap: CountiesMapComponent;
 
  refreshInterval;
  selectedState = "United States";
  metric = "Cases";
  icon = "place";

  private _routerSub = Subscription.EMPTY;

  constructor(public router: Router, public route: ActivatedRoute) { 

    this._routerSub = router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.route.params.subscribe(params => {
        this.selectedState = this.route.snapshot.params['selectedState'];

        this.route.params.subscribe(params => {
          if (this.route.snapshot.params['selectedMetric']) {
            this.metric = this.route.snapshot.params['selectedMetric'];
            switch (this.metric) {
              case "Cases":
                this.icon = "place";
                break;
              case "Deaths":
                this.icon = "warning";
                break;
            }
          }
        });

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
    this.router.navigate(['/unitedstates' + "/" + this.countiesMap.type + "/" + this.countiesMap.scale + "/" + this.countiesMap.metric]);
  }

  navigateRight() {
    this.router.navigate(['/status']);
  }

}

