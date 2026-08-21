import { Component, ChangeDetectionStrategy } from '@angular/core';
import { L10nPipe } from '../../pipes/l10n.pipe';

interface RuleSection {
  titleKey: string;
  textKey: string;
  bulletKeys: string[];
}

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [L10nPipe],
  templateUrl: './rules.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './rules.component.css'
})
export class RulesComponent {
  sections: RuleSection[] = [
    {
      titleKey: 'rules.section1.title',
      textKey: 'rules.section1.text',
      bulletKeys: ['rules.section1.bullet1', 'rules.section1.bullet2', 'rules.section1.bullet3'],
    },
    {
      titleKey: 'rules.section2.title',
      textKey: 'rules.section2.text',
      bulletKeys: ['rules.section2.bullet1', 'rules.section2.bullet2', 'rules.section2.bullet3'],
    },
    {
      titleKey: 'rules.section3.title',
      textKey: 'rules.section3.text',
      bulletKeys: ['rules.section3.bullet1', 'rules.section3.bullet2'],
    },
  ];
}
