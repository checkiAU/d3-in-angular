import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UnitedStatesComponent } from './unitedstates/unitedstates.component';
import { CountiesComponent } from './counties/counties.component';

import { UnitedStatesMapComponent} from './unitedstates-map/unitedstates-map.component'
import { CountiesMapComponent } from './counties-map/counties-map.component';
import { NavMenuComponent } from './components/navmenu/navmenu.component';

import { DrillDownService } from './shared/drilldown.services';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { LayoutModule } from '@progress/kendo-angular-layout';
import { RippleModule } from '@progress/kendo-angular-ripple';


@NgModule({
  declarations: [
    AppComponent,
    UnitedStatesComponent,
    UnitedStatesMapComponent,
    CountiesComponent,
    CountiesMapComponent,
    NavMenuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    ButtonsModule,
    LayoutModule,
    RippleModule
  ],
  providers: [DrillDownService],
  bootstrap: [AppComponent]
})
export class AppModule { }
