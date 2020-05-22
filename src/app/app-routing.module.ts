import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderStatusComponent } from './order-status/order-status.component';
import { OrderDeliveryComponent } from './order-delivery/order-delivery.component';
import { FlashMobComponent } from './fm/flash-mob.component';
import { OrderUnitedStatesComponent } from './order-unitedstates/order-unitedstates.component';


const routes: Routes = [

  { path: 'unitedstates', component: OrderUnitedStatesComponent },
  { path: 'status', component: OrderStatusComponent },
  { path: 'delivery', component: OrderDeliveryComponent },
  { path: 'flashmob', component: FlashMobComponent },
  { path: '', component: OrderUnitedStatesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
