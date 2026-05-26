import { Component, OnInit } from '@angular/core';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiAppearance } from '@taiga-ui/core';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

interface Publication {
  title: string;
  venue?: string;
  year?: string;
  url?: string;
}

@Component({
  selector: 'app-academia',
  standalone: true,
  imports: [CommonModule, HttpClientModule, TuiAppearance, TuiCardLarge, NgOptimizedImage],
  templateUrl: './academia.html',
  styleUrl: './academia.scss',
})
export class Academia implements OnInit {
  orcid = '0009-0009-4565-4853';
  publicationsByYear: Record<string, Publication[]> = {};
  years: string[] = [];
  loading = false;
  error?: string;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadWorks();
  }

  loadWorks(): void {
    this.loading = true;
    const url = `https://pub.orcid.org/v3.0/${this.orcid}/works`;
    const headers = new HttpHeaders({ Accept: 'application/json' });
    this.http.get<any>(url, { headers }).subscribe({
      next: (data) => {
        const pubs = this.parseOrcidWorks(data);
        this.groupByYear(pubs);
        this.loading = false;
      },
      error: (err) => {
        console.error('ORCID fetch error', err);
        this.error = 'Can not load publications from ORCID.';
        this.loading = false;
      },
    });
  }

  parseOrcidWorks(data: any): Publication[] {
    const pubs: Publication[] = [];
    const groups = data?.group || [];
    
    for (const g of groups) {
      const summaries: any[] = g['work-summary'] || [];
      if (summaries.length === 0) continue;
      const bestWs = summaries[0];
  
      const title =
        bestWs?.title?.title?.value ||
        bestWs?.title?.value ||
        g?.['work-title']?.title?.value ||
        'Untitled';
  
      const pubYear =
        bestWs?.['publication-date']?.year?.value ||
        bestWs?.['publication_year']?.value ||
        bestWs?.year?.value ||
        undefined;
  
      const venue = bestWs?.['journal-title']?.value || undefined;
      const url = bestWs?.url?.value || g?.citation?.citation || undefined;
  
      pubs.push({ 
        title: String(title), 
        venue, 
        year: pubYear ? String(pubYear) : undefined, 
        url 
      });
    }
  
    return pubs;
  }

  groupByYear(pubs: Publication[]): void {
    const map: Record<string, Publication[]> = {};
    for (const p of pubs) {
      const y = p.year || 'Unknown';
      if (!map[y]) map[y] = [];
      map[y].push(p);
    }
    const years = Object.keys(map).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return parseInt(b, 10) - parseInt(a, 10);
    });
    this.publicationsByYear = map;
    this.years = years;
  }
}
