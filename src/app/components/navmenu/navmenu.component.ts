import { Component, OnInit, Output, EventEmitter } from '@angular/core';
 
import { Subscription } from 'rxjs';
 import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'nav-menu',
  templateUrl: 'navmenu.component.html',
  styleUrls: ['navmenu.component.css']
})

export class NavMenuComponent implements OnInit {

  public title: string = 'COVID-19';
  public subtitle: string = 'Data Tracker';

  @Output() toggleDrawerEvent = new EventEmitter();
  @Output() signOutEvent = new EventEmitter();


  public expanded = true;
  public userName = "User Name";
  public roleLabel = "Role Label";
  public loginStatus = "Signout";
  public isAuthorized = true;
  public isHome = true;

  constructor( 
    private router: Router) {

    router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    )
      .subscribe(event => {
        switch (this.router.url) {
          case "/":
            {
              this.isHome = true;
              break;
            }
          case "/home":
            {
              this.isHome = true;
              break;
            }
          default:
            {
              this.isHome = true;
              break;
            }
        }
        console.log(this.router.url);  
      });

  }

  toggleDrawer() {
    this.expanded = !this.expanded;
    this.toggleDrawerEvent.emit()
  }
 
  ngOnInit() {

 
  }

  login() {
    this.isAuthorized = true;
  }

  signOut() {
    this.isAuthorized = false;
    this.signOutEvent.emit();
  }

}
