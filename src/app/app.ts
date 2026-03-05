import { Component, HostListener, signal, computed, ViewChildren, QueryList, ElementRef, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { TuiRoot, TuiHint, TUI_HINT_OPTIONS, TuiButton, TuiIcon } from '@taiga-ui/core';
import { MainPage } from './components/main-page/main-page';
import { Academia } from './components/academia/academia';
import { Experiences } from './components/experiences/experiences';
import { Hobbies } from './components/hobbies/hobbies';
import { Blog } from './components/blog/blog';
import { MarkdownModule } from 'ngx-markdown';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    TuiRoot,
    TuiHint,
    TuiButton,
    TuiIcon,
    MainPage,
    Academia,
    Experiences,
    Hobbies,
    Blog,
    MarkdownModule,
    HttpClientModule,
    NgOptimizedImage,
  ],
  providers: [
    {
      provide: TUI_HINT_OPTIONS,
      useValue: {
        showDelay: 0,
        hideDelay: 0,
      },
    },
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class AppComponent {
  @ViewChildren('sectionElement') sectionElements!: QueryList<ElementRef<HTMLElement>>;

  sections = ['Introduction', 'Academia', 'Experiences', 'Hobbies', 'Blog'];
  currentIndex = signal(0);
  previousIndex = signal(0);
  direction = signal<'forward' | 'backward'>('forward');
  isTransitioning = false;
  isFadingOut = signal(false);
  isEntering = signal(false);
  isSweeping = signal(false);
  isMenuOpen = signal(false);
  selectedPost = signal<any>(null);
  selectedMarkdown = signal<string | null>(null);
  headings = signal<{ id: string; text: string; level: number }[]>([]);
  activeSection = signal<string>('');
  showStickyHeader = signal<boolean>(false);
  isClosingPost = signal<boolean>(false);
  previousScroll = signal<number>(0);

  transformStyle = computed(() => `translateY(-${this.currentIndex() * 100}vh)`);

  constructor(private http: HttpClient) {

    // Scroll lock effect
    effect(() => {
      console.log('Constructor effect - selectedPost now:', this.selectedPost());
      const isPostSelected = !!this.selectedPost();
      if (typeof document !== 'undefined') {
        document.body.style.overflow = isPostSelected ? 'hidden' : '';
      }
    });
    // Capture scroll position when a post is opened
    effect(() => {
      if (this.selectedPost()) {
        this.previousScroll.set(window.scrollY);
      }
    });

    // When a new post is selected, fetch markdown, extract front-matter (cover, tags)
    effect(() => {
      console.log('Selected post changed (constructor effect):', this.selectedPost());
      // Reset sticky header state and ensure overlay starts at top for new posts
      this.showStickyHeader.set(false);
      setTimeout(() => {
        try {
          const overlay = document.querySelector('.overlay-content') as HTMLElement | null;
          if (overlay) overlay.scrollTop = 0;
        } catch (e) {
          // ignore
        }
      }, 0);
      const post = this.selectedPost();
      if (!post) {
        this.selectedMarkdown.set(null);
        return;
      }

      const path = post.path;
      if (!path) {
        this.selectedMarkdown.set(null);
        return;
      }

      this.selectedMarkdown.set(null); // indicate loading / reset
      this.http.get(path, { responseType: 'text' }).subscribe({
        next: (content) => {
          console.log('Markdown fetched for', path);
          // remove BOM if present to ensure front-matter is detected
          content = content.replace(/^\uFEFF/, '');
          // More permissive front-matter detection: match starting --- up to the next --- and strip it
          const fmMatch = content.match(/^---[\s\S]*?---[\r\n]*/);
          if (fmMatch) {
            const yamlBlock = fmMatch[0];
            const yaml = yamlBlock.replace(/^---[\r\n]?|[\r\n]?$|---[\r\n]?/g, '').trim();
            // crude parsing: look for cover: and tags:
            const coverMatch = yaml.match(/cover:\s*(.+)/);
            if (coverMatch) {
              post.coverImage = coverMatch[1].trim().replace(/^['"]|['"]$/g, '');
            }
            const tagsMatch = yaml.match(/tags:\s*\[([^\]]*)\]/);
            if (tagsMatch) {
              const tagList = tagsMatch[1]
                .split(',')
                .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
                .filter(Boolean);
              post.tags = tagList;
            } else {
              const tagsBlockMatch = yaml.match(/tags:\s*\n([\s\S]*)/);
              if (tagsBlockMatch) {
                const block = tagsBlockMatch[1];
                const lines = block
                  .split(/\r?\n/)
                  .map((l) => l.replace(/^[-\s]*/, '').trim())
                  .filter(Boolean);
                if (lines.length) post.tags = lines;
              }
            }

            // strip front-matter from content
            content = content.slice(fmMatch[0].length);
            console.debug('Front-matter extracted for', path, post.coverImage, post.tags);
          }

          // If there's no explicit cover in front-matter but images were added programmatically earlier
          if (!post.coverImage && post.images && post.images.length) {
            post.coverImage = post.images[0];
          }

          // Resolve relative image URLs to be relative to the markdown file
          try {
            const base = path.substring(0, path.lastIndexOf('/') + 1);
            content = content.replace(/!\[([^\]]*)\]\((?!https?:|data:|\/)\s*([^\)\s]+)\s*\)/g, (m, alt, src) => {
              return `![${alt}](${base}${src})`;
            });
          } catch (e) {
            // ignore
          }

          this.selectedMarkdown.set(content);
        },
        error: (err) => {
          console.error('Failed to fetch markdown:', path, err);
          // leave selectedMarkdown as null so template falls back to [src]
          this.selectedMarkdown.set(null);
        }
      });
    });
  }

  // HttpClient is injected via constructor

  ngOnInit() {}

  closePost() {
    this.isClosingPost.set(true);
    setTimeout(() => {
      this.selectedPost.set(null);
      this.showStickyHeader.set(false);
      this.isClosingPost.set(false);
      // Restore previous scroll position after overlay is closed
      window.scrollTo(0, this.previousScroll());
    }, 450); // Match SCSS exit animation duration
  }

  toggleMenu() {
    this.isMenuOpen.update((v) => !v);
  }

  navigateTo(index: number) {
    this.isMenuOpen.set(false);
    this.goToSection(index);
  }

  onMarkdownReady(element: HTMLElement) {
    const headingElements = Array.from(element.querySelectorAll('h1, h2, h3'));
    const parsedHeadings = headingElements.map((el, index) => {
      const id = `heading-${index}`;
      el.id = id;
      return {
        id,
        text: el.textContent || '',
        level: parseInt(el.tagName.substring(1)),
      };
    });
    this.headings.set(parsedHeadings);

    // Initial check for scroll spy
    this.updateActiveSection(element.parentElement?.parentElement as HTMLElement);
  }

  onOverlayScroll(event: Event) {
    const container = event.target as HTMLElement;

    // Show sticky header when title is scrolled past
    const titleElement = container.querySelector('.viewer-title');
    if (titleElement) {
      const titleRect = titleElement.getBoundingClientRect();
      this.showStickyHeader.set(titleRect.bottom < 0);
    }

    this.updateActiveSection(container);
  }

  private updateActiveSection(container: HTMLElement) {
    if (!this.headings().length) return;

    const headingElements = this.headings()
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => !!el);

    let current = '';
    for (const el of headingElements) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= 100) {
        current = el.textContent || '';
      } else {
        break;
      }
    }
    this.activeSection.set(current);
  }

  scrollToHeading(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    // If wheel originated from inside an interactive map/chart, ignore so the
    // map can handle zoom/pan without triggering section navigation.
    const tgt = event.target as HTMLElement | null;
    if (tgt && tgt.closest && tgt.closest('.chart-wrapper, .map-container, .map-card, .highcharts-container')) {
      return;
    }

    if (this.isTransitioning || this.selectedPost()) return;

    // Check if any Taiga UI dialog is open
    const isPopupOpen = !!document.querySelector('tui-dialog');
    if (isPopupOpen) return;

    const currentSection = this.sectionElements.toArray()[this.currentIndex()]?.nativeElement;
    if (!currentSection) return;

    const isAtBottom = currentSection.scrollTop + currentSection.clientHeight >= currentSection.scrollHeight - 2;
    const isAtTop = currentSection.scrollTop <= 2;

    if (event.deltaY > 0 && this.currentIndex() < this.sections.length - 1) {
      if (isAtBottom) {
        if (this.awaitingSecondScroll) {
          this.clearSecondScrollWindow();
          this.scroll(1);
        } else {
          // first swipe: arm window and require another scroll to actually change
          this.armSecondScrollWindow();
        }
      }
    } else if (event.deltaY < 0 && this.currentIndex() > 0) {
      if (isAtTop) {
        if (this.awaitingSecondScroll) {
          this.clearSecondScrollWindow();
          this.scroll(-1);
        } else {
          this.armSecondScrollWindow();
        }
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.isTransitioning || this.selectedPost()) return;

    // Check if any Taiga UI dialog is open
    const isPopupOpen = !!document.querySelector('tui-dialog');
    if (isPopupOpen) return;

    const currentSection = this.sectionElements.toArray()[this.currentIndex()]?.nativeElement;
    if (!currentSection) return;

    const isAtBottom = currentSection.scrollTop + currentSection.clientHeight >= currentSection.scrollHeight - 2;
    const isAtTop = currentSection.scrollTop <= 2;

    if (event.key === 'ArrowDown' && this.currentIndex() < this.sections.length - 1) {
      if (isAtBottom) {
        if (this.awaitingSecondScroll) {
          this.clearSecondScrollWindow();
          this.scroll(1);
        } else {
          this.armSecondScrollWindow();
        }
      }
    } else if (event.key === 'ArrowUp' && this.currentIndex() > 0) {
      if (isAtTop) {
        if (this.awaitingSecondScroll) {
          this.clearSecondScrollWindow();
          this.scroll(-1);
        } else {
          this.armSecondScrollWindow();
        }
      }
    }
  }

  // touch handlers removed to avoid TypeScript errors in this environment

  scroll(delta: number) {
    if (this.isTransitioning || this.isFadingOut() || this.isEntering() || this.scrollCooldown) return;
    this.isTransitioning = true;
    this.previousIndex.set(this.currentIndex());

    // 1. Start Content Fade Out for current page
    this.isFadingOut.set(true);

    // 2. Wait for fade out to finish before starting the sweep
    setTimeout(() => {
      this.isFadingOut.set(false);
      this.isSweeping.set(true); // Start Colored Sweep

      this.direction.set(delta > 0 ? 'forward' : 'backward');
      this.currentIndex.update((val) => val + delta);

      // 3. Start Entering animation for target page as sweep begins
      setTimeout(() => {
        this.isEntering.set(true);
      }, 200);

      // 4. Reset after sweep finishes
      setTimeout(() => {
        this.isSweeping.set(false);
        this.isTransitioning = false;
        this.isEntering.set(false);
        // start short cooldown to avoid multiple rapid navigations
        this.startScrollCooldown();
      }, 1000);
    }, 400);
  }

  goToSection(index: number) {
    if (this.isTransitioning || index === this.currentIndex() || this.isFadingOut() || this.isEntering()) return;
    this.isTransitioning = true;
    this.previousIndex.set(this.currentIndex());

    // 1. Start Content Fade Out
    this.isFadingOut.set(true);

    // 2. Wait for fade out to finish
    setTimeout(() => {
      this.isFadingOut.set(false);
      this.isSweeping.set(true); // Start Colored Sweep

      this.direction.set(index > this.currentIndex() ? 'forward' : 'backward');
      this.currentIndex.set(index);

      // 3. Start Entering animation
      setTimeout(() => {
        this.isEntering.set(true);
      }, 200);

      // 4. Reset after sweep
      setTimeout(() => {
        this.isSweeping.set(false);
        this.isTransitioning = false;
        this.isEntering.set(false);
      }, 1000);
    }, 400);
  }

  getLayerDelay(index: number): number {
    const target = this.currentIndex();
    const prev = this.previousIndex();

    if (index === target) return 0.1; // Reverting to user preferred delay

    // Sort sweepers to ensure they move in a predictable sequence
    let sweepers = [1, 2, 3, 4].filter((i) => i !== target && i !== prev);
    const pos = sweepers.indexOf(index);

    return pos >= 0 ? pos * 0.05 : 0;
  }

  // When user reaches the end/top of a section, require a second scroll action
  // (within a short window) to navigate to the next/previous section. This
  // prevents accidental long-wheel swipes from moving many pages at once.
  private awaitingSecondScroll = false;
  private secondScrollTimer: any = null;
  private scrollCooldown = false;
  private scrollCooldownTimer: any = null;

  private armSecondScrollWindow(timeout = 800) {
    this.awaitingSecondScroll = true;
    if (this.secondScrollTimer) clearTimeout(this.secondScrollTimer);
    this.secondScrollTimer = setTimeout(() => {
      this.awaitingSecondScroll = false;
      this.secondScrollTimer = null;
    }, timeout);
  }

  private clearSecondScrollWindow() {
    this.awaitingSecondScroll = false;
    if (this.secondScrollTimer) {
      clearTimeout(this.secondScrollTimer);
      this.secondScrollTimer = null;
    }
  }

  private startScrollCooldown(ms = 500) {
    this.scrollCooldown = true;
    if (this.scrollCooldownTimer) clearTimeout(this.scrollCooldownTimer);
    this.scrollCooldownTimer = setTimeout(() => {
      this.scrollCooldown = false;
      this.scrollCooldownTimer = null;
    }, ms);
  }
}
