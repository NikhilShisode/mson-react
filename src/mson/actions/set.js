import Action from './action';

export default class Set extends Action {
  set(props) {
    super.set(props);
    this._setIfUndefined(props, 'name', 'value');
  }

  getOne(name) {
    const value = this._getIfAllowed(name, 'name', 'value');
    return value === undefined ? super.getOne(name) : value;
  }

  _setProp(props) {
    const name = this.get('name');
    let names = name !== null ? name.split('.') : [];
    const value =
      this.get('value') === null ? props.arguments : this.get('value');
    if (!name) {
      // No name was specified to so pipe to next action
      return value;
    } else if (names.length === 1) {
      props.component.set({
        [name]: value
      });
    } else {
      let component = props.component.get(names[0]);
      for (let i = 1; i < names.length - 1; i++) {
        component = component.get(names[i]);
      }
      component.set({
        [names[names.length - 1]]: value
      });
    }
  }

  async act(props) {
    return this._setProp(props);
  }
}