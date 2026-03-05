import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-experiences',
  standalone: true,
  imports: [NgFor],
  templateUrl: './experiences.html',
  styleUrl: './experiences.scss',
})
export class Experiences {
  jobs = [
    {
      period: '2025 - Present',
      role: 'Researcher',
      company: 'Social Signal Interaction Group, JAIST',
      description: 'Conducting research on multimodal signal processing and human-computer interaction, with a focus on improving communication technologies.',
    },
    {
      period: '2024 - 2025',
      role: 'Senior Data Engineer',
      company: 'VinSmartFuture (a member of Vingroup), Vietnam',
      description: 'Build and optimize data pipelines for large-scale AI applications.',
    },
    {
      period: '2022 - 2024',
      role: 'Data Engineer',
      company: 'Zalo Group, Vietnam',
      description: 'Developed and maintained data infrastructure to support features in Zalo\'s messaging platform. Focused on data governance and pipeline optimization.',
    },
  ];
}
