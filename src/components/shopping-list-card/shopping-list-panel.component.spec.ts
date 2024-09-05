import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShoppingListPanelComponent } from './shopping-list-panel.component';

describe('ShoppingListPanelComponent', () => {
  let component: ShoppingListPanelComponent;
  let fixture: ComponentFixture<ShoppingListPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingListPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShoppingListPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
