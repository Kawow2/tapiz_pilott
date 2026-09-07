import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppActions } from '../../../../+state/app.actions';
import { UserApiService } from '../../../../services/user-api.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'tapiz-login',
  styleUrls: ['./login.component.scss'],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
})
export class LoginComponent {
  #userApiService = inject(UserApiService);
  #authService = inject(AuthService);
  #store = inject(Store);
  #router = inject(Router);

  loading = signal(false);

  login(name: string) {
    const trimmed = name.trim();

    if (!trimmed || this.loading()) {
      return;
    }

    this.loading.set(true);

    this.#userApiService.login(trimmed).subscribe({
      next: (user) => {
        this.#store.dispatch(AppActions.setUser({ user }));
        this.#authService.setLocalStoreUser(user);

        const url = sessionStorage.getItem('url') ?? '/';
        sessionStorage.removeItem('url');
        this.#router.navigateByUrl(url);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
