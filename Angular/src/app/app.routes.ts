import { Routes } from '@angular/router';
import { FullPageComponent } from './examples/full-page/full-page.component';
import { HomeComponent } from './home/home.component';
import { DrawerComponent } from './examples/drawer/drawer.component';
import { PopupComponent } from './examples/popup/popup.component';

export const routes: Routes = [{
    path: '',
    component: HomeComponent,
}, {
    path: 'full-page',
    component: FullPageComponent,
}, {
    path: 'drawer',
    component: DrawerComponent,
}, {
    path: 'popup',
    component: PopupComponent,
}];