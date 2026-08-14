import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastMessage, ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  readonly toast = inject(ToastService);

  icon(message: ToastMessage): string {
    const icons: Record<ToastMessage['type'], string> = {
      success: '✓',
      error: '!',
      warning: '!',
      info: 'i',
    };

    return icons[message.type];
  }
}
