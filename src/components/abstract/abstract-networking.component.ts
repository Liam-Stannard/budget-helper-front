import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Observable } from 'rxjs';
import { AbstractComponent } from './abstract.component';
import { ApiService } from '../../services/api/api.service';
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

  protected apiService: ApiService;

  constructor() {
    super();

    this.apiService = inject(ApiService);
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
    this.getApi$ = this.getObservableForGet();

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

  protected executeGetDataEffects?(): void;

  protected submitData?(): Observable<Y>;

  protected abstract getObservableForGet(): Observable<T>;

  protected postSubmitActions?(): void;
}
