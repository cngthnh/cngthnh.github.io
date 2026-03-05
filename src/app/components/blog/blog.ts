
import { Component, Output, EventEmitter } from '@angular/core';
import { NgFor, AsyncPipe, NgOptimizedImage, NgIf } from '@angular/common';
import { TuiButton, TuiAppearance } from '@taiga-ui/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [NgFor, NgIf, TuiAppearance, TuiCardLarge, TuiButton, HttpClientModule, AsyncPipe, NgOptimizedImage],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class Blog {
  @Output() onPostSelect = new EventEmitter<any>();

  posts: any[] = [];

  constructor(private http: HttpClient) {
    // Load generated index.json from assets
    firstValueFrom(this.http.get<any>('assets/blog/index.json'))
      .then((data) => {
        if (data && Array.isArray(data.posts)) {
          this.posts = data.posts;
        } else if (Array.isArray(data)) {
          this.posts = data;
        }
      })
      .catch((err) => {
        console.error('Failed to load blog index:', err);
      });
  }

  openPost(post: any) {
    console.log('Selected post:', post);
    this.onPostSelect.emit(post);
  }
}
