import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Observable } from 'rxjs';
import { BaseComponent } from './base.component';
import { ApiService } from '../../services/api/api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
/**
 * @T - get request response
 * @Y - submit response
 */
@Component({
  template: '',
})
export abstract class BaseNetworkingComponent<T, Y>
  extends BaseComponent
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
      this.loadData();
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected loadData(): void {
    this.getApi$ = this.getData();

    this.getApi$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.getResponse = response;

        if (this.furtherDataActions) {
          this.furtherDataActions();
        }
        console.log(this.getResponse);

        this.loading = false;
      },
    });
  }

  protected reloadData(): void {
    this.loadData();
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

  protected furtherDataActions?(): void;

  protected submitData?(): Observable<Y>;

  protected abstract getData(): Observable<T>;

  protected postSubmitActions?(): void;
}
