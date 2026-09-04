import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
  imports: [ReactiveFormsModule, MatButtonModule, NgOptimizedImage],
})
export class LoginComponent {
  #userApiService = inject(UserApiService);
  #authService = inject(AuthService);
  #store = inject(Store);
  #router = inject(Router);

  name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(50)],
  });
  loading = signal(false);

  login() {
    const name = this.name.value.trim();

    if (!name || this.loading()) {
      this.name.markAsTouched();
      return;
    }

    this.loading.set(true);

    this.#userApiService.login(name).subscribe({
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
