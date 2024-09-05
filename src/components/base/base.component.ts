import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  template: '',
})
export abstract class BaseComponent<T> implements OnInit, OnDestroy {
  protected data!: T;
  protected loading = false;

  ngOnInit(): void {
    this.loading = true;
    console.log('BaseComponent - ngOnInit');
    this.getData();
  }

  ngOnDestroy(): void {}

  protected getData(): void {
    this.getObservable().subscribe({
      next: (response) => {
        this.data = response;

        if (this.furtherDataActions) {
          this.furtherDataActions();
        }

        this.loading = false;
      },
    });
  }

  protected furtherDataActions?(): void;

  protected abstract getObservable(): Observable<T>;
}
