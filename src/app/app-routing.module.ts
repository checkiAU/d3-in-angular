import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UnitedStatesComponent } from './unitedstates/unitedstates.component';
import { CountiesComponent } from './counties/counties.component';
import { AboutComponent } from './about/about.component';

const routes: Routes = [
  { path: 'counties/:selectedState/:selectedType/:selectedScale/:selectedMetric/:selectedDate/:selectedTab', component: CountiesComponent },
  { path: 'unitedstates/:selectedType/:selectedScale/:selectedMetric/:selectedDate/:selectedTab', component: UnitedStatesComponent },
  { path: 'about', component: AboutComponent },
  { path: '', component: UnitedStatesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
