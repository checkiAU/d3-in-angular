import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ChartControlsService } from './chart-controls.service';

//https://stackoverflow.com/questions/38087013/angular2-web-speech-api-voice-recognition
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  webkitAudioContext: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Using d3 within Angular 8';
  flashMob = false;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    public chartControlsService: ChartControlsService) { }

  ngOnInit() {
  }


  navigate(path) {
    this.ngZone.run(() => {
      this.router.navigate([path]);
    });

  }

}
