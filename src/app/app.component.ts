import { Component, OnInit, NgZone, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, query, style, animate } from '@angular/animations';
import { slideInAnimation } from './animation';
import { DrawerSelectEvent } from '@progress/kendo-angular-layout';
import { RouterOutlet } from '@angular/router';
import {
  formatDate
} from '@angular/common';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    slideInAnimation
  ]
})
export class AppComponent implements OnInit {
  public selected;
  public expanded = true;
  public isAuthorized = true;
  public componentReference;

  @ViewChild('drawer') drawer;
  @ViewChild('navmenu') navmenu;

  date = formatDate(new Date().setDate(new Date().getDate() - 1), 'yyyy-MM-dd', 'en');

  public items: Array<any> = [
    { text: 'Cases', icon: 'place', path: '/unitedstates/Filled/Sqrrt/Total Cases/' + this.date  + '/Totals' },
    { text: 'Daily Cases', icon: 'place', path: '/unitedstates/Filled/Sqrrt/Daily Cases/' + this.date + '/Daily' },
    { text: 'Deaths', icon: 'warning', path: '/unitedstates/Filled/Sqrrt/Total Deaths/' + this.date + '/Totals'},
    { text: 'Daily Deaths', icon: 'warning', path: '/unitedstates/Filled/Sqrrt/Daily Deaths/' + this.date + '/Daily' },
    { text: 'About', icon: 'contact_mail', path: '/about' },

  ];

  public onSelect(ev: DrawerSelectEvent): void {
    this.selected = ev.item.text;
  }

  public switchExpanded(): void {
    this.drawer.toggle();
  }

  constructor(
    private router: Router,
    private ngZone: NgZone) { }

  ngOnInit() {
  }

  public getRouterOutletState(outlet) {
    return true;
  }

  navigate(path) {
    this.ngZone.run(() => {
      this.router.navigate([path]);
    });
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  onActivate(componentReference) {
    console.log(componentReference)
    this.componentReference = componentReference;

    //Below will subscribe to the searchItem emitter
    //componentReference.loginEvent.subscribe((data) => {
    //  // Will receive the data from child here
    //  //this.login();
    //  this.navmenu.login();
    //});
  }


}
