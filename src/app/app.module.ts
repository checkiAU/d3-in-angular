import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UnitedStatesComponent } from './unitedstates/unitedstates.component';
import { CountiesComponent } from './counties/counties.component';

import { UnitedStatesMapComponent} from './unitedstates-map/unitedstates-map.component'
import { CountiesMapComponent } from './counties-map/counties-map.component';
 
import { DrillDownService } from './shared/drilldown.services';
import { ButtonsModule } from '@progress/kendo-angular-buttons';


@NgModule({
  declarations: [
    AppComponent,
    UnitedStatesComponent,
    UnitedStatesMapComponent,
    CountiesComponent,
    CountiesMapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ButtonsModule   
  ],
  providers: [DrillDownService],
  bootstrap: [AppComponent]
})
export class AppModule { }
