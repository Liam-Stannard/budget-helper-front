import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionListComponent } from './transaction-list.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { signal, Signal } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MockAuthService } from '../../../../../test/mockService';
import { AuthService } from '../../../../core/auth/auth.service';
import { TransactionApiService } from '../../api/transaction-api.service';
import {
  ITransaction,
  IGetTransactionListResponse,
} from '../../shared/transaction.interface';

const transaction1: ITransaction = {
  id: 1,
  amount: '100.00',
  account: { id: 1, name: 'test' },
  category: 'FOOD',
  title: 'test',
  date: '2020-01-01',
};

export class MockApiService {}

describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionListComponent],
      providers: [
        provideAnimationsAsync(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useClass: MockAuthService,
        },
        {
          provide: ActivatedRoute,
          useValue: {},
        },
        {
          provide: TransactionApiService,
          useClass: MockApiService,
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the data source when tableData changes', () => {
    component.tableData = [transaction1];
    component.ngOnChanges({
      tableData: {
        previousValue: [],
        currentValue: [transaction1],
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component['dataSource'].data).toEqual([transaction1]);
  });

  it('should emit actionTriggered when a row action is clicked', () => {
    const emitSpy = jest.spyOn(component.actionTriggered, 'emit');

    component['onClickEmitAction']({
      action: 'ACTION_EDIT',
      item: transaction1,
    });

    expect(emitSpy).toHaveBeenCalledWith({
      action: 'ACTION_EDIT',
      item: transaction1,
    });
  });

  it('should emit pageChanged when the paginator fires', () => {
    const emitSpy = jest.spyOn(component.pageChanged, 'emit');
    const event = { pageIndex: 1, pageSize: 25, length: 100 };

    component['onPage'](event);

    expect(emitSpy).toHaveBeenCalledWith(event);
  });

  it('should emit sortChanged when the sort header fires', () => {
    const emitSpy = jest.spyOn(component.sortChanged, 'emit');
    const sort = { active: 'amount', direction: 'asc' as const };

    component['onSort'](sort);

    expect(emitSpy).toHaveBeenCalledWith(sort);
  });
});
