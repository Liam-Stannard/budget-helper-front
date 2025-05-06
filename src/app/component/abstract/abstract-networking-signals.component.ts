import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  Signal,
} from '@angular/core';
import { Observable } from 'rxjs';
import { AbstractComponent } from './abstract.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransactionApiService } from '../transaction/api/transaction-api.service';
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
  destroyRef = inject(DestroyRef);

  protected data!: Signal<T>;
  protected errror!: Signal<string>;

  constructor() {
    super();
  }

  override ngOnInit(): void {
    this.loading = true;
    this.data = this.getDataSignal();

    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected submit(): void {
    if (!this.submitData) {
      throw Error('submitData is not defined');
    }

    this.submitData()
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

  protected abstract getDataSignal(): Signal<T>;

  protected abstract getErrorSignal(): Signal<string | undefined>;

  protected executeGetDataEffects?(): void;

  protected submitData?(): Observable<Y>;

  protected postSubmitActions?(): void;
}
