import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Observable } from 'rxjs';
import { AbstractComponent } from './abstract.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
/**
 * @T - get request response
 * @Y - submit request
 */
@Component({
  template: '',
})
export abstract class AbstractNetworkingSignalComponent<T, Y>
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  private destroyRef = inject(DestroyRef);

  protected data = signal<T | undefined>(undefined);
  protected error = signal<string | undefined>(undefined);
  protected shouldGetData: boolean = true;

  constructor() {
    super();
  }

  override ngOnInit(): void {
    this.loading = true;
    super.ngOnInit();

    if (this.shouldGetData) {
      this.getData();
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected getData(): void {
    this.getDataObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.data.set(response);
          this.loading = false;

          if (this.executeGetDataEffects) {
            this.executeGetDataEffects();
          }
        },
        error: (err) => {
          this.loading = false;
          this.error.set(err?.message ?? 'Failed to load data');
        },
      });
  }

  protected submit(): void {
    if (!this.submitDataObservable) {
      throw Error('submitDataObservable is not defined');
    }

    this.submitDataObservable()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log(`response - ${response}`);

          if (this.postSubmitActions) {
            this.postSubmitActions();
          }

          this.back();
        },
        error: (err) => {
          console.error(`Error - ${err}`);
        },
      });
  }

  protected executeGetDataEffects?(): void;

  protected submitDataObservable?(): Observable<Y>;

  protected abstract getDataObservable(): Observable<T>;

  protected postSubmitActions?(): void;
}
