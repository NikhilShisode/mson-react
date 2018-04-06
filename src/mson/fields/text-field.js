import Field from './field';

export default class TextField extends Field {
  set(props) {
    super.set(props);
    this._setIfUndefined(
      props,
      'minLength',
      'maxLength',
      'minWords',
      'maxWords',
      'type'
    );
  }

  getOne(name) {
    const value = this._getIfAllowed(
      name,
      'minLength',
      'maxLength',
      'minWords',
      'maxWords',
      'type'
    );
    return value === undefined ? super.getOne(name) : value;
  }

  _toValidatorProps() {
    const value = this.get('value');

    return {
      ...super._toValidatorProps(),
      length: value ? value.length : null,
      words: value ? value.split(/\s+/).length : null
    };
  }

  validate() {
    super.validate();

    if (!this.isBlank()) {
      const minLength = this.get('minLength');
      const maxLength = this.get('maxLength');
      const value = this.getValue();

      if (minLength !== null && value.length < minLength) {
        this.setErr(`${minLength} characters or more`);
      } else if (maxLength !== null && value.length > maxLength) {
        this.setErr(`${maxLength} characters or less`);
      }
    }

    // TODO: minWords, maxWords
  }
}