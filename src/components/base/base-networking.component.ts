import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseComponent } from './base.component';

@Component({
  template: '',
})
export abstract class BaseNetworkingComponent<T>
  extends BaseComponent
  implements OnInit, OnDestroy
{
  protected data!: T;

  override ngOnInit(): void {
    this.loading = true;
    super.ngOnInit();
    this.loadData();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected loadData(): void {
    this.getData().subscribe({
      next: (response) => {
        this.data = response;

        if (this.furtherDataActions) {
          this.furtherDataActions();
        }
        console.log(this.data);

        this.loading = false;
      },
    });
  }

  protected reloadData(): void {
    this.loadData();
  }

  protected furtherDataActions?(): void;

  protected abstract getData(): Observable<T>;
}
