// TODO:
//   - Refactor out setValues(), clearValues(), etc... and use set({ value: value }), etc...?

import Component from './component';
import _ from 'lodash';
import Validator from './validator';
import Mapa from './mapa';
import IdField from './fields/id-field';
import ButtonField from './fields/button-field';

export default class Form extends Component {
  _create(props) {
    super._create(props);
    this._fields = new Mapa();
    this._validators = [];
    this._createDefaultFields();
  }

  _createDefaultFields() {
    this.addField(new IdField({ name: 'id', label: 'Id', hidden: true }));
    // TODO: createdAt, updatedAt
  }

  copyFields(form) {
    form._fields.each(field => {
      this.addField(field);
    });
    this._emitChange('fields');
  }

  set(props) {
    super.set(props);

    if (props.fields !== undefined) {
      props.fields.forEach(field => {
        this.addField(field);
      });
      this._emitChange('fields');
    }

    if (props.form !== undefined) {
      this.copyFields(props.form);
    }

    if (props.validators !== undefined) {
      this._validators = [];
      props.validators.forEach(validator => {
        this.addValidator(validator);
      });
    }

    if (props.value !== undefined) {
      this.setValues(props.value);
    }

    if (props.editable !== undefined) {
      this.setEditable(props.editable);
    }

    if (props.clear === true) {
      this.clearValues();
    }

    if (props.reset === true) {
      this.reset();
    }

    // The pristine prop allows us to set the dirty prop for the form and all its fields. We keep
    // this separate from the dirty prop so that we can listen for dirty events on the fields and
    // change the dirty state without triggering an infinite loop.
    if (props.pristine !== undefined) {
      this.setDirty(!props.pristine);
    }

    this._setIfUndefined(
      props,
      'touched',
      'err',
      'dirty',
      'pristine',
      'access'
    );
  }

  _setField(field) {
    this._fields.set(field.get('name'), field);
  }

  // TODO: support field.beforeName
  addField(field) {
    this._setField(field);

    // TODO: need to consider that field already exists. Also need to worry about cleaning up any
    // existing listeners when this happens?

    field.on('value', () => {
      // We don't emit a value as we don't want to calculate the form value each time a field value
      // changes. Instead, you can simply call form.getValues();
      this._emitChange('values');
      this.validate();
    });

    field.on('touched', touched => {
      if (touched) {
        this.set({ touched: true });
      }
      this.validate();
    });

    field.on('err', err => {
      if (err) {
        this.set({ err: true });
      }
    });

    field.on('dirty', dirty => {
      if (dirty) {
        this.set({ dirty: true });
      }
    });

    field.on('click', () => {
      this._emitChange(field.get('name'));
    });
  }

  removeField(name) {
    const field = this.getField(name);

    this._fields.delete(name);

    // Prevent a listener leak
    field.removeAllListeners();
  }

  removeFieldsExcept(names) {
    this._fields.each((field, name) => {
      if (names.indexOf(name) === -1) {
        this.removeField(name);
      }
    });
  }

  getOne(name) {
    if (name === 'value') {
      return this.getValues();
    }

    const value = this._getIfAllowed(
      name,
      'fields',
      'validators',
      'touched',
      'err',
      'dirty',
      'pristine',
      'access'
    );
    return value === undefined ? super.getOne(name) : value;
  }

  getField(name) {
    const field = this._fields.get(name);
    if (!field) {
      throw new Error('missing field ' + name);
    } else {
      return field;
    }
  }

  getValues() {
    let values = {};
    this._fields.each(field => {
      if (field.get('out')) {
        values[field.get('name')] = field.get('value');
      }
    });
    return values;
  }

  setValues(values) {
    _.each(values, (value, name) => this.getField(name).setValue(value));
  }

  clearValues() {
    this._fields.each(field => field.clearValue());
  }

  clearErrs() {
    this.set({ err: null });
    this._fields.each(field => field.clearErr());
  }

  reset() {
    this.clearValues();
    this.clearErrs();
    this.set({ pristine: true });
    this.setTouched(false);
  }

  _toValidatorProps() {
    // TODO: should calc of these props be a little more dynamic? e.g. could make them a function so
    // that only calculated when matched by validators
    let props = {};
    this._fields.each(field => {
      props[field.get('name')] = field._toValidatorProps();
    });
    return props;
  }

  _validateWithValidators() {
    if (this._validators && this._validators.length > 0) {
      const validator = new Validator(this._toValidatorProps());
      const errors = validator.validate(this._validators);
      if (errors.length !== 0) {
        errors.forEach(error => {
          this.getField(error.field).setErr(error.error);
        });
      }
    }
  }

  canSubmit() {
    return !this.hasErrorForTouchedField() && this.get('dirty');
  }

  validate() {
    this.clearErrs();

    this._fields.each(field => field.validate());

    // TODO: should we also support functional validators? Probably as more powerful when working
    // just with JS. Other option is to extend form and define new validate().
    // this._validators.forEach(validator => validator(this));
    this._validateWithValidators();

    // Emit a canSubmit or cannotSubmit event so that we can adjust buttons, etc...
    this._emitChange(this.canSubmit() ? 'canSubmit' : 'cannotSubmit');
  }

  addValidator(validator) {
    this._validators.push(validator);
  }

  setTouched(touched) {
    this.set({ touched });
    this._fields.each(field => field.setTouched(touched));
  }

  setRequired(required) {
    this._fields.each(field => field.set({ required }));
  }

  setDisabled(disabled) {
    this._fields.each(field => field.set({ disabled }));
  }

  setEditable(editable) {
    this._fields.each(field => field.set({ editable }));
  }

  // TODO: remove and use set({ pristine }) instead?
  setDirty(dirty) {
    this.set({ dirty });
    this._fields.each(field => field.set({ dirty }));
  }

  setFullWidth(fullWidth) {
    this._fields.each(field => field.set({ fullWidth }));
  }

  clone() {
    const clonedForm = _.cloneDeep(this);

    // We need to use addField() and not _setField() as we need the listeners to be recreated
    clonedForm._fields.each(field => clonedForm.addField(field.clone()));

    return clonedForm;
  }

  getErrs() {
    let errs = [];
    this._fields.each(field => {
      const err = field.getErr();
      if (err) {
        errs.push({
          field: field.get('name'),
          error: err
        });
      }
    });
    return errs;
  }

  hasErr() {
    let hasErr = false;
    this._fields.each(field => {
      const err = field.getErr();
      if (err) {
        hasErr = true;
        return false;
      }
    });
    return hasErr;
  }

  // TODO: make this more efficient by using a prop that is set by the field listeners. This way the
  // value is cached.
  hasErrorForTouchedField() {
    let hasErr = false;
    this._fields.each(field => {
      if (field.get('touched') && field.getErr()) {
        hasErr = true;
        return false; // exit loop
      }
    });
    return hasErr;
  }

  submit() {
    // Simulat a click on the first ButtonField of type=submit
    this._fields.each(field => {
      if (field instanceof ButtonField) {
        if (field.get('type') === 'submit') {
          field.emitClick();
          return false; // exit loop
        }
      }
    });
  }
}