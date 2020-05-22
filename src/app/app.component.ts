import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ChartControlsService } from './chart-controls.service';
import { trigger, transition, query, style, animate } from '@angular/animations';

 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [trigger('fadeAnimation', [

    transition('* => *', [

      query(':enter',
        [
          style({ opacity: 0 })
        ],
        { optional: true }
      ),

      query(':leave',
        [
          style({ opacity: 1 }),
          animate('0.2s', style({ opacity: 0 }))
        ],
        { optional: true }
      ),

      query(':enter',
        [
          style({ opacity: 0 }),
          animate('0.2s', style({ opacity: 1 }))
        ],
        { optional: true }
      )

    ])

  ])]
})
export class AppComponent implements OnInit {
  title = 'Using d3 within Angular 8';
 
  constructor(
    private router: Router,
    private ngZone: NgZone,
    public chartControlsService: ChartControlsService) { }

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

}
