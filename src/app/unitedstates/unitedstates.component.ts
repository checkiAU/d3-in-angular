import { Component, OnInit, OnDestroy, AfterContentInit, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

import { ViewChild } from '@angular/core';

import { UnitedStatesMapComponent } from '../unitedstates-map/unitedstates-map.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-unitedstates',
  templateUrl: './unitedstates.component.html',
  styleUrls: ['./unitedstates.component.scss']
})
export class UnitedStatesComponent implements OnInit, OnDestroy, AfterContentInit {

  @ViewChild('UnitedStatesMapComponent', { static: true }) map: UnitedStatesMapComponent;

  private _routerSub = Subscription.EMPTY;
  public metric = "Cases";
  public icon = "place";
  constructor(private router: Router, public route: ActivatedRoute) {

    this._routerSub = router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
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

}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
