// Angular core imports.
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Importing components, first "global/common" components.
import { HomeComponent } from './components/home/home.component';
import { AuthComponent } from './components/auth/auth.component';
import { SecurityComponent } from './components/security/security.component';

// Then importing all CRUD components.
[[imports-only-main]]

const routes: Routes = [

  // First common/global routes.
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'security', component: SecurityComponent },

  // Then routes for all CRUD components.
[[routes]]];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
