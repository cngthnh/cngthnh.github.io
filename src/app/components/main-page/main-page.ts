import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [],
  templateUrl: './main-page.html',
  styleUrl: './main-page.scss',
})
export class MainPage {
  @Output() onNavigate = new EventEmitter<number>();
}
