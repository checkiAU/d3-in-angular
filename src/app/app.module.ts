import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatMenuModule} from '@angular/material/menu';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { OrderStatusComponent } from './order-status/order-status.component';
import { UnitedStatesComponent } from './unitedstates/unitedstates.component';
import { CountiesComponent } from './counties/counties.component';

import { DonutChartComponent } from './donut-chart/donut-chart.component';
import { OrderDeliveryComponent } from './order-delivery/order-delivery.component';
import { AreaChartComponent } from './area-chart/area-chart.component';
import { UnitedStatesMapComponent} from './unitedstates-map/unitedstates-map.component'
import { CountiesMapComponent } from './counties-map/counties-map.component';
 
import { DrillDownService } from './shared/drilldown.services';
import { ButtonsModule } from '@progress/kendo-angular-buttons';


@NgModule({
  declarations: [
    AppComponent,
    OrderStatusComponent,
    DonutChartComponent,
    OrderDeliveryComponent,
    AreaChartComponent,
    UnitedStatesComponent,
    UnitedStatesMapComponent,
    CountiesComponent,
    CountiesMapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatMenuModule,
    MatIconModule,
    MatCardModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatSlideToggleModule,
    ButtonsModule
    
  ],
  providers: [DrillDownService],
  bootstrap: [AppComponent]
})
export class AppModule { }
