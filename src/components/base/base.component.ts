import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  template: '',
})
export abstract class BaseComponent implements OnInit, OnDestroy {
  protected loading = false;

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
