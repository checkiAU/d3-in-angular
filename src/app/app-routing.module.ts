import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderStatusComponent } from './order-status/order-status.component';
import { OrderDeliveryComponent } from './order-delivery/order-delivery.component';
import { UnitedStatesComponent } from './unitedstates/unitedstates.component';
import { CountiesComponent } from './counties/counties.component';


const routes: Routes = [
  { path: 'counties/:selectedState/:selectedType/:selectedScale', component: CountiesComponent },
  { path: 'unitedstates/:selectedType/:selectedScale', component: UnitedStatesComponent },
  { path: 'status', component: OrderStatusComponent },
  { path: 'delivery', component: OrderDeliveryComponent },
  { path: '', component: UnitedStatesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
