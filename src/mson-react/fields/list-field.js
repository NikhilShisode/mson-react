// TODO: would it be better to have a create-composite-field, pass in the Field and reuse code?

import React from 'react';
import ListItemField from './list-item-field';
import attach from '../attach';

class ListField extends React.PureComponent {
  render() {
    const { component, help, allowDelete, useDisplayValue } = this.props;

    let fields = [];
    let first = true;

    component.eachField((field, index, last) => {
      let itemHelp = null;

      if (field.get('block')) {
        if (first) {
          itemHelp = help;
          first = false;
        }
      } else {
        if (last) {
          itemHelp = help;
        }
      }

      // We have to pass allowDelete as it is the allowDelete of the parent
      fields.push(
        <ListItemField
          component={field}
          key={index}
          allowDelete={allowDelete && !useDisplayValue}
          help={itemHelp}
        />
      );
    });

    return fields;
  }
}

// We want the component to update when we receive new fields
export default attach(['change', 'help', 'allowDelete', 'useDisplayValue'])(
  ListField
);
