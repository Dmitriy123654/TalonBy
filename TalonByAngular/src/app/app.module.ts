import { NgModule } from '@angular/core';
import { StatisticsService } from './core/services/statistics.service';

@NgModule({
  declarations: [
    // ... components
  ],
  imports: [
    // ... modules
  ],
  providers: [
    // ... existing services
    StatisticsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { } 