import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'nl2br'
})
export class Nl2brPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): any {
    if (!value) return value;
    return this.sanitizer.bypassSecurityTrustHtml(value.replace(/\n/g, '<br>'));
  }
} 