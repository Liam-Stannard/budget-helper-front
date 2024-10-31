export class REGEX {
  static readonly money = /^\d*\.\d{2}$|^\d{1,32}$/;
  static readonly freeText = /^[A-Za-z]{1}[A-Za-z.,?!\- ]{0,31}$/;
  static readonly date = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/;
}
