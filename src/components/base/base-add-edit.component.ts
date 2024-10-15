import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseComponent } from './base.component';
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { BaseNetworkingComponent } from './base-networking.component';
import { APP_CONSTANTS } from '../../app/app.constants';

@Component({
  template: '',
})
export abstract class BaseInsertEditComponent<
    T,
    Y,
    U extends { [K in keyof U]: AbstractControl<any, any> },
    W
  >
  extends BaseNetworkingComponent<T, Y>
  implements OnInit, OnDestroy
{
  protected form!: FormGroup<U>;
  protected formData!: W;
  protected fb: FormBuilder;

  protected isEdit: boolean = true;

  constructor() {
    super();
    this.fb = inject(FormBuilder);

    this.isEdit = this.router.url.includes(APP_CONSTANTS.MODE_EDIT);

    this.shouldGetData = this.isEdit;
  }

  override ngOnInit(): void {
    this.form = this.formInit();
    super.ngOnInit();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  protected override furtherDataActions(): void {
    this.formData = this.mapGetResponseToFormData();
  }

  protected abstract mapGetResponseToFormData(): W;

  protected abstract formInit(): FormGroup<U>;
}
