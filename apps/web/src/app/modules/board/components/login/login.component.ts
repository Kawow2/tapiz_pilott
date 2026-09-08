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

type Mode = 'login' | 'register';

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

  mode = signal<Mode>('login');
  loading = signal(false);
  error = signal('');
  info = signal('');

  setMode(mode: Mode) {
    this.mode.set(mode);
    this.error.set('');
    this.info.set('');
  }

  login(username: string, password: string) {
    const user = username.trim();

    if (!user || !password || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.#userApiService.login({ username: user, password }).subscribe({
      next: (user) => {
        this.#store.dispatch(AppActions.setUser({ user }));
        this.#authService.setLocalStoreUser(user);

        const url = sessionStorage.getItem('url') ?? '/';
        sessionStorage.removeItem('url');
        this.#router.navigateByUrl(url);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Nom d'utilisateur ou mot de passe incorrect.");
      },
    });
  }

  register(username: string, password: string) {
    const user = username.trim();

    if (this.loading()) {
      return;
    }

    if (user.length < 3) {
      this.error.set("Le nom d'utilisateur doit faire au moins 3 caractères.");
      return;
    }

    if (password.length < 6) {
      this.error.set('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.#userApiService.register({ username: user, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.mode.set('login');
        this.error.set('');
        this.info.set('Compte créé. Connectez-vous.');
      },
      error: (err: { data?: { code?: string } }) => {
        this.loading.set(false);
        this.error.set(
          err?.data?.code === 'CONFLICT'
            ? "Ce nom d'utilisateur est déjà pris."
            : 'La création du compte a échoué, réessayez.',
        );
      },
    });
  }
}
