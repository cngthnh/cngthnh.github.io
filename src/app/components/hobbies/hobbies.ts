import { Component, ViewChild, HostListener } from '@angular/core';
import { NgFor } from '@angular/common';
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiAppearance, TuiHint } from '@taiga-ui/core';
import { NgOptimizedImage } from '@angular/common';
import { HighchartsChartComponent, providePartialHighcharts, HighchartsChartDirective } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import 'highcharts/modules/map';
import * as worldMap from '@highcharts/map-collection/custom/world.geo.json';

// Initialize map module
// map(Highcharts);

@Component({
  selector: 'app-hobbies',
  standalone: true,
  imports: [NgFor, TuiAppearance, TuiCardLarge, NgOptimizedImage, TuiHint, HighchartsChartComponent, HighchartsChartDirective],
  templateUrl: './hobbies.html',
  providers: [providePartialHighcharts({ modules: () => [import('highcharts/esm/modules/map')] })],
  styleUrl: './hobbies.scss',
})
export class Hobbies {
  Highcharts = Highcharts;
  @ViewChild(HighchartsChartDirective) chartDirective?: HighchartsChartDirective;

  visitedCountries = [
    { name: 'USA', code: 'US', frequency: 2 },
    { name: 'Vietnam', code: 'VN', frequency: 10 },
    { name: 'Japan', code: 'JP', frequency: 3 },
    { name: 'United Kingdom', code: 'GB', frequency: 1 },
  ];

  games = [
    { name: 'GTA V', image: 'assets/images/games/gta_v.jpg' },
    { name: 'League of Legends', image: 'assets/images/games/league_of_legends.jpg' },
    { name: 'Party Animals', image: 'assets/images/games/party_animals.jpg' },
  ];

  chartOptions: Highcharts.Options = {
      chart: {
        map: worldMap as any,
        borderRadius: 20,
        backgroundColor: 'rgba(18, 18, 18, 0.8)',
        plotBackgroundColor: 'rgba(18, 18, 18, 0.0)',
      },
      title: {
        text: '',
      },
      mapNavigation: {
        enabled: true,
        buttons: {
            zoomIn: {
                style: {
                  color: '#ff8a00'
                },
            },
            zoomOut: {
                style: {
                  color: '#ff8a00'
                },
            }
        },
        buttonOptions: {
          alignTo: 'spacingBox',
          theme: {
            r: 10,
            fill: 'rgba(255,255,255,0.2)',
            stroke: 'rgba(255,255,255,0.3)',
            states: {
              hover: {
                fill: 'rgba(255,255,255,0.3)',
              },
            }
          },
        },
      },
      legend: {
        enabled: true,
        itemStyle: {
          color: '#ffffff',
        },
      },
      colorAxis: {
        min: 0,
        minColor: '#fff4e6',
        maxColor: '#ff8a00',
        // fallback for missing values
        nullColor: '#ffffff',
        labels: {
          style: {
            color: '#ffffff',
          },
        },
      } as Highcharts.ColorAxisOptions,
      series: [
        {
          name: 'Visited Countries',
          states: {
            hover: {
              color: '#ffb74d',
              borderColor: '#ff69b4',
              borderWidth: 2,
            },
          },
          // Use an orange base color for the map fills when colorAxis isn't applied
          color: '#ff8a00',
          nullColor: '#ffffff',
          borderColor: '#c6c6c6',
          borderWidth: 1,
          dataLabels: {
            enabled: false,
          },
          allAreas: true,
          data: [
            ['vn', 4],
            ['jp', 3],
          ],
        } as Highcharts.SeriesMapOptions,
      ],
      credits: {
        enabled: false
      }
    };

  @HostListener('window:resize')
  onWindowResize(): void {
    try {
      // Ask Highcharts to reflow so the map redraws to the new container size
      if (this.chartDirective && (this.chartDirective as any).chart) {
        const chart = (this.chartDirective as any).chart as Highcharts.Chart;
        if (chart && typeof chart.reflow === 'function') {
          chart.reflow();
        }
      }
    } catch (e) {
      // swallow errors silently; reflow is best-effort
    }
  }
}
