import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderStatusComponent } from './order-status/order-status.component';
import { OrderDeliveryComponent } from './order-delivery/order-delivery.component';
import { OrderUnitedStatesComponent } from './order-unitedstates/order-unitedstates.component';
import { OrderCountiesComponent } from './order-counties/order-counties.component';


const routes: Routes = [
  { path: 'counties/:selectedState', component: OrderCountiesComponent },
  { path: 'unitedstates', component: OrderUnitedStatesComponent },
  { path: 'status', component: OrderStatusComponent },
  { path: 'delivery', component: OrderDeliveryComponent },
  { path: '', component: OrderUnitedStatesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
