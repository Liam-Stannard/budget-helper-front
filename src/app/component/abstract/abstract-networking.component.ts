import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
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
export abstract class AbstractNetworkingComponent<T, Y>
  extends AbstractComponent
  implements OnInit, OnDestroy
{
  destroyRef = inject(DestroyRef);

  protected getResponse!: T;
  protected getApi$!: Observable<T>;
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
    this.getApi$ = this.getDataObservable();

    this.getApi$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.getResponse = response;

        if (this.executeGetDataEffects) {
          this.executeGetDataEffects();
        }
        console.log(this.getResponse);

        this.loading = false;
      },
    });
  }

  protected submit(): void {
    if (!this.submitDataObservable) {
      throw Error('submitData is not defined');
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
