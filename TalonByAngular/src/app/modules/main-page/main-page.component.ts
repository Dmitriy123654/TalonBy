import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

interface BlogPost {
  author: string;
  title: string;
  views: number;
  image: string;
  url: string;
}

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {
  searchQuery: string = '';
  blogPosts: BlogPost[] = [
    {
      author: 'Александр Дубовик',
      title: 'Как ретинол возвращает молодость коже',
      views: 4969,
      image: 'https://blog.talon.by/files/articles/retinoid-1416588781a907251e7f7fd47f3fbceb-1ddeb1443decf95cc18ec61b7875489e-thumb-960x960.jpg',
      url: 'retinoidy-molekuly-vashej-molodosti'
    },
    {
      author: 'Анастасия Шунто',
      title: 'Женские проблемы',
      views: 5018,
      image: 'https://blog.talon.by/files/articles/krovotechenie-5ad38d752473f9b7f1bc6cae7b3d4527-7d889d2096c90f7725330cf68a6998f2-thumb-960x960.jpg',
      url: 'eto-ne-menstruaciya'
    },
    {
      author: 'Александр Дубовик',
      title: 'Коварный, опасный и самый ужасный острый панкреатит',
      views: 6483,
      image: 'https://blog.talon.by/files/articles/kovarnyj-opasnyj-i-samyj-uzhasnyj-ostryj-pankreatit-4cbbd2f08fb5ad44fa139f26ea9fa02a-eeb13e5e1fdf6bf9fb022af21737240d-thumb-960x960.jpg',
      url: 'kovarnyj-opasnyj-i-samyj-uzhasnyj-ostryj-pankreatit'
    }
  ];

  mainServices = [
    {
      title: 'Все медучреждения',
      description: 'Прямая запись к врачам в поликлиниках прямо на сайте!',
      icon: 'site-icon-home-medcenters',
      route: '/policlinics',
      type: 'outline'
    },
    {
      title: 'Платные услуги',
      description: 'Запись к врачам государственных и частных медучреждений.',
      icon: 'site-icon-home-paid-services',
      route: '/services',
      type: 'outline'
    },
    {
      title: 'Запись на анализы',
      description: 'Экономьте время при сдаче анализов в «Хеликс» — заказывайте их прямо у нас на сайте.',
      icon: 'site-icon-home-medtests',
      route: '/analyses',
      type: 'fill',
      action: 'Заказать анализы'
    },
    {
      title: 'Поиск лекарств',
      description: 'Поиск лекарств в аптеках Минска, карта с аптеками и инструкции к препаратам.',
      icon: 'site-icon-home-leki',
      route: '/medicines',
      type: 'fill',
      action: 'Найти лекарства'
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  onSearch(): void {
    console.log('Поиск:', this.searchQuery);
  }
}