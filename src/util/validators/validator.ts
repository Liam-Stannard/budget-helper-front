import { Validators } from '@angular/forms';
import { REGEX } from '../regex/regex';

export const moneyValidator = Validators.pattern(REGEX.money);
export const freeTextValidator = Validators.pattern(REGEX.freeText);
export const dateValidator = Validators.pattern(REGEX.date);
