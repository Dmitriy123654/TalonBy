import { Component, OnInit } from '@angular/core';
import { AuthService } from '../login/auth.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent implements OnInit {
  userRoles: string[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRoles = this.authService.getRoles() || [];
  }

  // Дополнительная логика для отображения информации в зависимости от ролей пользователя на главной странице.
}
