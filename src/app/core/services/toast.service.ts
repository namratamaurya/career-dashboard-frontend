import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;

  show(text: string, tone: ToastMessage['tone'] = 'info'): void {
    const id = this.nextId++;
    this.messages.update((messages) => [...messages, { id, text, tone }]);
    window.setTimeout(() => this.dismiss(id), 4200);
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }
}
