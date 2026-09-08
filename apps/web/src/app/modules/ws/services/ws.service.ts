import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { wsOpen } from '../ws.actions';
import { optimize } from '@tapiz/board-commons';
import { Router } from '@angular/router';
import customParser from 'socket.io-msgpack-parser';
import { NotificationService } from '../../../shared/notification/notification.service';
import { ConfigService } from '../../../services/config.service';

import { io } from 'socket.io-client';
import { v4 } from 'uuid';
import { BehaviorSubject, Subject } from 'rxjs';
import { GlobalStore } from '../../../+state/global.store';

@Injectable({
  providedIn: 'root',
})
export class WsService {
  #store = inject(Store);
  #configService = inject(ConfigService);
  #pool: unknown[] = [];
  #notificationService = inject(NotificationService);
  #router = inject(Router);
  // An empty WS_URL means "same origin": connect back to whatever host serves
  // the app (localhost locally, the LAN IP in prod) through the nginx proxy.
  #socket = io(this.#configService.config.WS_URL || location.origin, {
    autoConnect: false,
    withCredentials: true,
    // Start with HTTP long-polling (plain HTTP, always allowed) and upgrade to
    // WebSocket when the network permits. Without the polling fallback, users
    // behind a proxy/EDR/firewall that resets WebSocket upgrades (common on
    // corporate VPNs) can't open any board.
    transports: ['polling', 'websocket'],
    parser: customParser,
  });
  correlationId = v4();
  #reconnect = new Subject<void>();
  #connected = new BehaviorSubject<boolean>(false);
  #globalStore = inject(GlobalStore);

  readonly connected$ = this.#connected.asObservable();
  readonly reconnect$ = this.#reconnect.asObservable();

  constructor() {
    this.#poolLoop();
  }

  getSocket() {
    return this.#socket;
  }

  listen() {
    if (this.#configService.config.DEMO) {
      return;
    }

    this.#socket.connect();

    this.#socket.on('connect', () => {
      if (this.#connected.value) {
        this.#reconnect.next();
      }

      this.#store.dispatch(wsOpen());
      this.#connected.next(true);
      this.#socket.emit('correlationId', this.correlationId);
      this.#globalStore.setWsConnectionLost(false);
    });

    this.#socket.on('disconnect', (reason, details) => {
      if (reason.includes('client')) {
        return;
      }

      if (reason === 'io server disconnect') {
        this.#notificationService.open({
          message: 'Connection lost',
          action: 'Close',
          type: 'error',
          durantion: 3000,
        });

        this.#router.navigate(['/']);
        return;
      }

      this.#globalStore.setWsConnectionLost(true);

      console.log('WS disconnect');
      console.log({ reason, details });
    });

    this.#socket.on(
      'board',
      (
        response: {
          [key in PropertyKey]: unknown;
        }[],
      ) => {
        response.forEach((message) => {
          if (message['type']) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.#store.dispatch(message as any);
          }
        });
      },
    );

    this.#socket.on('error', (type: string) => {
      if (type === 'unauthorized') {
        this.#notificationService.open({
          message: 'Unauthorized',
          action: 'Close',
          type: 'error',
        });

        this.#router.navigate(['/']);
      }
    });
  }

  send(obj: unknown[]) {
    this.#pool.push(...obj);
  }

  close() {
    this.#socket.close();
  }

  leaveBoard() {
    this.#socket.emit('leaveBoard');
  }

  #poolLoop() {
    if (this.#pool.length && this.#socket.connected) {
      const optimizedPool = optimize(this.#pool);
      this.#socket.emit('board', optimizedPool);
      this.#pool = [];
    }

    setTimeout(() => {
      this.#poolLoop();
    }, 1000 / 15);
  }
}
